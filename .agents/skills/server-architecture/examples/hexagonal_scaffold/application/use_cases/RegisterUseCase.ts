import { IRegisterUseCase, RegisterInput } from '../ports/in/IRegisterUseCase.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';
import { User } from '../../domain/User.js';
import { randomUUID } from 'crypto';

/**
 * CASO DE USO (Use Case / Interactor)
 * 
 * Capa: application/use_cases/
 * Reglas:
 * - Implementa el puerto de entrada (`IRegisterUseCase`).
 * - Consume puertos de salida (`IUserRepository`) mediante inyección de dependencias.
 * - Orquesta las reglas del dominio pura.
 * - NO debe importar nada de Express, ni saber nada de `req`/`res`.
 */
export class RegisterUseCase implements IRegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  public async execute(input: RegisterInput): Promise<User> {
    // 1. Validar reglas de negocio usando puertos de salida
    const existingUser = await this.userRepository.findByUsername(input.username);
    if (existingUser) {
      throw new Error('El nombre de usuario ya está registrado.');
    }

    // 2. Crear entidad de dominio
    const userId = randomUUID();
    const newUser = new User(
      userId,
      input.username,
      input.role || 'STANDARD',
      true // activo por defecto
    );

    // 3. Hashear contraseña (ejemplo simple, en producción se usaría un hasher inyectado)
    const dummyHash = `sha256-mocked-${input.passwordRaw}`;

    // 4. Guardar mediante el puerto de salida
    await this.userRepository.save(newUser, dummyHash);

    // 5. Devolver entidad pura
    return newUser;
  }
}
