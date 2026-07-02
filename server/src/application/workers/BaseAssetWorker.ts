import { Asset } from '../../domain/entities/Asset.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { DaemonWorker } from '../services/DaemonWorker.js';

export abstract class BaseAssetWorker extends DaemonWorker {
  public readonly subsystem = 'AI';
  protected timer?: NodeJS.Timeout;
  private isCatchingUp = false;

  constructor(
    eventBus: IEventBus,
    protected readonly uow: IUnitOfWork
  ) {
    super(eventBus, uow.workerExecutions);
  }

  protected async catchUp(): Promise<void> {
    if (this.isCatchingUp) return;
    this.isCatchingUp = true;
    try {
      const assets = await this.uow.assets.getAll();
      const pending = assets.filter((asset) => this.isPending(asset));

      const prefix = '[' + this.id.replace('-worker', '').replace('core-', '').toUpperCase() + ']';
      const total = pending.length;

      if (total > 0) {
        if (!this.acquireResources()) {
          await this.publishLifecycleEvent('STARTED', `${prefix} Ollama ocupado. El worker se reserva para el próximo ciclo...`);
          return;
        }
        await this.startExecution(total);
        await this.publishLifecycleEvent('STARTED', `${prefix} Comenzando procesamiento de ${total} elementos...`);
      }
      let processed = 0;
      let failed = 0;
      for (const asset of pending) {
        try {
          await this.processAsset(asset);
          processed++;
          await this.updateExecution(processed, failed);
          await this.publishLifecycleEvent('SUCCESS', `${prefix} Processed item ${processed}/${total} (${asset.id})`, { workerName: this.id, itemId: asset.id, status: 'PROCESSED' });
        } catch (err) {
          failed++;
          await this.updateExecution(processed, failed);
          throw err;
        }
      }

      this.markRun();
      if (total > 0) {
        await this.finishExecution('COMPLETED');
        await this.publishLifecycleEvent('COMPLETED', `${prefix} Done — processed=${total} | failed=0 | elapsed=0.0s`);
      }
    } catch (error) {
      const prefix = '[' + this.id.replace('-worker', '').replace('core-', '').toUpperCase() + ']';
      this.markError(error);
      if (this.currentExecutionId) {
        await this.finishExecution('FAILED');
      }
      console.error(`${prefix} Error in worker execution:`, error);
      await this.publishLifecycleEvent('ERROR', `${prefix} El worker ha sufrido un error inesperado al procesar el lote.`);
      // No relanzamos el error para no crashear todo el proceso de Node en el setInterval
    } finally {
      this.releaseResources();
      this.isCatchingUp = false;
    }
  }

  protected subscribeToEvents(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      void this.catchUp();
    }, this.intervalMs);
  }

  protected unsubscribeFromEvents(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  protected async getPendingItems(): Promise<number> {
    const assets = await this.uow.assets.getAll();
    return assets.filter((asset) => this.isPending(asset)).length;
  }

  protected acquireResources(): boolean {
    return true;
  }

  protected releaseResources(): void {
  }

  protected abstract isPending(asset: Asset): boolean;
  protected abstract processAsset(asset: Asset): Promise<void>;
}

