import { IEventBus } from '../../../application/ports/out/IEventBus.js';
import { SqliteEventRepository } from './SqliteEventRepository.js';
import Database from 'better-sqlite3';

export class OutboxDispatcher {
  private eventRepository: SqliteEventRepository;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    db: Database.Database,
    private eventBus: IEventBus,
    private intervalMs: number = 1000 // Frecuencia de chequeo (1 segundo por defecto)
  ) {
    this.eventRepository = new SqliteEventRepository(db);
  }

  /**
   * Inicia el bucle de polling para despachar eventos del outbox
   */
  public start(): void {
    if (this.intervalId) return;

    console.log(`[OutboxDispatcher] Iniciado bucle de despacho cada ${this.intervalMs}ms`);
    this.intervalId = setInterval(() => this.dispatchUnpublishedEvents(), this.intervalMs);
  }

  /**
   * Detiene el bucle de despacho
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[OutboxDispatcher] Detenido bucle de despacho');
    }
  }

  /**
   * Busca eventos no publicados en SQLite y los inyecta en el EventBus local
   */
  private async dispatchUnpublishedEvents(): Promise<void> {
    // Evitamos ejecuciones concurrentes si el ciclo anterior aún no ha terminado
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Obtenemos eventos pendientes de la tabla system_events (published = 0)
      const pendingEvents = await this.eventRepository.getUnpublished();
      
      if (pendingEvents.length > 0) {
        console.log(`[OutboxDispatcher] Encontrados ${pendingEvents.length} eventos pendientes de publicar`);
        
        for (const event of pendingEvents) {
          try {
            // 2. Publicamos el evento en nuestro EventBus local en memoria
            await this.eventBus.publish(event);

            // 3. Si la publicación es exitosa, lo marcamos como publicado en SQLite (published = 1)
            await this.eventRepository.markAsPublished(event.id);
          } catch (publishError) {
            console.error(`[OutboxDispatcher] Error al publicar evento ${event.id}:`, publishError);
            // No detenemos el bucle completo si un evento específico da error de publicación
          }
        }
      }
    } catch (error) {
      console.error('[OutboxDispatcher] Error en el ciclo de despacho:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
