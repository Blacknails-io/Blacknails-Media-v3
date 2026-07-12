import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { IMediaProcessingService } from '../ports/out/IMediaProcessingService.js';
import { OriginalFile } from '../../domain/entities/MediaFile.js';
import {
  ImportRejectedEvent,
  ImportFailedEvent,
  ImportDuplicateEvent,
  MediaImportedEvent
} from '../events/SystemEvents.js';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.3g2']);

export interface ImportMediaResult {
  imported: boolean;
  skippedReason?: 'unsupported-extension' | 'duplicate-hash' | 'processing-error';
  mediaFileId?: string;
  fileHash?: string;
  vaultPath?: string;
}

export class ImportMediaUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventBus: IEventBus,
    private readonly mediaProcessing: IMediaProcessingService,
    private readonly originalsDir: string,
    private readonly action: 'move' | 'copy' = 'move'
  ) {}

  public async execute(sourcePath: string): Promise<ImportMediaResult> {
    const extension = path.extname(sourcePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      await this.eventBus.publish(new ImportRejectedEvent(
        'ImportMediaUseCase',
        `Archivo rechazado por extensión no soportada: ${path.basename(sourcePath)}`,
        path.basename(sourcePath)
      ));
      return { imported: false, skippedReason: 'unsupported-extension' };
    }

    const sourceContent = await fs.readFile(sourcePath);
    const fileHash = createHash('sha1').update(sourceContent).digest('hex');

    let processedPath = sourcePath;
    const stat = await fs.stat(processedPath);

    const dateInfo = await this.mediaProcessing.getDateWithSource(processedPath);
    const dateTaken = dateInfo.dateTaken;
    const dateStr = this.formatDateForFilename(dateTaken);
    const vaultFolder = path.join(
      this.originalsDir,
      String(dateTaken.getFullYear()),
      String(dateTaken.getMonth() + 1).padStart(2, '0')
    );
    
    // Deduplicación estricta
    const existingMedia = await this.uow.mediaFiles.getByFileHash(fileHash);
    if (existingMedia) {
      console.log(`[ImportMediaUseCase] Duplicado detectado por hash: ${path.basename(sourcePath)}. Saltando movimiento a bóveda.`);
      // Si el archivo ya existía, lo eliminamos de la carpeta de importación
      await import('fs/promises').then(fs => fs.rm(sourcePath, { force: true }));
      return {
        imported: true,
        mediaFileId: existingMedia.id,
        fileHash,
        vaultPath: existingMedia.currentPath
      };
    }
    
    // Para evitar colisiones de nombre si hay hashes idénticos en la misma fecha, añadimos un pequeño sufijo
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const vaultPath = path.join(vaultFolder, `${dateStr}_${fileHash.slice(0, 8).toUpperCase()}_${randomSuffix}${path.extname(processedPath).toLowerCase()}`);

    await fs.mkdir(vaultFolder, { recursive: true });
    await this.moveOrCopy(processedPath, vaultPath);

    const mediaFile = new OriginalFile({
      assetId: null,
      currentPath: vaultPath,
      fileSize: stat.size,
      fileHash,
      extension: path.extname(processedPath).toLowerCase(),
      createdAt: new Date().toISOString(),
      sourceDevice: 'import-folder',
      importDate: new Date().toISOString(),
      originalFilename: path.basename(sourcePath)
    });

    await this.uow.runTransaction(async (tx) => {
      await tx.mediaFiles.save(mediaFile);
    });

    await this.eventBus.publish(new MediaImportedEvent(
      'ImportMediaUseCase',
      `Archivo importado a originals: ${path.basename(sourcePath)}`,
      path.basename(sourcePath)
    ));

    return {
      imported: true,
      mediaFileId: mediaFile.id,
      fileHash,
      vaultPath
    };
  }

  private async moveOrCopy(source: string, destination: string): Promise<void> {
    if (this.action === 'copy') {
      await fs.copyFile(source, destination);
      return;
    }

    try {
      await fs.rename(source, destination);
    } catch (error: any) {
      if (error?.code === 'EXDEV') {
        await fs.copyFile(source, destination);
        await fs.unlink(source).catch(() => undefined);
        return;
      }
      throw error;
    }
  }

  private formatDateForFilename(date: Date): string {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }
}
