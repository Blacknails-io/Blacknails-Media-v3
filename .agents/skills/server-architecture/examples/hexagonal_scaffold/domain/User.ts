/**
 * ENTIDAD DE DOMINIO (Domain Entity)
 * 
 * Capa: domain/
 * Reglas:
 * - Pura y sin contaminar.
 * - NO debe importar nada relacionado con Express, base de datos (SQLite, Sequelize),
 *   sistema de archivos (fs) o librerías de infraestructura.
 * - Contiene el estado puro y la lógica de negocio del modelo.
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    private _role: 'ADMIN' | 'STANDARD' | 'VIEWER',
    private _isActive: boolean
  ) {
    if (!username || username.trim().length < 3) {
      throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
    }
  }

  // Getters
  public get role() {
    return this._role;
  }

  public get isActive() {
    return this._isActive;
  }

  // Métodos de negocio / Reglas de transición de estado
  public changeRole(newRole: 'ADMIN' | 'STANDARD' | 'VIEWER', requestedBy: User): void {
    if (requestedBy.role !== 'ADMIN') {
      throw new Error('Solo los administradores pueden cambiar roles de usuario.');
    }
    this._role = newRole;
  }

  public deactivate(requestedBy: User): void {
    if (requestedBy.role !== 'ADMIN') {
      throw new Error('Solo los administradores pueden desactivar cuentas.');
    }
    if (requestedBy.id === this.id) {
      throw new Error('No puedes desactivarte a ti mismo.');
    }
    this._isActive = false;
  }
}
