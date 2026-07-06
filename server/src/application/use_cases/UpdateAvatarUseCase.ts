import { IUpdateAvatarUseCase, IUpdateAvatarCommand } from '../ports/in/IUpdateAvatarUseCase.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';
import { User } from '../../domain/entities/User.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IAvatarStorageService } from '../ports/out/IAvatarStorageService.js';
import { UserDomainEvent } from '../events/SystemEvents.js';

export class UpdateAvatarUseCase implements IUpdateAvatarUseCase {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: IEventBus,
    private avatarStorageService: IAvatarStorageService
  ) {}

  async execute(command: IUpdateAvatarCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Process, crop, scale, transcode to webp and persist avatar via outbound port
    const avatarUrl = await this.avatarStorageService.processAndSaveAvatar(
      command.tempFilePath,
      command.userId
    );

    // Save avatarUrl to DB
    const updatedUser = new User({
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      avatarUrl
    });

    await this.userRepository.save(updatedUser);

    await this.eventBus.publish(new UserDomainEvent(
      updatedUser.id,
      'UPDATED',
      'UpdateAvatarUseCase',
      `El usuario ${updatedUser.username} ha actualizado su avatar.`
    ));

    return updatedUser;
  }
}

