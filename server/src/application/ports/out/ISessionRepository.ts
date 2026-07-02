import { Session } from '../../../domain/entities/Session.js';

export interface ISessionRepository {
  findByToken(token: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  deleteByToken(token: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
