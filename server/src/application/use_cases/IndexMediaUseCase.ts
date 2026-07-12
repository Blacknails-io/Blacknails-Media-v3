import path from 'path';
import { promises as fs } from 'fs';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import {
  ImageMetadataResult,
  IMediaProcessingService,
  VideoMetadataResult
} from '../ports/out/IMediaProcessingService.js';
import { Asset, Photo, Video } from '../../domain/entities/Asset.js';
import { MediaFile, OriginalFile } from '../../domain/entities/MediaFile.js';
import { IIndexMediaUseCase, IndexMediaRequest, IndexMediaResponse } from '../ports/in/IIndexMediaUseCase.js';
import { AssetDomainEvent, IndexRejectedEvent, MediaIndexedEvent } from '../events/SystemEvents.js';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.3g2']);
type IndexedAssetType = 'VIDEO' | 'PHOTO';

export class IndexMediaUseCase implements IIndexMediaUseCase {
  private static readonly inFlight = new Map<string, Promise<IndexMediaResponse>>();
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly mediaProcessing: IMediaProcessingService,
    private readonly eventBus: IEventBus,
    private readonly sidecarsDir: string
  ) {}

  public async execute(request: IndexMediaRequest): Promise<IndexMediaResponse> {
    const current = IndexMediaUseCase.inFlight.get(request.mediaFileId);
    if (current) return current;

    const pending = this.executeOnce(request).finally(() => {
      IndexMediaUseCase.inFlight.delete(request.mediaFileId);
    });
    IndexMediaUseCase.inFlight.set(request.mediaFileId, pending);
    return pending;
  }

  private async executeOnce(request: IndexMediaRequest): Promise<IndexMediaResponse> {
    const mediaFile = await this.uow.mediaFiles.getById(request.mediaFileId);
    if (!mediaFile) {
      throw new Error(`MediaFile not found: ${request.mediaFileId}`);
    }

    if (mediaFile.assetId) {
      const assetType = VIDEO_EXTENSIONS.has(mediaFile.extension.toLowerCase()) ? 'VIDEO' : 'PHOTO';
      return {
        assetId: mediaFile.assetId,
        mediaFileId: mediaFile.id,
        assetType
      };
    }

    const existingAsset = await this.uow.assets.getByOriginalFileHash(mediaFile.fileHash);
    if (existingAsset) {
      mediaFile.assetId = existingAsset.id;
      await this.uow.runTransaction(async (tx) => {
        await tx.mediaFiles.save(mediaFile);
      });
      return {
        assetId: existingAsset.id,
        mediaFileId: mediaFile.id,
        assetType: existingAsset.assetType
      };
    }

    const assetType = this.getAssetType(mediaFile);
    const indexedAt = new Date().toISOString();

    if (assetType === 'VIDEO') {
      const metadata = await this.extractVideoMetadata(mediaFile);
      const dateTaken = metadata.dateTaken || (await this.mediaProcessing.getDateWithSource(mediaFile.currentPath)).dateTaken;
      const asset = new Video({
        title: this.getOriginalFilename(mediaFile),
        dateTaken: dateTaken.toISOString(),
        timezoneOffset: 'Z',
        indexedAt,
        resolution: metadata.width && metadata.height ? { width: metadata.width, height: metadata.height } : undefined,
        durationSeconds: metadata.durationSeconds,
        framerate: metadata.framerate,
        videoCodec: metadata.videoCodec,
        audioCodec: metadata.audioCodec,
        location: metadata.latitude !== undefined && metadata.longitude !== undefined ? {
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          altitude: 0
        } : undefined
      });

      const currentMediaFile = await this.uow.mediaFiles.getById(mediaFile.id);
      if (currentMediaFile?.assetId) {
        return { assetId: currentMediaFile.assetId, mediaFileId: mediaFile.id, assetType };
      }

      mediaFile.assetId = asset.id;
      this.recordAssetCreated(asset, `Asset de vídeo creado desde: ${mediaFile.currentPath}`);

      await this.uow.runTransaction(async (tx) => {
        await tx.assets.save(asset);
        await tx.mediaFiles.save(mediaFile);
      });

      await this.writeAssetSidecar(asset);

      await this.eventBus.publish(new MediaIndexedEvent(
        'IndexMediaUseCase',
        `Archivo indexado como vídeo: ${mediaFile.currentPath}`,
        mediaFile.id
      ));

      return { assetId: asset.id, mediaFileId: mediaFile.id, assetType };
    }

    const metadata = await this.extractImageMetadata(mediaFile);
    const dateTaken = metadata.dateTaken || (await this.mediaProcessing.getDateWithSource(mediaFile.currentPath)).dateTaken;
    const asset = new Photo({
      title: this.getOriginalFilename(mediaFile),
      dateTaken: dateTaken.toISOString(),
      timezoneOffset: 'Z',
      indexedAt,
      resolution: metadata.width && metadata.height ? { width: metadata.width, height: metadata.height } : undefined,
      exif: metadata.exif ? {
        cameraMake: metadata.exif.cameraMake,
        cameraModel: metadata.exif.cameraModel,
        lens: metadata.exif.lens,
        focalLength: metadata.exif.focalLength,
        fNumber: metadata.exif.fNumber,
        exposureTime: metadata.exif.exposureTime,
        iso: metadata.exif.iso
      } : undefined,
      location: metadata.exif?.latitude !== undefined && metadata.exif?.longitude !== undefined ? {
        latitude: metadata.exif.latitude,
        longitude: metadata.exif.longitude,
        altitude: 0
      } : undefined
    });

    const currentMediaFile = await this.uow.mediaFiles.getById(mediaFile.id);
    if (currentMediaFile?.assetId) {
      return { assetId: currentMediaFile.assetId, mediaFileId: mediaFile.id, assetType };
    }

    mediaFile.assetId = asset.id;
    this.recordAssetCreated(asset, `Asset de foto creado desde: ${mediaFile.currentPath}`);

    await this.uow.runTransaction(async (tx) => {
      await tx.assets.save(asset);
      await tx.mediaFiles.save(mediaFile);
    });

    await this.writeAssetSidecar(asset);

    await this.eventBus.publish(new MediaIndexedEvent(
      'IndexMediaUseCase',
      `Archivo indexado como foto: ${mediaFile.currentPath}`,
      mediaFile.id
    ));

    return { assetId: asset.id, mediaFileId: mediaFile.id, assetType };
  }

  private getAssetType(mediaFile: MediaFile): IndexedAssetType {
    return VIDEO_EXTENSIONS.has(mediaFile.extension.toLowerCase()) ? 'VIDEO' : 'PHOTO';
  }

  private getOriginalFilename(mediaFile: MediaFile): string | undefined {
    return mediaFile instanceof OriginalFile ? mediaFile.originalFilename : undefined;
  }

  private async extractVideoMetadata(mediaFile: MediaFile): Promise<VideoMetadataResult> {
    try {
      const metadata = await this.mediaProcessing.extractVideoMetadata(mediaFile.currentPath);
      if (metadata.mimeType && !metadata.mimeType.startsWith('video/')) {
        throw new Error(`Content mismatch: expected video but got ${metadata.mimeType}`);
      }
      return metadata;
    } catch (error) {
      return await this.rejectCorruptedMedia(mediaFile, 'video', error);
    }
  }

  private async extractImageMetadata(mediaFile: MediaFile): Promise<ImageMetadataResult> {
    try {
      const metadata = await this.mediaProcessing.extractImageMetadata(mediaFile.currentPath);
      if (metadata.mimeType && !metadata.mimeType.startsWith('image/')) {
        throw new Error(`Content mismatch: expected image but got ${metadata.mimeType}`);
      }
      return metadata;
    } catch (error) {
      return await this.rejectCorruptedMedia(mediaFile, 'archivo', error);
    }
  }

  private async rejectCorruptedMedia(mediaFile: MediaFile, label: 'archivo' | 'video', error: unknown): Promise<never> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[IndexMediaUseCase] ${label} corrupto o desajustado, descartando: ${mediaFile.currentPath}`, errorMessage);
    await this.eventBus.publish(new IndexRejectedEvent(
      'IndexMediaUseCase',
      `El ${label} está corrupto o su contenido no coincide con la extensión: ${path.basename(mediaFile.currentPath)}`,
      mediaFile.id,
      undefined,
      errorMessage
    ));
    await this.uow.runTransaction(async (tx) => {
      await tx.mediaFiles.delete(mediaFile.id);
    });
    await fs.unlink(mediaFile.currentPath).catch(() => undefined);
    throw new Error(`Discarded corrupted/mismatched file: ${mediaFile.currentPath}`);
  }

  private recordAssetCreated(asset: Asset, message: string): void {
    asset.recordDomainEvent(new AssetDomainEvent(
      asset.id,
      'CREATED',
      'IndexMediaUseCase',
      message
    ));
  }

  private async writeAssetSidecar(asset: Asset): Promise<void> {
    const shard = asset.id.slice(0, 2);
    const sidecarFolder = path.join(this.sidecarsDir, shard);
    const sidecarPath = path.join(sidecarFolder, `${asset.id}.meta.json`);
    
    try {
      await fs.mkdir(sidecarFolder, { recursive: true });
      const payload = {
        id: asset.id,
        title: asset.title,
        description: asset.aiDescription,
        tags: asset.tags,
        isNsfw: asset.isNsfw,
        createdAt: new Date().toISOString()
      };
      await fs.writeFile(sidecarPath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (error) {
      console.warn(`[IndexMediaUseCase] No se pudo escribir sidecar para asset ${asset.id}`, error);
    }
  }
}
