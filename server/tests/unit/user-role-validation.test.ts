import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RegisterUseCase } from '../../src/application/use_cases/RegisterUseCase.js';
import { UpdateUserRoleUseCase } from '../../src/application/use_cases/UpdateUserRoleUseCase.js';
import { User } from '../../src/domain/entities/User.js';

function createUserRepository() {
  const users = new Map<string, User>();
  let updateRoleCalls = 0;
  return {
    get updateRoleCalls() {
      return updateRoleCalls;
    },
    async findByUsername(username: string) {
      return [...users.values()].find((user) => user.username === username) ?? null;
    },
    async findById(id: string) {
      return users.get(id) ?? null;
    },
    async findAll() {
      return [...users.values()];
    },
    async countAdmins() {
      return [...users.values()].filter((user) => user.role === 'ADMIN').length;
    },
    async countActiveAdmins() {
      return [...users.values()].filter((user) => user.role === 'ADMIN' && user.isActive).length;
    },
    async updateRole(id: string, role: User['role']) {
      updateRoleCalls += 1;
      const existing = users.get(id);
      if (!existing) return null;
      const updated = new User({
        id: existing.id,
        username: existing.username,
        passwordHash: existing.passwordHash,
        role,
        isActive: existing.isActive,
        createdAt: existing.createdAt,
        avatarUrl: existing.avatarUrl
      });
      users.set(id, updated);
      return updated;
    },
    async updateActive(id: string, isActive: boolean) {
      const existing = users.get(id);
      if (!existing) return null;
      const updated = new User({
        id: existing.id,
        username: existing.username,
        passwordHash: existing.passwordHash,
        role: existing.role,
        isActive,
        createdAt: existing.createdAt,
        avatarUrl: existing.avatarUrl
      });
      users.set(id, updated);
      return updated;
    },
    async deleteById(id: string) {
      return users.delete(id);
    },
    async save(user: User) {
      users.set(user.id, user);
    },
    async count() {
      return users.size;
    }
  };
}

describe('user role validation', () => {
  it('rejects unsupported role values when updating a user', async () => {
    const userRepository = createUserRepository();
    await userRepository.save(new User({
      id: 'viewer-1',
      username: 'viewer',
      passwordHash: 'hash',
      role: 'VIEWER'
    }));
    const useCase = new UpdateUserRoleUseCase(userRepository);

    await assert.rejects(
      () => useCase.execute({ userId: 'viewer-1', role: 'PARTNER' as any }),
      /Rol de usuario no válido/
    );
    assert.equal(userRepository.updateRoleCalls, 0);
  });

  it('rejects unsupported role values when registering a user', async () => {
    const userRepository = createUserRepository();
    const passwordHasher = {
      async hash(password: string) {
        return 'hashed:' + password;
      },
      async compare() {
        return false;
      }
    };
    const useCase = new RegisterUseCase(userRepository, passwordHasher);

    await assert.rejects(
      () => useCase.execute({ username: 'partner', passwordRaw: 'secret123', role: 'PARTNER' as any }),
      /Rol de usuario no válido/
    );
    assert.equal(await userRepository.count(), 0);
  });
});
