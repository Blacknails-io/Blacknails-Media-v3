import { HttpAuthService } from './HttpAuthService.js';
import { HttpPipelineService } from './HttpPipelineService.js';
import type { IAuthService } from './interfaces.js';
import type { IPipelineService } from './interfaces.js';

export const authService: IAuthService = new HttpAuthService();
export const pipelineService: IPipelineService = new HttpPipelineService();
export * from './interfaces.js';
