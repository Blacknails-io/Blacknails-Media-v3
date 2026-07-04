import { User } from '../../../domain/User.js';

export interface RegisterInput {
  username: string;
  passwordRaw: string;
  role?: 'ADMIN' | 'STANDARD' | 'VIEWER';
}

/**
 * PUERTO DE ENTRADA (Driving Port / Inbound Port)
 * 
 * Capa: application/ports/in/
 * Reglas:
 * - Define la interfaz o contrato del caso de uso.
 * - Es la puerta de entrada a la aplicación (el Hexágono).
 * - Utilizado por los controladores (HTTP, CLI, etc.) para interactuar con la lógica.
 */
export interface IRegisterUseCase {
  execute(input: RegisterInput): Promise<User>;
}
