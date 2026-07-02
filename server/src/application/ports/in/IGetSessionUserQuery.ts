import { User } from '../../../domain/entities/User.js';

export interface IGetSessionUserQuery {
  execute(token: string): Promise<User | null>;
}
