export interface Event {
  readonly id: string;
  readonly type: 'SYSTEM' | 'DOMAIN' | 'PROCESS';
  readonly occurredAt: string;
  readonly source: string;
  readonly message: string;
}

// Backward compatibility alias
export type BaseEvent = Event;

export interface SystemEvent extends Event {
  readonly type: 'SYSTEM';
  readonly subsystem: 'APPLICATION' | 'DATABASE' | 'REDIS' | 'KAFKA' | 'AUTH';
  readonly action: 'STARTED' | 'STOPPED' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}

export interface DomainEvent extends Event {
  readonly type: 'DOMAIN';
  readonly entityType: 'Asset' | 'Face' | 'MediaFile' | 'Session' | 'User';
  readonly entityId: string;
  readonly action:
    | 'CREATED'
    | 'UPDATED'
    | 'DELETED'
    | 'PROCESSED'
    | 'INDEXED'
    | 'DETECTED'
    | 'GROUPED'
    | 'STARTED'
    | 'FINISHED'
    | 'LOGIN'
    | 'LOGOUT';
}

export interface ProcessEvent extends Event {
  readonly type: 'PROCESS';
  readonly processName:
    | 'IMPORT'
    | 'INDEX'
    | 'AI'
    | 'TAGS'
    | 'TRANSCODING'
    | 'NSFW'
    | 'DESCRIPTION'
    | 'FACE_DETECTION'
    | 'FACE_CLUSTERING'
    | 'THUMBNAIL'
    | 'TITLE';
  readonly subsystem?: string;
  readonly action:
    | 'STARTED'
    | 'FINISHED'
    | 'FAILED'
    | 'SUCCESS'
    | 'COMPLETED'
    | 'DUPLICATED'
    | 'REJECTED';
  readonly itemId?: string;
  readonly status?: string;
}

export type AppEvent = SystemEvent | DomainEvent | ProcessEvent;


