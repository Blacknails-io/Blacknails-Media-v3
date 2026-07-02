import { User } from '../../../domain/entities/User.js';

export interface IUpdateAvatarCommand {
  userId: string;
  tempFilePath: string;
}

export interface IUpdateAvatarUseCase {
  execute(command: IUpdateAvatarCommand): Promise<User>;
}
