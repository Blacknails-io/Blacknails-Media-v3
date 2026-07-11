import { ILoginUseCase, LoginRequest, LoginResponse } from '../ports/in/ILoginUseCase.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';
import { ISessionRepository } from '../ports/out/ISessionRepository.js';
import { IPasswordHasher } from '../ports/out/IPasswordHasher.js';
import { Session } from '../../domain/entities/Session.js';

export class LoginUseCase implements ILoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private sessionRepository: ISessionRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  public async execute(request: LoginRequest): Promise<LoginResponse> {
    const user = await this.userRepository.findByUsername(request.username);
    if (!user) {
      throw new Error('Credenciales incorrectas.');
    }

    if (!user.isActive) {
      throw new Error('La cuenta está desactivada.');
    }

    const matches = await this.passwordHasher.compare(request.passwordRaw, user.passwordHash);
    if (!matches) {
      throw new Error('Credenciales incorrectas.');
    }

    // Session duration: 30 days if rememberMe, otherwise 24 hours
    const durationDays = request.rememberMe ? 30 : 1;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const session = new Session({
      userId: user.id,
      expiresAt
    });

    await this.sessionRepository.save(session);

    return {
      token: session.token,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      expiresAt,
      userId: user.id
    };
  }
}
