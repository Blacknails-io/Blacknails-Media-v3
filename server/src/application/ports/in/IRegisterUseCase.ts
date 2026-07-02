import { UserRole } from '../../../domain/entities/User.js';

export interface RegisterRequest {
  username: string;
  passwordRaw: string;
  role: UserRole;
}

export interface RegisterResponse {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface IRegisterUseCase {
  execute(request: RegisterRequest): Promise<RegisterResponse>;
}
