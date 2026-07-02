import { IUpdateAvatarUseCase, IUpdateAvatarCommand } from '../ports/in/IUpdateAvatarUseCase.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';
import { User } from '../../domain/entities/User.js';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

import { IEventBus } from '../ports/out/IEventBus.js';
import { UserDomainEvent } from '../events/SystemEvents.js';

export class UpdateAvatarUseCase implements IUpdateAvatarUseCase {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: IEventBus
  ) {}

  async execute(command: IUpdateAvatarCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Carpeta destino: ./data/users/{userId}/
    const userDir = path.resolve(`./data/users/${command.userId}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const outputPath = path.join(userDir, 'avatar.webp');
    const relativeUrl = `/static/users/${command.userId}/avatar.webp?t=${Date.now()}`;

    // Procesar con ffmpeg: crop 1:1, scale 200x200, remove audio, max 5s, webp format
    await new Promise<void>((resolve, reject) => {
      ffmpeg(command.tempFilePath)
        .setDuration(5) // Limitar a 5 segundos
        .noAudio() // Sin audio
        .outputOptions([
          '-vf', "crop=w='min(in_w,in_h)':h='min(in_w,in_h)',scale=200:200",
          '-vcodec', 'libwebp',
          '-loop', '0',
          '-an',
          '-vsync', '0'
        ])
        .toFormat('webp')
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    // Clean up temp file
    if (fs.existsSync(command.tempFilePath)) {
      fs.unlinkSync(command.tempFilePath);
    }

    // Save avatarUrl to DB
    const updatedUser = new User({
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      avatarUrl: relativeUrl
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
