import type { AppEvent } from '@blacknails/shared';

export type BackendConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
type EventListener = (event: AppEvent) => void;
type StatusListener = (status: BackendConnectionStatus) => void;
type EventFilter = (event: AppEvent) => boolean;

interface EventSubscription {
  listener: EventListener;
  filter?: EventFilter;
}

export class BackendEventsController {
  private eventSource: EventSource | null = null;
  private status: BackendConnectionStatus = 'DISCONNECTED';
  private readonly eventSubscriptions = new Set<EventSubscription>();
  private readonly statusListeners = new Set<StatusListener>();

  public start(): void {
    if (this.eventSource) return;

    this.setStatus('CONNECTING');
    this.eventSource = new EventSource('/api/events/stream');

    this.eventSource.onopen = () => {
      this.setStatus('CONNECTED');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as AppEvent;
        this.emitEvent(parsed);
      } catch (error) {
        console.error('[SSE-Parser-Error] Error al parsear mensaje de eventos:', error);
      }
    };

    this.eventSource.onerror = () => {
      this.setStatus('DISCONNECTED');
    };
  }

  public stop(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public subscribeEvents(listener: EventListener, filter?: EventFilter): () => void {
    const sub: EventSubscription = { listener, filter };
    this.eventSubscriptions.add(sub);
    return () => {
      this.eventSubscriptions.delete(sub);
    };
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(status: BackendConnectionStatus): void {
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private emitEvent(event: AppEvent): void {
    for (const { listener, filter } of this.eventSubscriptions) {
      if (!filter || filter(event)) {
        listener(event);
      }
    }
  }
}

export const backendEventsController = new BackendEventsController();
