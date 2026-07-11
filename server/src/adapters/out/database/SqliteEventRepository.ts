import Database from 'better-sqlite3';
import { IEventRepository } from '../../../application/ports/out/IEventRepository.js';
import { AppEvent } from '@blacknails/shared';

export class SqliteEventRepository implements IEventRepository {
  constructor(private db: Database.Database) {}

  private toDbParams(event: AppEvent, published: 0 | 1): Record<string, unknown> {
    const { id, type, source, message, occurredAt, ...payload } = event;
    return {
      id,
      type,
      source,
      message,
      occurredAt,
      published,
      payload: JSON.stringify(payload)
    };
  }

  private toEvent(row: any): AppEvent {
    const base = {
      id: row.id,
      type: row.type as 'SYSTEM' | 'DOMAIN' | 'PROCESS',
      source: row.source,
      message: row.message,
      occurredAt: row.occurredAt
    };

    let payload = {};
    if (row.payload) {
      try {
        payload = JSON.parse(row.payload);
      } catch (e) {
        console.error('[SqliteEventRepository] Failed to parse payload for event:', row.id, e);
      }
    }

    return {
      ...base,
      ...payload
    } as AppEvent;
  }

  public async save(event: AppEvent): Promise<void> {
    this.db.prepare(
      `INSERT OR REPLACE INTO system_events (
        id, type, source, message, occurredAt, published, payload
      ) VALUES (
        @id, @type, @source, @message, @occurredAt, @published, @payload
      )`
    ).run(this.toDbParams(event, 0));
  }

  public async savePublished(event: AppEvent): Promise<void> {
    this.db.prepare(
      `INSERT OR REPLACE INTO system_events (
        id, type, source, message, occurredAt, published, payload
      ) VALUES (
        @id, @type, @source, @message, @occurredAt, @published, @payload
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
