import { IAssetRepository } from '../ports/out/IAssetRepository.js';
import { IMediaFileRepository } from '../ports/out/IMediaFileRepository.js';
import { IGetAssetsQuery, AssetDto } from '../ports/in/IGetAssetsQuery.js';
import { Asset, Photo, Video } from '../../domain/entities/Asset.js';
import path from 'path';

export class GetAssetsUseCase implements IGetAssetsQuery {
  constructor(
    private assetRepository: IAssetRepository,
    private mediaFileRepository: IMediaFileRepository,
    private originalsDir: string,
    private storageDir: string
  ) {}

  public async execute(): Promise<AssetDto[]> {
    const assets = await this.assetRepository.getAll();
    return Promise.all(assets.map(async (asset) => this.mapToDto(asset)));
  }

  public async mapToDto(asset: Asset): Promise<AssetDto> {
    const type = asset.assetType;
    let resolution = 'UNKNOWN';
    let durationStr = undefined;
    
    if (type === 'PHOTO') {
      const photo = asset as Photo;
      if (photo.resolution) {
        resolution = `${photo.resolution.width}x${photo.resolution.height}`;
      }
    } else if (type === 'VIDEO') {
      const video = asset as Video;
      if (video.resolution) {
        resolution = `${video.resolution.width}x${video.resolution.height}`;
      }
      durationStr = `${video.durationSeconds}s`;
    }

    const gpsStr = asset.location 
      ? `${asset.location.latitude.toFixed(4)}, ${asset.location.longitude.toFixed(4)}`
      : undefined;
    const mediaFiles = await this.mediaFileRepository.getByAssetId(asset.id);
    const original = mediaFiles.find((media) => media.role === 'ORIGINAL');
    const imageUrl = this.resolveImageUrl(asset, original?.currentPath);
    const videoPreviewUrl = this.resolveVideoPreviewUrl(asset.videoPreviewPath);
    const originalUrl = this.resolveOriginalUrl(original?.currentPath);
    const title = asset.title?.trim() || `${type === 'PHOTO' ? 'Foto' : 'Video'} ${asset.dateTaken.slice(0, 10)}`;
    const description = asset.aiDescription?.trim() || `Indexado: ${asset.indexedAt || 'N/A'}`;
    const tags = asset.tags?.length ? asset.tags : [type.toLowerCase()];

    return {
      id: asset.id,
      title,
      type: type,
      description,
      tags,
      date: asset.dateTaken,
      imageUrl,
      videoPreviewUrl,
      originalUrl,
      clearance: 'LEVEL_1', // Fictitious for UI consistency
      metadata: {
        resolution: resolution !== 'UNKNOWN' ? resolution : undefined,
        duration: durationStr,
        gpsCoords: gpsStr,
        encryption: 'AES-256',
        fileSize: original ? this.formatFileSize(original.fileSize) : 'UNKNOWN',
      }
    };
  }

  private resolveOriginalUrl(originalPath?: string): string {
    if (!originalPath) return '/placeholder.jpg';
    const absolute = path.resolve(originalPath);
    const originalsRoot = path.resolve(this.originalsDir);
    if (absolute.startsWith(originalsRoot + path.sep) || absolute === originalsRoot) {
      const relative = path.relative(originalsRoot, absolute).split(path.sep).join('/');
      return `/api/media/originals/${relative}`;
    }
    return '/placeholder.jpg';
  }

  public resolvePathUrl(candidate: string): string {
    if (!candidate) return '/placeholder.jpg';

    const normalizedLibraryUrl = this.resolveLibraryUrl(candidate);
    if (normalizedLibraryUrl) {
      return normalizedLibraryUrl;
    }

    const absolute = path.resolve(candidate);
    const originalsRoot = path.resolve(this.originalsDir);
    const storageRoot = path.resolve(this.storageDir);

    if (absolute.startsWith(originalsRoot + path.sep) || absolute === originalsRoot) {
      const relative = path.relative(originalsRoot, absolute).split(path.sep).join('/');
      return `/api/media/originals/${relative}`;
    }

    if (absolute.startsWith(storageRoot + path.sep) || absolute === storageRoot) {
      const relative = path.relative(storageRoot, absolute).split(path.sep).join('/');
      return `/api/media/storage/${relative}`;
    }

    return '/placeholder.jpg';
  }

  private resolveImageUrl(asset: Asset, originalPath?: string): string {
    const candidate = asset.assetType === 'VIDEO'
      ? (asset.aiThumbnailPath || asset.thumbnailPath)
      : (asset.aiThumbnailPath || asset.thumbnailPath || originalPath);
    return this.resolvePathUrl(candidate || '');
  }

  private resolveLibraryUrl(candidatePath: string): string | null {
    const normalized = candidatePath.replace(/\\/g, '/');
    const originalsMarker = '/library/originals/';
    const storageMarker = '/library/storage/';

    const originalsIndex = normalized.indexOf(originalsMarker);
    if (originalsIndex >= 0) {
      const relative = normalized.slice(originalsIndex + originalsMarker.length);
      return relative ? `/api/media/originals/${relative}` : '/api/media/originals';
    }

    const storageIndex = normalized.indexOf(storageMarker);
    if (storageIndex >= 0) {
      const relative = normalized.slice(storageIndex + storageMarker.length);
      return relative ? `/api/media/storage/${relative}` : '/api/media/storage';
    }

    return null;
  }

  private resolveVideoPreviewUrl(previewPath?: string): string | undefined {
    if (!previewPath) return undefined;
    const relative = path.relative(this.storageDir, previewPath);
    return `/api/media/storage/${relative.split(path.sep).join('/')}`;
  }

  private formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return 'UNKNOWN';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    const decimals = value >= 10 || unitIndex === 0 ? 0 : 1;
    return `${value.toFixed(decimals)} ${units[unitIndex]}`;
  }
}
