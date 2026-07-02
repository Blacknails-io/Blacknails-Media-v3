import { IGetSessionUserQuery } from '../ports/in/IGetSessionUserQuery.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';
import { ISessionRepository } from '../ports/out/ISessionRepository.js';
import { User } from '../../domain/entities/User.js';

export class GetSessionUserUseCase implements IGetSessionUserQuery {
  constructor(
    private userRepository: IUserRepository,
    private sessionRepository: ISessionRepository
  ) {}

  public async execute(token: string): Promise<User | null> {
    if (!token) return null;

    const session = await this.sessionRepository.findByToken(token);
    if (!session) return null;

    if (session.isExpired()) {
      await this.sessionRepository.deleteByToken(token);
      return null;
    }

    const user = await this.userRepository.findById(session.userId);
    if (user && !user.isActive) {
      await this.sessionRepository.deleteByToken(token);
      return null;
    }
    return user;
  }
}
