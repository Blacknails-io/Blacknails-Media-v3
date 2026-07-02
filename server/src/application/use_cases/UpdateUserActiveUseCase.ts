import { IUpdateUserActiveUseCase, UpdateUserActiveRequest, UpdateUserActiveResponse } from '../ports/in/IUpdateUserActiveUseCase.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';

export class UpdateUserActiveUseCase implements IUpdateUserActiveUseCase {
  constructor(private userRepository: IUserRepository) {}

  public async execute(request: UpdateUserActiveRequest): Promise<UpdateUserActiveResponse> {
    const targetUser = await this.userRepository.findById(request.userId);
    if (!targetUser) {
      throw new Error('No se encontró el usuario a actualizar.');
    }

    if (targetUser.role === 'ADMIN' && targetUser.isActive && !request.isActive) {
      const activeAdmins = await this.userRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new Error('Debe existir al menos un usuario ADMIN activo.');
      }
    }

    const updatedUser = await this.userRepository.updateActive(request.userId, request.isActive);
    if (!updatedUser) {
      throw new Error('No se encontró el usuario a actualizar.');
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      isActive: updatedUser.isActive
    };
  }
}
