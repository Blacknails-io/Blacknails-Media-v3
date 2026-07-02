import { promises as fs } from 'fs';
import path from 'path';
import { DaemonWorker } from '../services/DaemonWorker.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { ImportMediaUseCase } from '../use_cases/ImportMediaUseCase.js';
import { IWorkerExecutionRepository } from '../ports/out/IWorkerExecutionRepository.js';

export class ImportTaskRunner extends DaemonWorker {
  public readonly id = 'import-worker';
  public readonly label = 'Import Files';
  public readonly provides = ['original_files'];
  public readonly requires = [];
  public readonly intervalMs: number;
  public readonly subsystem = 'IMPORT';

  private pollingInterval: NodeJS.Timeout | null = null;
  private isCatchingUp = false;

  constructor(
    eventBus: IEventBus,
    private readonly importUseCase: ImportMediaUseCase,
    private readonly importDir: string,
    intervalMs: number,
    executionRepo?: IWorkerExecutionRepository
  ) {
    super(eventBus, executionRepo);
    this.intervalMs = intervalMs;
  }

  protected async catchUp(): Promise<void> {
    if (this.isCatchingUp) return;
    this.isCatchingUp = true;
    let hadErrors = false;

    try {
      const files = (await this.getFilesInDirectory(this.importDir)).sort();
      const total = files.length;
      if (total > 0) {
        await this.startExecution(total);
        await this.publishLifecycleEvent('STARTED', `[IMPORT] Comenzando importación de ${total} archivos...`);
      }
      const errorsDir = path.join(this.importDir, '.errors');
      await fs.mkdir(errorsDir, { recursive: true });

      let processed = 0;
      let failed = 0;
      for (const file of files) {
        if (!this.isRunning) break;
        try {
          const result = await this.importUseCase.execute(file);
          if (result.imported) {
            processed++;
            await this.updateExecution(processed, failed);
            const filename = path.basename(file);
            await this.publishLifecycleEvent('SUCCESS', `[IMPORT] Processed item ${processed}/${total} (${filename})`, { workerName: this.id, itemId: filename, status: 'PROCESSED' });
          } else {
             if (result.skippedReason !== 'duplicate-hash') {
               hadErrors = true;
               failed++;
               await this.updateExecution(processed, failed);
               const errorPath = path.join(errorsDir, path.basename(file));
               await fs.rename(file, errorPath).catch(err => console.error(`[IMPORT] Error moving file to .errors: ${err.message}`));
             } else {
               processed++; // Count as processed if it's just skipped duplicate
               await this.updateExecution(processed, failed);
             }
          }
        } catch (error) {
          this.markError(error);
          hadErrors = true;
          failed++;
          await this.updateExecution(processed, failed);
          const errorPath = path.join(errorsDir, path.basename(file));
          await fs.rename(file, errorPath).catch(err => console.error(`[IMPORT] Error moving file to .errors: ${err.message}`));
        }
      }
      // El worker sigue estando sano, incluso si hubo archivos defectuosos
      this.markRun();
      if (total > 0) {
        await this.finishExecution(hadErrors ? 'FAILED' : 'COMPLETED');
        if (hadErrors) {
          await this.publishLifecycleEvent('COMPLETED', `[IMPORT] Importación finalizada con algunos archivos defectuosos o no soportados saltados.`);
        } else {
          await this.publishLifecycleEvent('COMPLETED', `[IMPORT] Importación finalizada correctamente.`);
        }
      }
    } catch (error) {
      this.markError(error);
      if (this.currentExecutionId) {
        await this.finishExecution('FAILED');
      }
      console.error(`[IMPORT] Error in worker execution:`, error);
      await this.publishLifecycleEvent('FAILED', `[IMPORT] El worker ha sufrido un error inesperado al procesar el directorio de importación.`);
    } finally {
      this.isCatchingUp = false;
    }
  }

  protected subscribeToEvents(): void {
    if (this.intervalMs <= 0) return;

    this.pollingInterval = setInterval(() => {
      if (this.isRunning) {
        void this.catchUp();
      }
    }, this.intervalMs);
  }

  protected unsubscribeFromEvents(): void {
    if (!this.pollingInterval) return;
    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
  }

  protected async getPendingItems(): Promise<number> {
    return this.getFilesInDirectory(this.importDir).then((files) => {
      console.log(`[ImportTaskRunner] getPendingItems: Found ${files.length} files in ${this.importDir}`);
      return files.length;
    }).catch((err) => {
      console.error(`[ImportTaskRunner] getPendingItems ERROR:`, err);
      return 0;
    });
  }

  private async getFilesInDirectory(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      let files: string[] = [];

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(await this.getFilesInDirectory(fullPath));
        } else {
          files.push(fullPath);
        }
      }

      return files;
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
