import type { AppEvent } from '@blacknails/shared';

export type BackendConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
export type EventListener = (event: AppEvent) => void;
export type StatusListener = (status: BackendConnectionStatus) => void;
export type EventFilter = (event: AppEvent) => boolean;

export interface EventSubscription {
  listener: EventListener;
  filter?: EventFilter;
}
