import { IUpdateUserRoleUseCase, UpdateUserRoleRequest, UpdateUserRoleResponse } from '../ports/in/IUpdateUserRoleUseCase.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';
import { UserRole } from '../../domain/entities/User.js';

const VALID_USER_ROLES = new Set<UserRole>(['ADMIN', 'STANDARD', 'VIEWER']);

export class UpdateUserRoleUseCase implements IUpdateUserRoleUseCase {
  constructor(private userRepository: IUserRepository) {}

  public async execute(request: UpdateUserRoleRequest): Promise<UpdateUserRoleResponse> {
    if (!VALID_USER_ROLES.has(request.role)) {
      throw new Error('Rol de usuario no válido.');
    }

    const targetUser = await this.userRepository.findById(request.userId);
    if (!targetUser) {
      throw new Error('No se encontró el usuario a actualizar.');
    }

    if (targetUser.role === 'ADMIN' && request.role !== 'ADMIN') {
      const totalAdmins = await this.userRepository.countAdmins();
      if (totalAdmins <= 1) {
        throw new Error('Debe existir al menos un usuario ADMIN.');
      }
    }

    const updatedUser = await this.userRepository.updateRole(request.userId, request.role);
    if (!updatedUser) {
      throw new Error('No se encontró el usuario a actualizar.');
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt
    };
  }
}
