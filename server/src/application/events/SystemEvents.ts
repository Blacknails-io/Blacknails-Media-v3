import { randomUUID } from 'crypto';
import {
  SystemEvent,
  DomainEvent,
  ProcessEvent
} from '@blacknails/shared';

// --- SYSTEM EVENTS ---

export class ApplicationStartedEvent implements SystemEvent {
  public readonly id = randomUUID();
  public readonly type = 'SYSTEM';
  public readonly subsystem = 'APPLICATION';
  public readonly action = 'STARTED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string
  ) {}
}

export class SystemStartupEvent extends ApplicationStartedEvent {}

export class ApplicationStoppedEvent implements SystemEvent {
  public readonly id = randomUUID();
  public readonly type = 'SYSTEM';
  public readonly subsystem = 'APPLICATION';
  public readonly action = 'STOPPED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string
  ) {}
}

export class DatabaseConnectedEvent implements SystemEvent {
  public readonly id = randomUUID();
  public readonly type = 'SYSTEM';
  public readonly subsystem = 'DATABASE';
  public readonly action = 'CONNECTED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string
  ) {}
}

export class KafkaConnectedEvent implements SystemEvent {
  public readonly id = randomUUID();
  public readonly type = 'SYSTEM';
  public readonly subsystem = 'KAFKA';
  public readonly action = 'CONNECTED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string
  ) {}
}

// --- AUTH / SYSTEM EVENTS ---

export class AuthSuccessEvent implements SystemEvent {
  public readonly id = randomUUID();
  public readonly type = 'SYSTEM';
  public readonly subsystem = 'AUTH';
  public readonly action = 'CONNECTED' as any; // Map to SYSTEM allowed action
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string
  ) {}
}

export class AuthFailedEvent implements SystemEvent {
  public readonly id = randomUUID();
  public readonly type = 'SYSTEM';
  public readonly subsystem = 'AUTH';
  public readonly action = 'ERROR' as any; // Map to SYSTEM allowed action
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string
  ) {}
}

// --- IMPORT PROCESS EVENTS ---

export class ImportStartedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'IMPORT';
  public readonly subsystem = 'IMPORT';
  public readonly action = 'STARTED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string
  ) {}
}

export class ImportCompletedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'IMPORT';
  public readonly subsystem = 'IMPORT';
  public readonly action = 'COMPLETED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string,
    public readonly status?: string
  ) {}
}

export class ImportFailedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'IMPORT';
  public readonly subsystem = 'IMPORT';
  public readonly action = 'FAILED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string
  ) {}
}

export class MediaImportedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'IMPORT';
  public readonly subsystem = 'IMPORT';
  public readonly action = 'SUCCESS';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly itemId: string,
    public readonly workerName?: string,
    public readonly status?: string
  ) {}
}

export class ImportDuplicateEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'IMPORT';
  public readonly subsystem = 'IMPORT';
  public readonly action = 'DUPLICATED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly itemId: string,
    public readonly workerName?: string
  ) {}
}

export class ImportRejectedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'IMPORT';
  public readonly subsystem = 'IMPORT';
  public readonly action = 'REJECTED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly itemId: string,
    public readonly workerName?: string
  ) {}
}

// --- INDEX PROCESS EVENTS ---

export class IndexStartedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'INDEX';
  public readonly subsystem = 'INDEX';
  public readonly action = 'STARTED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string
  ) {}
}

export class IndexCompletedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'INDEX';
  public readonly subsystem = 'INDEX';
  public readonly action = 'COMPLETED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string,
    public readonly status?: string
  ) {}
}

export class IndexFailedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'INDEX';
  public readonly subsystem = 'INDEX';
  public readonly action = 'FAILED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string
  ) {}
}

export class MediaIndexedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName = 'INDEX';
  public readonly subsystem = 'INDEX';
  public readonly action = 'SUCCESS';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly itemId?: string,
    public readonly workerName?: string,
    public readonly status?: string
  ) {}
}

// --- AI PROCESS EVENTS ---

function getAiProcessName(workerName?: string): 'AI' | 'TAGS' | 'TITLE' | 'DESCRIPTION' | 'NSFW' | 'FACE_DETECTION' | 'FACE_CLUSTERING' | 'THUMBNAIL' {
  if (!workerName) return 'AI';
  const name = workerName.toLowerCase();
  if (name.includes('tags')) return 'TAGS';
  if (name.includes('title')) return 'TITLE';
  if (name.includes('description')) return 'DESCRIPTION';
  if (name.includes('nsfw')) return 'NSFW';
  if (name.includes('face-cluster') || name.includes('facecluster')) return 'FACE_CLUSTERING';
  if (name.includes('face')) return 'FACE_DETECTION';
  if (name.includes('thumbnail')) return 'THUMBNAIL';
  return 'AI';
}

export class AiProcessingStartedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName: 'AI' | 'TAGS' | 'TITLE' | 'DESCRIPTION' | 'NSFW' | 'FACE_DETECTION' | 'FACE_CLUSTERING' | 'THUMBNAIL';
  public readonly subsystem = 'AI';
  public readonly action = 'STARTED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string
  ) {
    this.processName = getAiProcessName(workerName || source);
  }
}

export class AiProcessingCompletedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName: 'AI' | 'TAGS' | 'TITLE' | 'DESCRIPTION' | 'NSFW' | 'FACE_DETECTION' | 'FACE_CLUSTERING' | 'THUMBNAIL';
  public readonly subsystem = 'AI';
  public readonly action = 'COMPLETED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string,
    public readonly status?: string
  ) {
    this.processName = getAiProcessName(workerName || source);
  }
}

export class AiProcessingFailedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName: 'AI' | 'TAGS' | 'TITLE' | 'DESCRIPTION' | 'NSFW' | 'FACE_DETECTION' | 'FACE_CLUSTERING' | 'THUMBNAIL';
  public readonly subsystem = 'AI';
  public readonly action = 'FAILED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string
  ) {
    this.processName = getAiProcessName(workerName || source);
  }
}

export class AssetProcessedEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName: 'AI' | 'TAGS' | 'TITLE' | 'DESCRIPTION' | 'NSFW' | 'FACE_DETECTION' | 'FACE_CLUSTERING' | 'THUMBNAIL';
  public readonly subsystem = 'AI';
  public readonly action = 'SUCCESS';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly itemId: string,
    public readonly workerName?: string,
    public readonly status = 'PROCESSED'
  ) {
    this.processName = getAiProcessName(workerName || source);
  }
}

export class AiErrorEvent implements ProcessEvent {
  public readonly id = randomUUID();
  public readonly type = 'PROCESS';
  public readonly processName: 'AI' | 'TAGS' | 'TITLE' | 'DESCRIPTION' | 'NSFW' | 'FACE_DETECTION' | 'FACE_CLUSTERING' | 'THUMBNAIL';
  public readonly subsystem = 'AI';
  public readonly action = 'FAILED';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly source: string,
    public readonly message: string,
    public readonly workerName?: string
  ) {
    this.processName = getAiProcessName(workerName || source);
  }
}

// --- DOMAIN EVENTS ---

export class AssetDomainEvent implements DomainEvent {
  public readonly id = randomUUID();
  public readonly type = 'DOMAIN';
  public readonly entityType = 'Asset';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly entityId: string,
    public readonly action: 'CREATED' | 'UPDATED' | 'DELETED' | 'PROCESSED' | 'INDEXED',
    public readonly source: string,
    public readonly message: string
  ) {}
}

export class FaceDomainEvent implements DomainEvent {
  public readonly id = randomUUID();
  public readonly type = 'DOMAIN';
  public readonly entityType = 'Face';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly entityId: string,
    public readonly action: 'DETECTED' | 'GROUPED' | 'DELETED',
    public readonly source: string,
    public readonly message: string
  ) {}
}

export class MediaFileDomainEvent implements DomainEvent {
  public readonly id = randomUUID();
  public readonly type = 'DOMAIN';
  public readonly entityType = 'MediaFile';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly entityId: string,
    public readonly action: 'CREATED' | 'DELETED',
    public readonly source: string,
    public readonly message: string
  ) {}
}

export class SessionDomainEvent implements DomainEvent {
  public readonly id = randomUUID();
  public readonly type = 'DOMAIN';
  public readonly entityType = 'Session';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly entityId: string,
    public readonly action: 'STARTED' | 'FINISHED',
    public readonly source: string,
    public readonly message: string
  ) {}
}

export class UserDomainEvent implements DomainEvent {
  public readonly id = randomUUID();
  public readonly type = 'DOMAIN';
  public readonly entityType = 'User';
  public readonly occurredAt = new Date().toISOString();

  constructor(
    public readonly entityId: string,
    public readonly action: 'CREATED' | 'DELETED' | 'LOGIN' | 'LOGOUT' | 'UPDATED',
    public readonly source: string,
    public readonly message: string
  ) {}
}
