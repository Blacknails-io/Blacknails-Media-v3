/*
 * Copyright (c) 2026 MyCompany LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { UpdateAvatarUseCase } from '../../../src/application/use_cases/UpdateAvatarUseCase.js';
import { IUserRepository } from '../../../src/application/ports/out/IUserRepository.js';
import { IAvatarStorageService } from '../../../src/application/ports/out/IAvatarStorageService.js';
import { IEventBus } from '../../../src/application/ports/out/IEventBus.js';
import { User } from '../../../src/domain/entities/User.js';

test.describe('UpdateAvatarUseCase', () => {
  test('should successfully update user avatar and publish event', async () => {
    // Arrange
    const mockUser = new User({
      id: 'user-123',
      username: 'testuser',
      passwordHash: 'hash',
      role: 'STANDARD',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    let savedUser: User | null = null;
    const mockUserRepository = {
      findById: async (id: string) => (id === 'user-123' ? mockUser : null),
      save: async (user: User) => {
        savedUser = user;
      }
    } as unknown as IUserRepository;

    let processedTempPath = '';
    let processedUserId = '';
    const mockAvatarStorageService: IAvatarStorageService = {
      processAndSaveAvatar: async (tempPath, userId) => {
        processedTempPath = tempPath;
        processedUserId = userId;
        return `/static/users/${userId}/avatar.webp?t=123`;
      }
    };

    let publishedEvent: any = null;
    const mockEventBus = {
      publish: async (event: any) => {
        publishedEvent = event;
      }
    } as unknown as IEventBus;

    const useCase = new UpdateAvatarUseCase(
      mockUserRepository,
      mockEventBus,
      mockAvatarStorageService
    );

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      tempFilePath: '/tmp/upload-avatar.jpg'
    });

    // Assert
    assert.strictEqual(result.avatarUrl, '/static/users/user-123/avatar.webp?t=123');
    assert.ok(savedUser);
    assert.strictEqual((savedUser as User).avatarUrl, '/static/users/user-123/avatar.webp?t=123');
    assert.strictEqual(processedTempPath, '/tmp/upload-avatar.jpg');
    assert.strictEqual(processedUserId, 'user-123');
    assert.ok(publishedEvent);
    assert.strictEqual(publishedEvent.type, 'DOMAIN');
    assert.strictEqual(publishedEvent.action, 'UPDATED');
  });

  test('should throw error if user does not exist', async () => {
    // Arrange
    const mockUserRepository = {
      findById: async () => null
    } as unknown as IUserRepository;

    const mockAvatarStorageService: IAvatarStorageService = {
      processAndSaveAvatar: async () => ''
    };

    const mockEventBus = {
      publish: async () => {}
    } as unknown as IEventBus;

    const useCase = new UpdateAvatarUseCase(
      mockUserRepository,
      mockEventBus,
      mockAvatarStorageService
    );

    // Act & Assert
    await assert.rejects(
      useCase.execute({
        userId: 'invalid-user',
        tempFilePath: '/tmp/upload-avatar.jpg'
      }),
      /User not found/
    );
  });
});
