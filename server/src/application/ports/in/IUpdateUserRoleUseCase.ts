import { UserRole } from '../../../domain/entities/User.js';

export interface UpdateUserRoleRequest {
  userId: string;
  role: UserRole;
}

export interface UpdateUserRoleResponse {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface IUpdateUserRoleUseCase {
  execute(request: UpdateUserRoleRequest): Promise<UpdateUserRoleResponse>;
}
