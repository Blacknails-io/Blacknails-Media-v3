import Database from 'better-sqlite3';
import { WorkerExecution } from '../../../domain/entities/WorkerExecution.js';
import { IWorkerExecutionRepository } from '../../../application/ports/out/IWorkerExecutionRepository.js';

export class SqliteWorkerExecutionRepository implements IWorkerExecutionRepository {
  constructor(private readonly db: Database.Database) {}

  public async save(execution: WorkerExecution): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO worker_executions (id, runner, startedAt, finishedAt, status, totalItems, processed, failed)
      VALUES (@id, @runner, @startedAt, @finishedAt, @status, @totalItems, @processed, @failed)
      ON CONFLICT(id) DO UPDATE SET
        finishedAt = @finishedAt,
        status = @status,
        totalItems = @totalItems,
        processed = @processed,
        failed = @failed
    `);

    stmt.run({
      id: execution.id,
      runner: execution.runner,
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt || null,
      status: execution.status,
      totalItems: execution.totalItems,
      processed: execution.processed,
      failed: execution.failed
    });
  }

  public async getLatestByRunner(runner: string): Promise<WorkerExecution | undefined> {
    const stmt = this.db.prepare(`
      SELECT * FROM worker_executions
      WHERE runner = ?
      ORDER BY startedAt DESC
      LIMIT 1
    `);

    const row = stmt.get(runner) as any;
    if (!row) return undefined;

    return new WorkerExecution({
      id: row.id,
      runner: row.runner,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt || undefined,
      status: row.status,
      totalItems: row.totalItems,
      processed: row.processed,
      failed: row.failed
    });
  }
}
