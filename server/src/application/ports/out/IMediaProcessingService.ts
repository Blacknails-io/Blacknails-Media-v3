export type MediaDateSource = 'exif' | 'mtime' | 'creation_time';

export interface MediaDateResult {
  dateTaken: Date;
  source: MediaDateSource;
}

export interface ImageMetadataResult {
  width: number;
  height: number;
  dateTaken?: Date;
  cameraMake?: string;
  cameraModel?: string;
  mimeType?: string;
  exif?: {
    cameraMake?: string;
    cameraModel?: string;
    lens?: string;
    focalLength?: string;
    fNumber?: string;
    exposureTime?: string;
    iso?: number;
    latitude?: number;
    longitude?: number;
  };
}

export interface VideoMetadataResult {
  width: number;
  height: number;
  durationSeconds: number;
  framerate: number;
  videoCodec?: string;
  audioCodec?: string;
  dateTaken?: Date;
  cameraMake?: string;
  cameraModel?: string;
  mimeType?: string;
  latitude?: number;
  longitude?: number;
}

export interface IMediaProcessingService {
  getDateWithSource(sourcePath: string): Promise<MediaDateResult>;
  extractImageMetadata(sourcePath: string): Promise<ImageMetadataResult>;
  extractVideoMetadata(sourcePath: string): Promise<VideoMetadataResult>;
  generateImagePreview(sourcePath: string, outputPath: string): Promise<void>;
  generateVideoPreview(sourcePath: string, outputPath: string): Promise<void>;
  generateVideoClipsPreview(sourcePath: string, outputPath: string): Promise<void>;
  extractFullMetadata(sourcePath: string): Promise<Record<string, any>>;
}
