import { UserRole } from '../../../domain/entities/User.js';

export interface UserListItem {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface IListUsersQuery {
  execute(): Promise<UserListItem[]>;
}
