export class WorkerExecution {
  id: string;
  runner: string;
  startedAt: string;
  finishedAt?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalItems: number;
  processed: number;
  failed: number;

  constructor(init: Partial<WorkerExecution>) {
    this.id = init.id!;
    this.runner = init.runner!;
    this.startedAt = init.startedAt!;
    this.finishedAt = init.finishedAt;
    this.status = init.status!;
    this.totalItems = init.totalItems ?? 0;
    this.processed = init.processed ?? 0;
    this.failed = init.failed ?? 0;
  }
}
