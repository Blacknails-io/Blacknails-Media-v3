import { promisify } from 'util';
import { execFile } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { Asset } from '../../domain/entities/Asset.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { BaseAssetWorker } from './BaseAssetWorker.js';

const execFileAsync = promisify(execFile);

export class ThumbnailTaskRunner extends BaseAssetWorker {
  public readonly id = 'thumbnail-worker';
  public readonly label = 'Thumbnail Generation';
  public readonly provides = ['thumbnails'];
  public readonly requires = ['assets'];

  constructor(
    eventBus: IEventBus,
    uow: IUnitOfWork,
    public readonly intervalMs: number,
    private readonly thumbsDir: string
  ) {
    super(eventBus, uow);
  }

  protected isPending(asset: Asset): boolean {
    return !asset.thumbnailPath;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const mediaFiles = await this.uow.mediaFiles.getByAssetId(asset.id);
    const original = mediaFiles.find((media) => media.role === 'ORIGINAL');
    if (!original) return;

    const shard = original.fileHash.slice(0, 2);
    const outputDir = path.join(this.thumbsDir, shard);
    await fs.mkdir(outputDir, { recursive: true });

    const thumbPath = path.join(outputDir, `${asset.id}.webp`);
    const aiThumbPath = path.join(outputDir, `${asset.id}.ai.webp`);
    let previewPath = asset.assetType === 'VIDEO' ? path.join(outputDir, `${asset.id}.preview.mp4`) : undefined;

    if (asset.assetType === 'VIDEO') {
      await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', original.currentPath, '-vf', 'thumbnail,scale=640:-2', '-frames:v', '1', thumbPath]);
      try {
        await this.generateVideoPreview(original.currentPath, previewPath!);
      } catch (err) {
        console.error(`[ThumbnailTaskRunner] Error generating video preview for ${asset.id}:`, err);
        previewPath = undefined;
        // The static thumbnail succeeded, so we won't crash the batch just because the preview failed.
      }
    } else {
      await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', original.currentPath, '-vf', 'scale=640:-2', '-frames:v', '1', thumbPath]);
    }

    await fs.copyFile(thumbPath, aiThumbPath);

    asset.thumbnailPath = thumbPath;
    asset.aiThumbnailPath = aiThumbPath;
    asset.videoPreviewPath = previewPath;
    await this.uow.assets.save(asset);
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
      // Step 1: Extract and scale the 3 clips (fast seek)
      const extractOpts = ['-v', 'error', '-y', '-t', '1.5', '-i', inputPath, '-vf', 'scale=640:-2', '-c:v', 'libx264', '-preset', 'fast', '-crf', '28', '-an'];
      await execFileAsync('ffmpeg', ['-ss', t1, ...extractOpts, clip1]);
      await execFileAsync('ffmpeg', ['-ss', t2, ...extractOpts, clip2]);
      await execFileAsync('ffmpeg', ['-ss', t3, ...extractOpts, clip3]);

      // Step 2: Create concat list
      const concatContent = `file '${clip1}'\nfile '${clip2}'\nfile '${clip3}'\n`;
      await fs.writeFile(concatList, concatContent);

      // Step 3: Concat clips safely without re-encoding
      await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', outputPath]);
    } finally {
      // Cleanup temp files
      await Promise.all([
        fs.unlink(clip1).catch(() => {}),
        fs.unlink(clip2).catch(() => {}),
        fs.unlink(clip3).catch(() => {}),
        fs.unlink(concatList).catch(() => {})
      ]);
    }
  }
}
