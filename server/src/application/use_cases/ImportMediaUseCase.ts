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

    let processedPath = sourcePath;
    try {
      processedPath = await this.mediaProcessing.optimizeAndArchive(sourcePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ImportMediaUseCase] Error optimizando archivo ${path.basename(sourcePath)}: ${errorMessage}`);
      await this.eventBus.publish(new ImportFailedEvent(
        'ImportMediaUseCase',
        `No se pudo procesar el archivo porque está corrupto o es inválido: ${path.basename(sourcePath)}`
      ));
      return { imported: false, skippedReason: 'processing-error' };
    }

    const [content, stat] = await Promise.all([
      fs.readFile(processedPath),
      fs.stat(processedPath)
    ]);

    const fileHash = createHash('sha1').update(content).digest('hex');
    const existing = await this.uow.mediaFiles.getByFileHash(fileHash);
    if (existing) {
      await this.eventBus.publish(new ImportDuplicateEvent(
        'ImportMediaUseCase',
        `Archivo duplicado descartado: ${path.basename(sourcePath)}`,
        path.basename(sourcePath)
      ));
      await this.cleanupDuplicateArtifacts(sourcePath, processedPath);
      return {
        imported: false,
        skippedReason: 'duplicate-hash',
        fileHash
      };
    }

    const dateInfo = await this.mediaProcessing.getDateWithSource(processedPath);
    const dateTaken = dateInfo.dateTaken;
    const dateStr = this.formatDateForFilename(dateTaken);
    const vaultFolder = path.join(
      this.originalsDir,
      String(dateTaken.getFullYear()),
      String(dateTaken.getMonth() + 1).padStart(2, '0')
    );
    const vaultPath = path.join(vaultFolder, `${dateStr}_${fileHash.slice(0, 8).toUpperCase()}${path.extname(processedPath).toLowerCase()}`);

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
      importDate: new Date().toISOString()
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

  private async cleanupDuplicateArtifacts(sourcePath: string, processedPath: string): Promise<void> {
    if (processedPath !== sourcePath) {
      await fs.unlink(processedPath).catch(() => undefined);
    } else if (this.action === 'move') {
      await fs.unlink(sourcePath).catch(() => undefined);
    }
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
