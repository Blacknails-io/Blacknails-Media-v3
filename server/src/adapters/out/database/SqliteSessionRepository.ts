import Database from 'better-sqlite3';
import { Session } from '../../../domain/entities/Session.js';
import { ISessionRepository } from '../../../application/ports/out/ISessionRepository.js';

export class SqliteSessionRepository implements ISessionRepository {
  constructor(private db: Database.Database) {}

  public async findByToken(token: string): Promise<Session | null> {
    const row = this.db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
    if (!row) return null;
    return new Session({
      token: row.token,
      userId: row.user_id,
      expiresAt: row.expires_at
    });
  }

  public async save(session: Session): Promise<void> {
    this.db.prepare(`
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(token) DO UPDATE SET
        user_id = excluded.user_id,
        expires_at = excluded.expires_at
    `).run(session.token, session.userId, session.expiresAt);
  }

  public async deleteByToken(token: string): Promise<void> {
    this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  public async deleteExpired(): Promise<void> {
    const now = new Date().toISOString();
    this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  }
}
