import { promisify } from 'util';
import { execFile } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { Asset } from '../../domain/entities/Asset.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { BaseAssetWorker } from './BaseAssetWorker.js';

const execFileAsync = promisify(execFile);

abstract class MediaDerivativeTaskRunner extends BaseAssetWorker {
  constructor(
    eventBus: IEventBus,
    uow: IUnitOfWork,
    public readonly intervalMs: number,
    protected readonly thumbsDir: string
  ) {
    super(eventBus, uow);
  }

  protected async getOriginal(asset: Asset) {
    const mediaFiles = await this.uow.mediaFiles.getByAssetId(asset.id);
    return mediaFiles.find((media) => media.role === 'ORIGINAL');
  }

  protected async getOutputDir(fileHash: string): Promise<string> {
    const shard = fileHash.slice(0, 2);
    const outputDir = path.join(this.thumbsDir, shard);
    await fs.mkdir(outputDir, { recursive: true });
    return outputDir;
  }
}

export class ImagePreviewTaskRunner extends MediaDerivativeTaskRunner {
  public readonly id = 'image-preview-worker';
  public readonly label = 'Image Preview';
  public readonly provides = ['image_previews'];
  public readonly requires = ['assets'];

  protected isPending(asset: Asset): boolean {
    return asset.assetType === 'PHOTO' && !asset.thumbnailPath;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const original = await this.getOriginal(asset);
    if (!original) return;

    const outputDir = await this.getOutputDir(original.fileHash);
    const thumbPath = path.join(outputDir, `${asset.id}.webp`);

    await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', original.currentPath, '-vf', 'scale=640:-2', '-frames:v', '1', thumbPath]);

    asset.thumbnailPath = thumbPath;
    await this.uow.assets.save(asset);
  }
}

export class ImageTranscodeTaskRunner extends MediaDerivativeTaskRunner {
  public readonly id = 'image-transcode-worker';
  public readonly label = 'Image Transcode';
  public readonly provides = ['image_transcodes'];
  public readonly requires = ['image_previews'];

  protected isPending(asset: Asset): boolean {
    return asset.assetType === 'PHOTO' && Boolean(asset.thumbnailPath) && !asset.aiThumbnailPath;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    if (!asset.thumbnailPath) return;

    const original = await this.getOriginal(asset);
    if (!original) return;

    const outputDir = await this.getOutputDir(original.fileHash);
    const aiThumbPath = path.join(outputDir, `${asset.id}.ai.webp`);

    await fs.copyFile(asset.thumbnailPath, aiThumbPath);

    asset.aiThumbnailPath = aiThumbPath;
    await this.uow.assets.save(asset);
  }
}

export class VideoPreviewTaskRunner extends MediaDerivativeTaskRunner {
  public readonly id = 'video-preview-worker';
  public readonly label = 'Video Preview';
  public readonly provides = ['video_previews'];
  public readonly requires = ['assets'];

  protected isPending(asset: Asset): boolean {
    return asset.assetType === 'VIDEO' && !asset.thumbnailPath;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const original = await this.getOriginal(asset);
    if (!original) return;

    const outputDir = await this.getOutputDir(original.fileHash);
    const thumbPath = path.join(outputDir, `${asset.id}.webp`);
    const aiThumbPath = path.join(outputDir, `${asset.id}.ai.webp`);

    await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', original.currentPath, '-vf', 'thumbnail,scale=640:-2', '-frames:v', '1', thumbPath]);
    await fs.copyFile(thumbPath, aiThumbPath);

    asset.thumbnailPath = thumbPath;
    asset.aiThumbnailPath = aiThumbPath;
    await this.uow.assets.save(asset);
  }
}

export class VideoTranscodeTaskRunner extends MediaDerivativeTaskRunner {
  public readonly id = 'video-transcode-worker';
  public readonly label = 'Video Transcode';
  public readonly provides = ['video_transcodes'];
  public readonly requires = ['video_previews'];

  protected isPending(asset: Asset): boolean {
    return asset.assetType === 'VIDEO' && Boolean(asset.thumbnailPath) && !asset.videoPreviewPath;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const original = await this.getOriginal(asset);
    if (!original) return;

    const outputDir = await this.getOutputDir(original.fileHash);
    const previewPath = path.join(outputDir, `${asset.id}.preview.mp4`);

    try {
      await this.generateVideoPreview(original.currentPath, previewPath);
      asset.videoPreviewPath = previewPath;
      await this.uow.assets.save(asset);
    } catch (err) {
      console.error(`[VideoTranscodeTaskRunner] Error generating video preview for ${asset.id}:`, err);
    }
  }

  private async getVideoDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
      ]);
      const duration = parseFloat(stdout.trim());
      return isNaN(duration) ? 0 : duration;
    } catch {
      return 0;
    }
  }

  private async generateVideoPreview(inputPath: string, outputPath: string): Promise<void> {
    const duration = await this.getVideoDuration(inputPath);

    if (duration < 5) {
      await execFileAsync('ffmpeg', [
        '-v', 'error', '-y', '-i', inputPath,
        '-ss', '00:00:00', '-t', '3',
        '-vf', 'scale=640:-2', '-an', outputPath
      ]);
      return;
    }

    const t1 = Math.max(0, duration * 0.15).toFixed(2);
    const t2 = Math.max(0, duration * 0.50).toFixed(2);
    const t3 = Math.max(0, duration * 0.80).toFixed(2);

    const tmpDir = path.dirname(outputPath);
    const baseName = path.basename(outputPath, '.mp4');
    const clip1 = path.join(tmpDir, `${baseName}_1.mp4`);
    const clip2 = path.join(tmpDir, `${baseName}_2.mp4`);
    const clip3 = path.join(tmpDir, `${baseName}_3.mp4`);
    const concatList = path.join(tmpDir, `${baseName}_list.txt`);

    try {
      const extractOpts = ['-v', 'error', '-y', '-t', '1.5', '-i', inputPath, '-vf', 'scale=640:-2', '-c:v', 'libx264', '-preset', 'fast', '-crf', '28', '-an'];
      await execFileAsync('ffmpeg', ['-ss', t1, ...extractOpts, clip1]);
      await execFileAsync('ffmpeg', ['-ss', t2, ...extractOpts, clip2]);
      await execFileAsync('ffmpeg', ['-ss', t3, ...extractOpts, clip3]);

      const concatContent = `file '${clip1}'\nfile '${clip2}'\nfile '${clip3}'\n`;
      await fs.writeFile(concatList, concatContent);

      await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', outputPath]);
    } finally {
      await Promise.all([
        fs.unlink(clip1).catch(() => {}),
        fs.unlink(clip2).catch(() => {}),
        fs.unlink(clip3).catch(() => {}),
        fs.unlink(concatList).catch(() => {})
      ]);
    }
  }
}
