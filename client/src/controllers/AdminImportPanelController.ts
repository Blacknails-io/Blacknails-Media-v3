import type { IPipelineService, PipelineWorkerDTO } from '../services/api/interfaces.js';
import { backendEventsController, type BackendEventsController } from './BackendEventsController.js';

export type WorkerAction = 'start' | 'stop' | 'trigger' | 'reset';
type StateListener = (state: AdminImportPanelState) => void;

export interface AdminImportPanelState {
  workers: PipelineWorkerDTO[];
  isLoading: boolean;
  error: string | null;
}

export class AdminImportPanelController {
  private readonly listeners = new Set<StateListener>();
  private unsubscribeEvents?: () => void;
  private readonly getToken: () => string | null;
  private readonly pipelineService: IPipelineService;
  private readonly eventsController: BackendEventsController;

  private state: AdminImportPanelState = {
    workers: [],
    isLoading: true,
    error: null
  };

  constructor(
    getToken: () => string | null,
    pipelineService: IPipelineService,
    eventsController: BackendEventsController = backendEventsController
  ) {
    this.getToken = getToken;
    this.pipelineService = pipelineService;
    this.eventsController = eventsController;
  }

  private pollingInterval?: number;

  public start(): void {
    void this.refresh(true);
    
    // Polling cada 5 segundos para actualizar contadores aunque no haya eventos
    this.pollingInterval = window.setInterval(() => {
      void this.refresh(false);
    }, 5000);

    this.unsubscribeEvents = this.eventsController.subscribeEvents(
      () => {
        void this.refresh(false);
      },
      (event) => ['IMPORT', 'INDEX', 'AI'].includes((event as any).subsystem)
    );
  }

  public dispose(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
    this.unsubscribeEvents?.();
    this.unsubscribeEvents = undefined;
  }

  public onState(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async runAction(workerId: string, action: WorkerAction): Promise<void> {
    const token = this.getToken();
    if (!token) return;

    this.updateState({ error: null });
    try {
      let updatedWorker: PipelineWorkerDTO;
      if (action === 'start') {
        updatedWorker = await this.pipelineService.startWorker(token, workerId);
      } else if (action === 'stop') {
        updatedWorker = await this.pipelineService.stopWorker(token, workerId);
      } else if (action === 'reset') {
        updatedWorker = await this.pipelineService.resetWorker(token, workerId);
      } else {
        updatedWorker = await this.pipelineService.triggerWorker(token, workerId);
      }
      this.updateState({
        workers: this.state.workers.map((worker) => (worker.id === updatedWorker.id ? updatedWorker : worker))
      });
    } catch (error: any) {
      this.updateState({ error: error?.message || 'No se pudo ejecutar la acción.' });
    }
  }

  public async runGroupAction(workerIds: string[], action: WorkerAction, strategy: 'parallel' | 'series' = 'parallel'): Promise<void> {
    const token = this.getToken();
    if (!token) return;

    this.updateState({ error: null });

    const uniqueWorkerIds = Array.from(new Set(workerIds)).filter((workerId) =>
      this.state.workers.some((worker) => worker.id === workerId)
    );
    if (uniqueWorkerIds.length === 0) return;

    const runWorkerAction = async (workerId: string): Promise<PipelineWorkerDTO> => {
      if (action === 'start') return this.pipelineService.startWorker(token, workerId);
      if (action === 'stop') return this.pipelineService.stopWorker(token, workerId);
      if (action === 'reset') return this.pipelineService.resetWorker(token, workerId);
      return this.pipelineService.triggerWorker(token, workerId);
    };

    const results: PromiseSettledResult<PipelineWorkerDTO>[] = [];
    if (strategy === 'series') {
      for (const workerId of uniqueWorkerIds) {
        results.push(await Promise.resolve(runWorkerAction(workerId)).then(
          (value): PromiseFulfilledResult<PipelineWorkerDTO> => ({ status: 'fulfilled', value }),
          (reason): PromiseRejectedResult => ({ status: 'rejected', reason })
        ));
      }
    } else {
      results.push(...await Promise.allSettled(uniqueWorkerIds.map((workerId) => runWorkerAction(workerId))));
    }
    const updatedWorkers = results
      .filter((result): result is PromiseFulfilledResult<PipelineWorkerDTO> => result.status === 'fulfilled')
      .map((result) => result.value);

    if (updatedWorkers.length > 0) {
      this.updateState({
        workers: this.state.workers.map((worker) => updatedWorkers.find((updated) => updated.id === worker.id) ?? worker)
      });
    }

    const failedCount = results.length - updatedWorkers.length;
    if (failedCount > 0) {
      this.updateState({ error: 'No se pudo ejecutar ' + failedCount + ' worker(s) del grupo.' });
    }
  }

  private async refresh(showLoading: boolean): Promise<void> {
    const token = this.getToken();
    if (!token) {
      this.updateState({ workers: [], isLoading: false, error: null });
      return;
    }

    if (showLoading) {
      this.updateState({ isLoading: true, error: null });
    }

    try {
      const workers = await this.pipelineService.getWorkers(token);
      this.updateState({ workers, error: null, isLoading: false });
    } catch (error: any) {
      this.updateState({
        error: error?.message || 'No se pudo cargar el pipeline.',
        isLoading: false
      });
    }
  }

  private updateState(partial: Partial<AdminImportPanelState>): void {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
