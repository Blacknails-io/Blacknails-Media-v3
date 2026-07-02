import { IDeleteUserUseCase, DeleteUserRequest, DeleteUserResponse } from '../ports/in/IDeleteUserUseCase.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';

export class DeleteUserUseCase implements IDeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  public async execute(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    const existingUser = await this.userRepository.findById(request.userId);
    if (!existingUser) {
      throw new Error('No se encontró el usuario a eliminar.');
    }

    if (existingUser.role === 'ADMIN') {
      const totalAdmins = await this.userRepository.countAdmins();
      if (totalAdmins <= 1) {
        throw new Error('Debe existir al menos un usuario ADMIN.');
      }
    }

    const deleted = await this.userRepository.deleteById(request.userId);
    if (!deleted) {
      throw new Error('No se pudo eliminar el usuario.');
    }

    return {
      id: existingUser.id,
      username: existingUser.username
    };
  }
}
