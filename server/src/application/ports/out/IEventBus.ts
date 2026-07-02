import { AppEvent } from '@blacknails/shared';

export interface IEventBus {
  /**
   * Publica un evento de sistema para que los suscriptores locales lo procesen.
   */
  publish(event: AppEvent): Promise<void>;

  /**
   * Se suscribe a una acción específica del sistema.
   * Ej: eventBus.subscribe('STARTUP', (event) => { ... })
   */
  subscribe(action: string, handler: (event: AppEvent) => void): void;
}
