import Database from 'better-sqlite3';
import { User, UserRole } from '../../../domain/entities/User.js';
import { IUserRepository } from '../../../application/ports/out/IUserRepository.js';

export class SqliteUserRepository implements IUserRepository {
  constructor(private db: Database.Database) {}

  public async findByUsername(username: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!row) return null;
    return new User({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      isActive: Boolean(row.is_active ?? 1),
      createdAt: row.created_at,
      avatarUrl: row.avatar_url
    });
  }

  public async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;
    return new User({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      isActive: Boolean(row.is_active ?? 1),
      createdAt: row.created_at,
      avatarUrl: row.avatar_url
    });
  }

  public async findAll(): Promise<User[]> {
    const rows = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as any[];
    return rows.map((row) => new User({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      isActive: Boolean(row.is_active ?? 1),
      createdAt: row.created_at,
      avatarUrl: row.avatar_url
    }));
  }

  public async countAdmins(): Promise<number> {
    const row = this.db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get() as any;
    return row ? row.count : 0;
  }

  public async countActiveAdmins(): Promise<number> {
    const row = this.db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND is_active = 1").get() as any;
    return row ? row.count : 0;
  }

  public async updateRole(id: string, role: UserRole): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    this.db.prepare(`
      UPDATE users
      SET role = ?
      WHERE id = ?
    `).run(role, id);

    return new User({
      id: existing.id,
      username: existing.username,
      passwordHash: existing.passwordHash,
      role,
      isActive: existing.isActive,
      createdAt: existing.createdAt,
      avatarUrl: existing.avatarUrl
    });
  }

  public async updateActive(id: string, isActive: boolean): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    this.db.prepare(`
      UPDATE users
      SET is_active = ?
      WHERE id = ?
    `).run(isActive ? 1 : 0, id);

    return new User({
      id: existing.id,
      username: existing.username,
      passwordHash: existing.passwordHash,
      role: existing.role,
      isActive,
      createdAt: existing.createdAt,
      avatarUrl: existing.avatarUrl
    });
  }

  public async deleteById(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }

  public async save(user: User): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, password_hash, role, is_active, created_at, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        password_hash = excluded.password_hash,
        role = excluded.role,
        is_active = excluded.is_active,
        avatar_url = excluded.avatar_url
    `);

    stmt.run(
      user.id,
      user.username,
      user.passwordHash,
      user.role,
      user.isActive ? 1 : 0,
      user.createdAt,
      user.avatarUrl || null
    );
  }

  public async count(): Promise<number> {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    return row ? row.count : 0;
  }
}
