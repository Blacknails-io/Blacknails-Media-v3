import { HttpAuthService } from './HttpAuthService.js';
import { HttpPipelineService } from './HttpPipelineService.js';
import { HttpPeopleService } from './HttpPeopleService.js';
import type { IAuthService } from './interfaces.js';
import type { IPipelineService } from './interfaces.js';
import type { IPeopleService } from './interfaces.js';

export const authService: IAuthService = new HttpAuthService();
export const pipelineService: IPipelineService = new HttpPipelineService();
export const peopleService: IPeopleService = new HttpPeopleService();
export * from './interfaces.js';
