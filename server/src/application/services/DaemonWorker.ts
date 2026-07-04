import { IEventBus } from '../ports/out/IEventBus.js';
import {
  ImportStartedEvent, ImportCompletedEvent, ImportFailedEvent,
  ImportDuplicateEvent, ImportRejectedEvent, MediaImportedEvent,
  IndexStartedEvent, IndexCompletedEvent, IndexFailedEvent, MediaIndexedEvent,
  AiProcessingStartedEvent, AiProcessingCompletedEvent, AiProcessingFailedEvent,
  AssetProcessedEvent, AiErrorEvent
} from '../events/SystemEvents.js';
import { IWorkerExecutionRepository } from '../ports/out/IWorkerExecutionRepository.js';
import { WorkerExecution } from '../../domain/entities/WorkerExecution.js';
import crypto from 'crypto';

export interface WorkerStatusDTO {
  id: string;
  label: string;
  isRunning: boolean;
  isExecuting?: boolean;
  currentAssetType?: 'PHOTO' | 'VIDEO';
  intervalMs: number;
  pendingItems: number;
  lastRunAt?: string;
  lastTriggeredAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  provides: string[];
  requires: string[];
}

export abstract class DaemonWorker {
  public abstract readonly id: string;
  public abstract readonly label: string;
  public abstract readonly provides: string[];
  public abstract readonly requires: string[];

  public isRunning = false;
  protected lastRunAt?: string;
  protected lastTriggeredAt?: string;
  protected lastErrorAt?: string;
  protected lastErrorMessage?: string;
  protected currentExecutionId?: string;
  protected currentAssetType?: 'PHOTO' | 'VIDEO';

  constructor(
    protected readonly eventBus: IEventBus,
    protected readonly executionRepo?: IWorkerExecutionRepository
  ) {}


  public abstract readonly intervalMs: number;
  public abstract readonly subsystem: 'IMPORT' | 'INDEX' | 'AI';

  public async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    await this.publishLifecycleEvent('STARTED', `Worker ${this.id} iniciado.`);
    await this.catchUp();

    if (!this.isRunning) {
      return;
    }

    this.subscribeToEvents();
  }

  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.unsubscribeFromEvents();
    void this.publishLifecycleEvent('COMPLETED', `Worker ${this.id} detenido.`);
  }

  public async trigger(triggerType: 'MANUAL' | 'REACTIVE' = 'MANUAL'): Promise<void> {
    this.lastTriggeredAt = new Date().toISOString();
    const actionMsg = triggerType === 'MANUAL' ? 'Trigger manual' : 'Trigger automático';
    await this.publishLifecycleEvent('STARTED', `${actionMsg} ejecutado en ${this.id}.`);
    const wasRunning = this.isRunning;
    this.isRunning = true;
    try {
      await this.catchUp();
    } finally {
      this.isRunning = wasRunning;
      if (!this.isRunning) {
        this.unsubscribeFromEvents();
      }
    }
  }

  public async describe(pendingItemsOverride?: number): Promise<WorkerStatusDTO> {
    return {
      id: this.id,
      label: this.label,
      isRunning: this.isRunning,
      isExecuting: !!this.currentExecutionId,
      currentAssetType: this.currentAssetType,
      intervalMs: this.intervalMs,
      pendingItems: pendingItemsOverride ?? await this.getPendingItems(),
      lastRunAt: this.lastRunAt,
      lastTriggeredAt: this.lastTriggeredAt,
      lastErrorAt: this.lastErrorAt,
      lastErrorMessage: this.lastErrorMessage,
      provides: this.provides,
      requires: this.requires
    };
  }

  public async emitLifecycleEvent(
    action: 'STARTUP' | 'CONNECTED' | 'ERROR' | 'SUCCESS' | 'FAILED' | 'REJECTED' | 'DUPLICATED' | 'STARTED' | 'COMPLETED',
    message: string,
    metadata?: { workerName?: string; itemId?: string; status?: string }
  ): Promise<void> {
    await this.publishLifecycleEvent(action, message, metadata);
  }

  protected markRun(): void {
    this.lastRunAt = new Date().toISOString();
    this.lastErrorAt = undefined;
    this.lastErrorMessage = undefined;
  }

  protected markError(error: unknown): void {
    this.lastErrorAt = new Date().toISOString();
    this.lastErrorMessage = error instanceof Error ? error.message : String(error);
  }

  protected async startExecution(totalItems: number): Promise<void> {
    if (!this.executionRepo) return;
    this.currentExecutionId = crypto.randomUUID();
    const exec = new WorkerExecution({
      id: this.currentExecutionId,
      runner: this.id,
      startedAt: new Date().toISOString(),
      status: 'RUNNING',
      totalItems,
      processed: 0,
      failed: 0
    });
    await this.executionRepo.save(exec);
  }

  protected async updateExecution(processed: number, failed: number): Promise<void> {
    if (!this.executionRepo || !this.currentExecutionId) return;
    const exec = await this.executionRepo.getLatestByRunner(this.id);
    if (!exec || exec.id !== this.currentExecutionId) return;
    exec.processed = processed;
    exec.failed = failed;
    await this.executionRepo.save(exec);
  }

  protected async finishExecution(status: 'COMPLETED' | 'FAILED'): Promise<void> {
    if (!this.executionRepo || !this.currentExecutionId) return;
    const exec = await this.executionRepo.getLatestByRunner(this.id);
    if (!exec || exec.id !== this.currentExecutionId) return;
    exec.finishedAt = new Date().toISOString();
    exec.status = status;
    await this.executionRepo.save(exec);
    this.currentExecutionId = undefined;
  }

  protected async publishLifecycleEvent(
    action: 'STARTUP' | 'CONNECTED' | 'ERROR' | 'SUCCESS' | 'FAILED' | 'REJECTED' | 'DUPLICATED' | 'STARTED' | 'COMPLETED',
    message: string,
    metadata?: { workerName?: string; itemId?: string; status?: string }
  ): Promise<void> {
    let event: any;
    const s = this.subsystem;

    if (s === 'IMPORT') {
      if (action === 'STARTED' || action === 'STARTUP') {
        event = new ImportStartedEvent(this.id, message, this.id);
      } else if (action === 'COMPLETED') {
        event = new ImportCompletedEvent(this.id, message, this.id, metadata?.status);
      } else if (action === 'FAILED' || action === 'ERROR') {
        event = new ImportFailedEvent(this.id, message, this.id);
      } else if (action === 'SUCCESS') {
        if (metadata?.itemId) {
          event = new MediaImportedEvent(this.id, message, metadata.itemId, this.id, metadata.status);
        } else {
          event = new ImportCompletedEvent(this.id, message, this.id, metadata?.status);
        }
      } else if (action === 'DUPLICATED') {
        event = new ImportDuplicateEvent(this.id, message, metadata?.itemId || '', this.id);
      } else if (action === 'REJECTED') {
        event = new ImportRejectedEvent(this.id, message, metadata?.itemId || '', this.id);
      } else {
        event = new ImportCompletedEvent(this.id, message, this.id, metadata?.status);
      }
    } else if (s === 'INDEX') {
      if (action === 'STARTED' || action === 'STARTUP') {
        event = new IndexStartedEvent(this.id, message, this.id);
      } else if (action === 'COMPLETED') {
        event = new IndexCompletedEvent(this.id, message, this.id, metadata?.status);
      } else if (action === 'FAILED' || action === 'ERROR') {
        event = new IndexFailedEvent(this.id, message, this.id);
      } else if (action === 'SUCCESS') {
        event = new MediaIndexedEvent(this.id, message, metadata?.itemId, this.id, metadata?.status);
      } else {
        event = new IndexCompletedEvent(this.id, message, this.id, metadata?.status);
      }
    } else {
      // AI Subsystem
      if (action === 'STARTED' || action === 'STARTUP') {
        event = new AiProcessingStartedEvent(this.id, message, this.id);
      } else if (action === 'COMPLETED') {
        event = new AiProcessingCompletedEvent(this.id, message, this.id, metadata?.status);
      } else if (action === 'FAILED') {
        event = new AiProcessingFailedEvent(this.id, message, this.id);
      } else if (action === 'SUCCESS') {
        if (metadata?.itemId) {
          event = new AssetProcessedEvent(this.id, message, metadata.itemId, this.id, metadata.status);
        } else {
          event = new AiProcessingCompletedEvent(this.id, message, this.id, metadata?.status);
        }
      } else if (action === 'ERROR') {
        event = new AiErrorEvent(this.id, message, this.id);
      } else {
        event = new AiProcessingCompletedEvent(this.id, message, this.id, metadata?.status);
      }
    }

    await this.eventBus.publish(event);
  }

  protected abstract catchUp(): Promise<void>;
  protected abstract subscribeToEvents(): void;
  protected abstract unsubscribeFromEvents(): void;
  protected abstract getPendingItems(): Promise<number>;
}
