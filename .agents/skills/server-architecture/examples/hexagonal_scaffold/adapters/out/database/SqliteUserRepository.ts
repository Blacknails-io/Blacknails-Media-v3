import { Database } from 'better-sqlite3';
import { IUserRepository } from '../../../application/ports/out/IUserRepository.js';
import { User } from '../../../domain/User.js';

/**
 * ADAPTADOR DE SALIDA SQLITE (Driven Outbound Adapter)
 * 
 * Capa: adapters/out/database/
 * Reglas:
 * - Implementa la interfaz definida en el puerto de salida (`IUserRepository`).
 * - Tiene dependencias directas de la infraestructura (en este caso, `better-sqlite3`).
 * - Mapea los registros crudos de la base de datos a entidades de dominio puras.
 */
export class SqliteUserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  public async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;

    return new User(
      row.id,
      row.username,
      row.role,
      row.is_active === 1
    );
  }

  public async findByUsername(username: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!row) return null;

    return new User(
      row.id,
      row.username,
      row.role,
      row.is_active === 1
    );
  }

  public async save(user: User, passwordHash: string): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO users (id, username, role, is_active, password_hash)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        role = excluded.role,
        is_active = excluded.is_active
    `);

    insert.run(
      user.id,
      user.username,
      user.role,
      user.isActive ? 1 : 0,
      passwordHash
    );
  }
}
