import { Asset } from '../../domain/entities/Asset.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { DaemonWorker } from '../services/DaemonWorker.js';

export abstract class BaseAssetWorker extends DaemonWorker {
  public readonly subsystem = 'AI';
  protected timer?: NodeJS.Timeout;
  protected readonly maxAssetsPerRun: number;
  private isCatchingUp = false;

  constructor(
    eventBus: IEventBus,
    protected readonly uow: IUnitOfWork,
    maxAssetsPerRun = 1
  ) {
    super(eventBus, uow.workerExecutions);
    this.maxAssetsPerRun = Math.max(1, Math.floor(maxAssetsPerRun));
  }

  protected async catchUp(): Promise<void> {
    if (this.isCatchingUp) return;
    this.isCatchingUp = true;
    try {
      const assets = await this.uow.assets.getAll();
      const pendingBacklog = assets.filter((asset) => this.isPending(asset));
      const pending = pendingBacklog.slice(0, this.maxAssetsPerRun);

      const prefix = '[' + this.id.replace('-worker', '').replace('core-', '').toUpperCase() + ']';
      const total = pending.length;
      const backlogTotal = pendingBacklog.length;

      if (total > 0) {
        if (!this.acquireResources()) {
          await this.publishLifecycleEvent('STARTED', `${prefix} Ollama ocupado. El worker se reserva para el próximo ciclo...`);
          return;
        }
        this.currentAssetType = pending[0]?.assetType;
        await this.startExecution(total);
        await this.publishLifecycleEvent('STARTED', `${prefix} Comenzando procesamiento de ${total} de ${backlogTotal} elementos pendientes...`);
      }
      // The whole batch is dispatched concurrently. OllamaService caps the real
      // in-flight requests at its per-kind limit (= OLLAMA_NUM_PARALLEL), so
      // batchSize only decides how many assets we hand off per cycle; the runtime
      // never receives more concurrent requests than it can serve.
      const results = await Promise.allSettled(pending.map(async (asset) => {
        try {
          return await this.processAsset(asset);
        } finally {
          if (this.currentExecutionTotalItems !== undefined) {
            this.currentExecutionTotalItems = Math.max(0, this.currentExecutionTotalItems - 1);
          }
        }
      }));

      let processed = 0;
      let failed = 0;
      let firstError: unknown;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const asset = pending[i];
        if (result.status === 'fulfilled') {
          processed++;
          await this.publishLifecycleEvent('SUCCESS', `${prefix} Processed item ${processed}/${total} (${asset.id})`, { workerName: this.id, itemId: asset.id, status: 'PROCESSED' });
        } else {
          failed++;
          firstError = firstError ?? result.reason;
          console.error(`${prefix} Error processing asset ${asset.id}:`, result.reason);
        }
      }
      await this.updateExecution(processed, failed);

      // Only bubble up when nothing succeeded, so a single bad asset doesn't fail
      // the rest of the batch. The outer catch marks the execution as FAILED.
      if (processed === 0 && failed > 0) {
        throw firstError;
      }

      this.markRun();
      if (total > 0) {
        await this.finishExecution('COMPLETED');
        await this.publishLifecycleEvent('COMPLETED', `${prefix} Done — processed=${processed} | remaining=${Math.max(0, backlogTotal - processed)} | failed=${failed} | elapsed=0.0s`);
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
      this.currentAssetType = undefined;
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

