import { WorkerExecution } from '../../../domain/entities/WorkerExecution.js';

export interface IWorkerExecutionRepository {
  save(execution: WorkerExecution): Promise<void>;
  getLatestByRunner(runner: string): Promise<WorkerExecution | undefined>;
}
