import { randomUUID } from 'crypto';
import { AggregateRoot } from './AggregateRoot.js';

export type UserRole = 'ADMIN' | 'STANDARD' | 'VIEWER';

export interface UserProps {
  id?: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  avatarUrl?: string;
}

export class User extends AggregateRoot {
  public readonly id: string;
  public readonly username: string;
  public readonly passwordHash: string;
  public readonly role: UserRole;
  public readonly isActive: boolean;
  public readonly createdAt: string;
  public readonly avatarUrl?: string;

  constructor(props: UserProps) {
    super();
    this.id = props.id || randomUUID();
    this.username = props.username;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.avatarUrl = props.avatarUrl;
  }

  static create(props: { username: string; passwordHash: string; role: UserRole; avatarUrl?: string }): User {
    return new User({
      username: props.username,
      passwordHash: props.passwordHash,
      role: props.role,
      avatarUrl: props.avatarUrl,
    });
  }
}
