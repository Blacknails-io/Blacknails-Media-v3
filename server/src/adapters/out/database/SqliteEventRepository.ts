import Database from 'better-sqlite3';
import { IEventRepository } from '../../../application/ports/out/IEventRepository.js';
import { AppEvent } from '@blacknails/shared';

export class SqliteEventRepository implements IEventRepository {
  constructor(private db: Database.Database) {}

  private toDbParams(event: AppEvent, published: 0 | 1): Record<string, unknown> {
    const ev = event as any;
    return {
      id: ev.id,
      type: ev.type,
      subsystem: ev.subsystem || 'NONE',
      action: ev.action,
      source: ev.source,
      message: ev.message,
      occurredAt: ev.occurredAt,
      workerName: ev.workerName || null,
      itemId: ev.itemId || null,
      status: ev.status || null,
      process_name: ev.processName || null,
      entity_type: ev.entityType || null,
      entity_id: ev.entityId || null,
      published
    };
  }

  private toEvent(row: any): AppEvent {
    const base = {
      id: row.id,
      occurredAt: row.occurredAt,
      source: row.source,
      message: row.message
    };

    if (row.type === 'DOMAIN') {
      return {
        ...base,
        type: 'DOMAIN',
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action
      } as any;
    } else if (row.type === 'PROCESS') {
      return {
        ...base,
        type: 'PROCESS',
        processName: row.process_name,
        action: row.action,
        itemId: row.item_id || undefined,
        status: row.status || undefined
      } as any;
    } else {
      return {
        ...base,
        type: 'SYSTEM',
        subsystem: row.subsystem === 'NONE' ? undefined : row.subsystem,
        action: row.action,
        workerName: row.worker_name || undefined,
        itemId: row.item_id || undefined,
        status: row.status || undefined
      } as any;
    }
  }

  public async save(event: AppEvent): Promise<void> {
    this.db.prepare(
      `INSERT OR REPLACE INTO system_events (
        id, type, subsystem, action, source, message, occurredAt,
        worker_name, item_id, status, process_name, entity_type, entity_id, published
      ) VALUES (
        @id, @type, @subsystem, @action, @source, @message, @occurredAt,
        @workerName, @itemId, @status, @process_name, @entity_type, @entity_id, @published
      )`
    ).run(this.toDbParams(event, 0));
  }

  public async savePublished(event: AppEvent): Promise<void> {
    this.db.prepare(
      `INSERT OR REPLACE INTO system_events (
        id, type, subsystem, action, source, message, occurredAt,
        worker_name, item_id, status, process_name, entity_type, entity_id, published
      ) VALUES (
        @id, @type, @subsystem, @action, @source, @message, @occurredAt,
        @workerName, @itemId, @status, @process_name, @entity_type, @entity_id, @published
      )`
    ).run(this.toDbParams(event, 1));
  }

  public async getUnpublished(): Promise<AppEvent[]> {
    const rows = this.db.prepare('SELECT * FROM system_events WHERE published = 0 ORDER BY occurredAt ASC').all();
    return rows.map((row: any) => this.toEvent(row));
  }

  public async getRecent(limit: number): Promise<AppEvent[]> {
    const safeLimit = Math.max(1, Math.min(limit, 500));
    const rows = this.db
      .prepare('SELECT * FROM system_events ORDER BY occurredAt DESC LIMIT ?')
      .all(safeLimit);
    return rows.reverse().map((row: any) => this.toEvent(row));
  }

  public async markAsPublished(eventId: string): Promise<void> {
    this.db.prepare('UPDATE system_events SET published = 1 WHERE id = ?').run(eventId);
  }
}
