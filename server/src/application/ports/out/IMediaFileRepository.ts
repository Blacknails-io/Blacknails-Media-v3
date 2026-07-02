import { MediaFile } from '../../../domain/entities/MediaFile.js';

export interface IMediaFileRepository {
  save(mediaFile: MediaFile): Promise<void>;
  getById(id: string): Promise<MediaFile | null>;
  getByAssetId(assetId: string): Promise<MediaFile[]>;
  getOrphans(): Promise<MediaFile[]>;
  getByPath(path: string): Promise<MediaFile | null>;
  getByFileHash(fileHash: string): Promise<MediaFile | null>;
  delete(mediaId: string): Promise<void>;
  detachAllOriginals(): Promise<number>;
  getAll(): Promise<MediaFile[]>;
}

