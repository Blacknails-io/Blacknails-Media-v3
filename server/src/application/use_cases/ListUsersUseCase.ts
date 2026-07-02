import { IListUsersQuery, UserListItem } from '../ports/in/IListUsersQuery.js';
import { IUserRepository } from '../ports/out/IUserRepository.js';

export class ListUsersUseCase implements IListUsersQuery {
  constructor(private userRepository: IUserRepository) {}

  public async execute(): Promise<UserListItem[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    }));
  }
}
