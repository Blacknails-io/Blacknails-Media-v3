export interface UserDTO {
  id: string;
  username: string;
  role: 'ADMIN' | 'STANDARD' | 'VIEWER';
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

export interface AdminUserDTO extends UserDTO {}

export interface LoginResponse {
  token: string;
  username: string;
  role: 'ADMIN' | 'STANDARD' | 'VIEWER';
  isActive: boolean;
  expiresAt: string;
  avatarUrl?: string;
}

export interface IAuthService {
  login(username: string, passwordRaw: string, clientId: string): Promise<LoginResponse>;
  register(username: string, passwordRaw: string, role: 'ADMIN' | 'STANDARD' | 'VIEWER'): Promise<UserDTO>;
  getProfile(token: string): Promise<UserDTO>;
  logout(token?: string): Promise<void>;
  listUsers(token: string): Promise<AdminUserDTO[]>;
  updateUserRole(token: string, userId: string, role: 'ADMIN' | 'STANDARD' | 'VIEWER'): Promise<AdminUserDTO>;
  updateUserActive(token: string, userId: string, isActive: boolean): Promise<AdminUserDTO>;
  deleteUser(token: string, userId: string): Promise<void>;
}

export interface PipelineWorkerDTO {
  id: string;
  label: string;
  isRunning: boolean;
  isExecuting?: boolean;
  currentAssetType?: 'PHOTO' | 'VIDEO';
  intervalMs: number;
  pendingItems: number;
  lastRunAt?: string;
  lastTriggeredAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  provides: string[];
  requires: string[];
}

export interface IPipelineService {
  getWorkers(token: string): Promise<PipelineWorkerDTO[]>;
  getWorker(token: string, workerId: string): Promise<PipelineWorkerDTO>;
  startWorker(token: string, workerId: string): Promise<PipelineWorkerDTO>;
  stopWorker(token: string, workerId: string): Promise<PipelineWorkerDTO>;
  triggerWorker(token: string, workerId: string): Promise<PipelineWorkerDTO>;
  resetWorker(token: string, workerId: string): Promise<PipelineWorkerDTO>;
}

export interface PersonDTO {
  id: string;
  label: string;
  name?: string;
  faceCount: number;
  bbox: { x: number; y: number; width: number; height: number };
  thumbnailUrl: string;
}

import type { MediaAsset } from '../../types/MediaAsset.js';

export interface IPeopleService {
  list(token?: string): Promise<PersonDTO[]>;
  getAssets(personId: string, token?: string): Promise<MediaAsset[]>;
  updateName(personId: string, name: string, token?: string): Promise<void>;
  deletePerson(personId: string, token?: string): Promise<void>;
}
