import { User } from '../../../domain/User.js';

/**
 * PUERTO DE SALIDA (Driven Port / Outbound Port)
 * 
 * Capa: application/ports/out/
 * Reglas:
 * - Interfaz que define el contrato para los servicios externos o base de datos.
 * - El caso de uso depende de esta interfaz, NO de la base de datos concreta (SQLite).
 * - Implementado por adaptadores de salida (outbound adapters).
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  save(user: User, passwordHash: string): Promise<void>;
}
