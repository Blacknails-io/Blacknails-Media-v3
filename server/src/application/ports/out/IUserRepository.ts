import { User } from '../../../domain/entities/User.js';

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  countAdmins(): Promise<number>;
  countActiveAdmins(): Promise<number>;
  updateRole(id: string, role: User['role']): Promise<User | null>;
  updateActive(id: string, isActive: boolean): Promise<User | null>;
  deleteById(id: string): Promise<boolean>;
  save(user: User): Promise<void>;
  count(): Promise<number>;
}
