import { IRegisterUseCase, RegisterRequest, RegisterResponse } from '../ports/in/IRegisterUseCase.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';
import { IPasswordHasher } from '../ports/out/IPasswordHasher.js';
import { User, UserRole } from '../../domain/entities/User.js';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VALID_USER_ROLES = new Set<UserRole>(['ADMIN', 'STANDARD', 'VIEWER']);

export class RegisterUseCase implements IRegisterUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  public async execute(request: RegisterRequest): Promise<RegisterResponse> {
    if (!VALID_USER_ROLES.has(request.role)) {
      throw new Error('Rol de usuario no válido.');
    }

    const existingUser = await this.userRepository.findByUsername(request.username);
    if (existingUser) {
      throw new Error(`El nombre de usuario '${request.username}' ya está registrado.`);
    }

    const passwordHash = await this.passwordHasher.hash(request.passwordRaw);

    const newUserId = randomUUID();
    const user = new User({
      id: newUserId,
      username: request.username,
      passwordHash,
      role: request.role,
      avatarUrl: `/static/users/${newUserId}/avatar.svg`
    });

    await this.userRepository.save(user);

    const userDir = path.resolve(`./data/users/${user.id}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const defaultAvatarPath = path.resolve(__dirname, '../../assets/default-avatar.svg');
    const destAvatarPath = path.join(userDir, 'avatar.svg');
    if (fs.existsSync(defaultAvatarPath)) {
      fs.copyFileSync(defaultAvatarPath, destAvatarPath);
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };
  }
}
