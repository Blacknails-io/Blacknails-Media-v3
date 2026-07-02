import Database from 'better-sqlite3';
import { IUnitOfWork } from '../../../application/ports/out/IUnitOfWork.js';
import { IAssetRepository } from '../../../application/ports/out/IAssetRepository.js';
import { IMediaFileRepository } from '../../../application/ports/out/IMediaFileRepository.js';
import { IEventRepository } from '../../../application/ports/out/IEventRepository.js';
import { SqliteAssetRepository } from './SqliteAssetRepository.js';
import { SqliteEventRepository } from './SqliteEventRepository.js';
import { SqliteMediaFileRepository } from './SqliteMediaFileRepository.js';
import { SqliteWorkerExecutionRepository } from './SqliteWorkerExecutionRepository.js';
import { AppEvent } from '@blacknails/shared';

export class SqliteUnitOfWork implements IUnitOfWork {
  public readonly assets: IAssetRepository;
  public readonly mediaFiles: IMediaFileRepository;
  public readonly events: SqliteEventRepository;
  public readonly workerExecutions: SqliteWorkerExecutionRepository;
  
  private accumulatedEvents: AppEvent[] = [];
  private isTransactionActive = false;

  constructor(private db: Database.Database) {
    // Instanciamos los repositorios.
    // Para assets, inyectamos la callback que recoge sus eventos de dominio en nuestra lista
    this.assets = new SqliteAssetRepository(this.db, (events) => {
      this.accumulatedEvents.push(...events);
    });
    this.mediaFiles = new SqliteMediaFileRepository(this.db);
    this.events = new SqliteEventRepository(this.db);
    this.workerExecutions = new SqliteWorkerExecutionRepository(this.db);
  }

  public async runTransaction<T>(work: (uow: IUnitOfWork) => Promise<T>): Promise<T> {
    if (this.isTransactionActive) {
      // Si ya hay una transacción activa, ejecutamos en el mismo contexto para evitar bloqueos
      return work(this);
    }

    this.db.prepare('BEGIN').run();
    this.isTransactionActive = true;

    try {
      const result = await work(this);

      // 1. Guardamos todos los eventos recolectados en la tabla 'system_events' (Outbox)
      // Esto se ejecuta DENTRO de la misma transacción SQL
      for (const event of this.accumulatedEvents) {
        await this.events.save(event);
      }

      // 2. Sellamos la transacción SQL de forma atómica
      this.db.prepare('COMMIT').run();
      
      this.accumulatedEvents = [];
      this.isTransactionActive = false;

      return result;
    } catch (error) {
      // Deshacemos todo si algo explota
      this.db.prepare('ROLLBACK').run();
      this.accumulatedEvents = [];
      this.isTransactionActive = false;
      throw error;
    }
  }
}
