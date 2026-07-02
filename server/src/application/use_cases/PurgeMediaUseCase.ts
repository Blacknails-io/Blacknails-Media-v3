import { promises as fs } from 'fs';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { IFaceRepository } from '../ports/out/IFaceRepository.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IPurgeMediaUseCase, PurgeMediaResponse } from '../ports/in/IPurgeMediaUseCase.js';
import { MediaFileDomainEvent, AssetDomainEvent } from '../events/SystemEvents.js';

export class PurgeMediaUseCase implements IPurgeMediaUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly faceRepository: IFaceRepository,
    private readonly eventBus: IEventBus
  ) {}

  public async execute(): Promise<PurgeMediaResponse> {
    const mediaFiles = await this.uow.mediaFiles.getAll();
    let purgedMediaFilesCount = 0;
    let purgedAssetsCount = 0;

    for (const mediaFile of mediaFiles) {
      let fileExists = false;
      try {
        await fs.access(mediaFile.currentPath);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      if (!fileExists) {
        // Delete media file from DB
        await this.uow.runTransaction(async (tx) => {
          await tx.mediaFiles.delete(mediaFile.id);
        });

        await this.eventBus.publish(new MediaFileDomainEvent(
          mediaFile.id,
          'DELETED',
          'PurgeMediaUseCase',
          `Archivo desaparecido eliminado de la base de datos: ${mediaFile.currentPath}`
        ));
        purgedMediaFilesCount++;

        if (mediaFile.assetId) {
          const remaining = await this.uow.mediaFiles.getByAssetId(mediaFile.assetId);
          // If no media files are left, or if this deleted file was the ORIGINAL file, delete the asset
          const hasOriginal = remaining.some(f => f.role === 'ORIGINAL' && f.id !== mediaFile.id);
          if (remaining.length === 0 || !hasOriginal || mediaFile.role === 'ORIGINAL') {
            const asset = await this.uow.assets.getById(mediaFile.assetId);
            if (asset) {
              // Delete physical thumbnails & previews
              const candidates = [asset.thumbnailPath, asset.aiThumbnailPath, asset.videoPreviewPath].filter(
                (val): val is string => Boolean(val)
              );
              for (const candidate of candidates) {
                await fs.unlink(candidate).catch(() => undefined);
              }

              // Delete the asset from the DB (which cascades and deletes faces in Sqlite due to foreign keys)
              await this.uow.runTransaction(async (tx) => {
                await tx.assets.delete(asset.id);
              });

              await this.eventBus.publish(new AssetDomainEvent(
                asset.id,
                'DELETED',
                'PurgeMediaUseCase',
                `Asset eliminado por falta de archivo original: ${asset.id}`
              ));
              purgedAssetsCount++;
            }
          }
        }
      }
    }

    // Clean up any orphan persons resulting from the asset deletion
    const purgedPersonsCount = await this.faceRepository.deleteOrphanPersons();

    return {
      purgedMediaFilesCount,
      purgedAssetsCount,
      purgedPersonsCount
    };
  }
}
