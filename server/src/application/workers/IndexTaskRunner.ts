import { DaemonWorker } from '../services/DaemonWorker.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { IndexMediaUseCase } from '../use_cases/IndexMediaUseCase.js';
import { IPurgeMediaUseCase } from '../ports/in/IPurgeMediaUseCase.js';

export class IndexTaskRunner extends DaemonWorker {
  public readonly id = 'index-worker';
  public readonly label = 'Indexing / Metadata Extract';
  public readonly provides = ['assets'];
  public readonly requires = ['original_files'];
  public readonly intervalMs: number;
  public readonly subsystem = 'INDEX';

  private pollingInterval: NodeJS.Timeout | null = null;
  private isCatchingUp = false;

  constructor(
    eventBus: IEventBus,
    private readonly uow: IUnitOfWork,
    private readonly indexUseCase: IndexMediaUseCase,
    private readonly purgeUseCase: IPurgeMediaUseCase,
    intervalMs: number
  ) {
    super(eventBus, uow.workerExecutions);
    this.intervalMs = intervalMs;
  }

  protected async catchUp(): Promise<void> {
    if (this.isCatchingUp) return;
    this.isCatchingUp = true;
    let hadErrors = false;

    try {
      const orphans = await this.uow.mediaFiles.getOrphans();
      const total = orphans.length;
      if (total > 0) {
        await this.startExecution(total);
        await this.publishLifecycleEvent('STARTED', `[INDEX] Comenzando indexado de ${total} huérfanos...`);
      }
      let processed = 0;
      let failed = 0;
      for (const orphan of orphans) {
        if (!this.isRunning) break;
        try {
          await this.indexUseCase.execute({ mediaFileId: orphan.id });
          processed++;
          await this.updateExecution(processed, failed);
          await this.publishLifecycleEvent('SUCCESS', `[INDEX] elemento ${orphan.id} procesado.`, { workerName: this.id, itemId: orphan.id, status: 'PROCESSED' });
        } catch (error) {
          this.markError(error);
          hadErrors = true;
          failed++;
          await this.updateExecution(processed, failed);
        }
      }

      // Ejecutar purga de archivos desaparecidos después del ciclo de indexación
      try {
        const purgeResult = await this.purgeUseCase.execute();
        if (purgeResult.purgedMediaFilesCount > 0) {
          await this.publishLifecycleEvent('COMPLETED', `[PURGE] Depurados ${purgeResult.purgedMediaFilesCount} archivos físicos faltantes, ${purgeResult.purgedAssetsCount} assets y ${purgeResult.purgedPersonsCount} personas huérfanas.`);
        }
      } catch (purgeError) {
        console.error(`[INDEX-PURGE] Error ejecutando la purga de archivos desaparecidos:`, purgeError);
      }

      this.markRun();
      if (total > 0) {
        await this.finishExecution(hadErrors ? 'FAILED' : 'COMPLETED');
        if (hadErrors) {
          await this.publishLifecycleEvent('COMPLETED', `[INDEX] Indexado finalizado con errores en algunos archivos huérfanos.`);
        } else {
          await this.publishLifecycleEvent('COMPLETED', `[INDEX] Indexado finalizado correctamente.`);
        }
      }
    } catch (error) {

      this.markError(error);
      if (this.currentExecutionId) {
        await this.finishExecution('FAILED');
      }
      console.error(`[INDEX] Error in worker execution:`, error);
      await this.publishLifecycleEvent('FAILED', `[INDEX] El indexador ha sufrido un error inesperado al escanear los huérfanos.`);
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
    return this.uow.mediaFiles.getOrphans().then((orphans) => orphans.length).catch(() => 0);
  }
}
