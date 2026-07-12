import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import {
  IMediaProcessingService,
  ImageMetadataResult,
  MediaDateResult,
  VideoMetadataResult
} from '../../../application/ports/out/IMediaProcessingService.js';

const execFileAsync = promisify(execFile);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.3g2']);

export class CommandLineMediaProcessingService implements IMediaProcessingService {
  constructor() {}

  public async getDateWithSource(sourcePath: string): Promise<MediaDateResult> {
    const extension = path.extname(sourcePath).toLowerCase();

    if (IMAGE_EXTENSIONS.has(extension)) {
      const fields = ['DateTimeOriginal', 'CreateDate', 'ModifyDate'];
      try {
        const raw = await this.readExifTag(sourcePath, fields);
        const parsed = this.parseLooseDate(raw);
        if (parsed) {
          return { dateTaken: parsed, source: 'exif' };
        }
      } catch (e) {
        // Fallback to next method
      }
    }

    if (VIDEO_EXTENSIONS.has(extension)) {
      try {
        const raw = await this.readVideoCreationTime(sourcePath);
        const parsed = this.parseLooseDate(raw);
        if (parsed) {
          return { dateTaken: parsed, source: 'creation_time' };
        }
      } catch (e) {
        // Fallback to next method
      }
    }

    const stat = await fs.stat(sourcePath);
    return { dateTaken: stat.mtime, source: 'mtime' };
  }

  public async extractImageMetadata(sourcePath: string): Promise<ImageMetadataResult> {
    const metadata = await this.readExifJson(sourcePath);
    const dateResult = await this.getDateWithSource(sourcePath);
    const width = Number(metadata.ImageWidth || metadata.ImageWidthPixels || 0);
    const height = Number(metadata.ImageHeight || metadata.ImageHeightPixels || 0);
    const dateTaken = dateResult.dateTaken;

    return {
      width,
      height,
      dateTaken,
      cameraMake: this.toStringOrUndefined(metadata.Make),
      cameraModel: this.toStringOrUndefined(metadata.Model),
      mimeType: this.toStringOrUndefined(metadata.MIMEType),
      exif: {
        cameraMake: this.toStringOrUndefined(metadata.Make),
        cameraModel: this.toStringOrUndefined(metadata.Model),
        lens: this.toStringOrUndefined(metadata.LensModel || metadata.LensID),
        focalLength: this.toStringOrUndefined(metadata.FocalLength),
        fNumber: metadata.FNumber ? String(metadata.FNumber) : undefined,
        exposureTime: metadata.ExposureTime ? String(metadata.ExposureTime) : undefined,
        iso: metadata.ISO ? Number(metadata.ISO) : undefined,
        latitude: metadata.GPSLatitude !== undefined ? Number(metadata.GPSLatitude) : undefined,
        longitude: metadata.GPSLongitude !== undefined ? Number(metadata.GPSLongitude) : undefined
      }
    };
  }

  public async extractVideoMetadata(sourcePath: string): Promise<VideoMetadataResult> {
    const raw = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-show_format',
      sourcePath
    ]);

    const data = JSON.parse(raw.stdout || '{}') as any;
    const streams = Array.isArray(data.streams) ? data.streams : [];
    const videoStream = streams.find((stream: any) => stream.codec_type === 'video') || {};
    const audioStream = streams.find((stream: any) => stream.codec_type === 'audio') || {};
    const format = data.format || {};
    const tags = format.tags || {};
    const dateResult = await this.getDateWithSource(sourcePath);
    const exifMetadata = await this.readExifJson(sourcePath);

    return {
      width: Number(videoStream.width || 0),
      height: Number(videoStream.height || 0),
      durationSeconds: Number(format.duration || 0),
      framerate: this.parseFrameRate(videoStream.avg_frame_rate || videoStream.r_frame_rate),
      videoCodec: this.toStringOrUndefined(videoStream.codec_name),
      audioCodec: this.toStringOrUndefined(audioStream.codec_name),
      dateTaken: dateResult.dateTaken,
      cameraMake: this.toStringOrUndefined(tags['com.apple.quicktime.make'] || tags.make || exifMetadata.Make),
      cameraModel: this.toStringOrUndefined(tags['com.apple.quicktime.model'] || tags.model || exifMetadata.Model),
      mimeType: this.mimeFromFormatName(format.format_name),
      latitude: exifMetadata.GPSLatitude !== undefined ? Number(exifMetadata.GPSLatitude) : undefined,
      longitude: exifMetadata.GPSLongitude !== undefined ? Number(exifMetadata.GPSLongitude) : undefined
    };
  }

  public async extractFullMetadata(sourcePath: string): Promise<Record<string, any>> {
    const extension = path.extname(sourcePath).toLowerCase();
    if (VIDEO_EXTENSIONS.has(extension)) {
      try {
        const raw = await execFileAsync('ffprobe', [
          '-v', 'quiet',
          '-print_format', 'json',
          '-show_format',
          '-show_streams',
          sourcePath
        ]);
        const parsed = JSON.parse(raw.stdout || '{}');
        const exif = await this.readExifJson(sourcePath).catch(() => ({}));
        return { ffprobe: parsed, exif };
      } catch (e) {
        return { error: 'Failed to extract video metadata', details: String(e) };
      }
    } else {
      return this.readExifJson(sourcePath).catch(() => ({}));
    }
  }

  private async convertImageToWebp(sourcePath: string, optimizedPath: string): Promise<void> {
    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-i', sourcePath,
        '-vcodec', 'libwebp',
        '-lossless', '0',
        '-compression_level', '6',
        '-q:v', '80',
        '-preset', 'picture',
        optimizedPath
      ]);
    } catch (error: any) {
      if (error.stderr) {
        // Extraer solo la última parte relevante del error (quitando el banner)
        const lines = error.stderr.split('\n').filter((l: string) => l.trim() !== '' && !l.startsWith('ffmpeg version') && !l.startsWith('  built with') && !l.startsWith('  configuration:'));
        const shortMsg = lines.slice(-5).join(' | ');
        throw new Error(`FFMPEG Error: ${shortMsg}`);
      }
      throw error;
    }
  }

  private async convertVideoToMp4(sourcePath: string, optimizedPath: string): Promise<void> {
    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-i', sourcePath,
        '-map_metadata', '0',
        '-c:v', 'libx264',
        '-crf', '23',
        '-preset', 'medium',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        optimizedPath
      ]);
    } catch (error: any) {
      if (error.stderr) {
        const lines = error.stderr.split('\n').filter((l: string) => l.trim() !== '' && !l.startsWith('ffmpeg version') && !l.startsWith('  built with') && !l.startsWith('  configuration:'));
        const shortMsg = lines.slice(-5).join(' | ');
        throw new Error(`FFMPEG Error: ${shortMsg}`);
      }
      throw error;
    }
  }

  private async copyMetadataFromOriginal(sourcePath: string, targetPath: string): Promise<void> {
    try {
      await execFileAsync('exiftool', [
        '-TagsFromFile', sourcePath,
        '-all:all',
        '-overwrite_original',
        targetPath
      ]);
    } catch (error: any) {
      if (error?.code === 1) {
        return;
      }
      throw error;
    }
  }

  private async readExifJson(sourcePath: string): Promise<Record<string, any>> {
    const result = await execFileAsync('exiftool', ['-json', '-n', sourcePath]);
    const parsed = JSON.parse(result.stdout || '[]');
    return Array.isArray(parsed) && parsed[0] ? parsed[0] : {};
  }

  private async readExifTag(sourcePath: string, fields: string[]): Promise<string | undefined> {
    const result = await execFileAsync('exiftool', ['-s', '-s', '-s', ...fields.flatMap((field) => ['-' + field]), sourcePath]);
    const output = (result.stdout || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    return output || undefined;
  }

  private async readVideoCreationTime(sourcePath: string): Promise<string | undefined> {
    const result = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_entries', 'format_tags=creation_time',
      sourcePath
    ]);
    const data = JSON.parse(result.stdout || '{}') as any;
    return data?.format?.tags?.creation_time || undefined;
  }

  private parseLooseDate(raw?: string): Date | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const isoLike = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
    if (isoLike) {
      const [, y, m, d, hh, mm, ss] = isoLike;
      const parsed = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const exifMatch = trimmed.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (exifMatch) {
      const [, y, m, d, hh, mm, ss] = exifMatch;
      const parsed = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  private parseFrameRate(raw?: string): number {
    if (!raw) return 0;
    if (raw.includes('/')) {
      const [num, den] = raw.split('/').map((part) => Number(part));
      return den ? num / den : num;
    }
    return Number(raw) || 0;
  }

  private mimeFromFormatName(formatName?: string): string | undefined {
    if (!formatName) return undefined;
    const primary = formatName.split(',')[0]?.trim();
    if (!primary) return undefined;
    if (primary === 'mov' || primary === 'mp4' || primary === 'm4v') return 'video/mp4';
    if (primary === 'matroska' || primary === 'webm') return primary === 'webm' ? 'video/webm' : 'video/x-matroska';
    return undefined;
  }

  private toStringOrUndefined(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async removeFileIfExists(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  public async generateImagePreview(sourcePath: string, outputPath: string): Promise<void> {
    try {
      const sharp = (await import('sharp')).default;
      await sharp(sourcePath)
        .resize(640, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);
    } catch (error) {
      console.warn(`[CommandLineMediaProcessingService] Sharp failed for ${sourcePath}, falling back to ffmpeg...`, error);
      await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', sourcePath, '-vf', 'scale=640:-2', '-frames:v', '1', outputPath]);
    }
  }

  public async generateVideoPreview(sourcePath: string, outputPath: string): Promise<void> {
    await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', sourcePath, '-vf', 'thumbnail,scale=640:-2', '-frames:v', '1', outputPath]);
  }

  public async generateVideoClipsPreview(sourcePath: string, outputPath: string): Promise<void> {
    const metadata = await this.extractVideoMetadata(sourcePath);
    const duration = metadata.durationSeconds;

    if (duration < 5) {
      await execFileAsync('ffmpeg', [
        '-v', 'error', '-y', '-i', sourcePath,
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
      const extractOpts = ['-v', 'error', '-y', '-t', '1.5', '-i', sourcePath, '-vf', 'scale=640:-2', '-c:v', 'libx264', '-preset', 'fast', '-crf', '28', '-an'];
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
