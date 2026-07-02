import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { IMediaProcessingService } from '../ports/out/IMediaProcessingService.js';
import { Photo, Video } from '../../domain/entities/Asset.js';
import { MediaFile } from '../../domain/entities/MediaFile.js';
import { IIndexMediaUseCase, IndexMediaRequest, IndexMediaResponse } from '../ports/in/IIndexMediaUseCase.js';
import { MediaIndexedEvent } from '../events/SystemEvents.js';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.3g2']);

export class IndexMediaUseCase implements IIndexMediaUseCase {
  private static readonly inFlight = new Map<string, Promise<IndexMediaResponse>>();
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly mediaProcessing: IMediaProcessingService,
    private readonly eventBus: IEventBus
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

    const assetType = VIDEO_EXTENSIONS.has(mediaFile.extension.toLowerCase()) ? 'VIDEO' : 'PHOTO';
    const indexedAt = new Date().toISOString();

    if (assetType === 'VIDEO') {
      const metadata = await this.mediaProcessing.extractVideoMetadata(mediaFile.currentPath);
      const dateTaken = metadata.dateTaken || (await this.mediaProcessing.getDateWithSource(mediaFile.currentPath)).dateTaken;
      const asset = new Video({
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
      await this.uow.runTransaction(async (tx) => {
        await tx.assets.save(asset);
        await tx.mediaFiles.save(mediaFile);
      });

      await this.eventBus.publish(new MediaIndexedEvent(
        'IndexMediaUseCase',
        `Archivo indexado como vídeo: ${mediaFile.currentPath}`,
        mediaFile.id
      ));

      return { assetId: asset.id, mediaFileId: mediaFile.id, assetType };
    }

    const metadata = await this.mediaProcessing.extractImageMetadata(mediaFile.currentPath);
    const dateTaken = metadata.dateTaken || (await this.mediaProcessing.getDateWithSource(mediaFile.currentPath)).dateTaken;
    const asset = new Photo({
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
    await this.uow.runTransaction(async (tx) => {
      await tx.assets.save(asset);
      await tx.mediaFiles.save(mediaFile);
    });

    await this.eventBus.publish(new MediaIndexedEvent(
      'IndexMediaUseCase',
      `Archivo indexado como foto: ${mediaFile.currentPath}`,
      mediaFile.id
    ));

    return { assetId: asset.id, mediaFileId: mediaFile.id, assetType };
  }
}
