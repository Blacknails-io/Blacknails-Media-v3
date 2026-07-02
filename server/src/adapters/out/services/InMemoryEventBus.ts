import { EventEmitter } from 'events';
import { IEventBus } from '../../../application/ports/out/IEventBus.js';
import { AppEvent } from '@blacknails/shared';

export class InMemoryEventBus implements IEventBus {
  private emitter = new EventEmitter();

  constructor(private readonly persistEvent?: (event: AppEvent) => Promise<void>) {
    // Incrementamos el límite de oyentes para evitar avisos de Node
    this.emitter.setMaxListeners(50);
  }

  public async publish(event: AppEvent): Promise<void> {
    let details = '';
    if (event.type === 'SYSTEM') {
      details = `${event.subsystem}:${event.action}`;
    } else if (event.type === 'DOMAIN') {
      details = `${event.entityType}:${event.entityId}:${event.action}`;
    } else if (event.type === 'PROCESS') {
      details = `${event.processName}:${event.action}`;
    }
    console.log(`[InMemoryEventBus] [PUBLISH] ${event.type}:${details} | Message: "${event.message}" | ID: ${event.id}`);

    if (this.persistEvent) {
      try {
        await this.persistEvent(event);
      } catch (error) {
        console.error('[InMemoryEventBus] Error persistiendo evento:', error);
      }
    }
    
    // Emitimos el evento bajo el canal de la acción
    this.emitter.emit(event.action, event);
    // Y un canal comodín para capturar todo el tráfico (útil para auditoría y SSE global)
    this.emitter.emit('*', event);
  }

  public subscribe(action: string, handler: (event: AppEvent) => void): void {
    this.emitter.on(action, handler);
  }
}
