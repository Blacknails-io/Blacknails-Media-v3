import { IAssetRepository } from './IAssetRepository.js';
import { IMediaFileRepository } from './IMediaFileRepository.js';
import { IEventRepository } from './IEventRepository.js';
import { IWorkerExecutionRepository } from './IWorkerExecutionRepository.js';

export interface IUnitOfWork {
  readonly assets: IAssetRepository;
  readonly mediaFiles: IMediaFileRepository;
  readonly events: IEventRepository;
  readonly workerExecutions: IWorkerExecutionRepository;

  /**
   * Ejecuta una serie de operaciones en una transacción atómica de base de datos.
   * Si la operación tiene éxito, hace COMMIT y publica los eventos pendientes de las entidades.
   * Si falla, hace ROLLBACK automáticamente.
   */
  runTransaction<T>(work: (uow: IUnitOfWork) => Promise<T>): Promise<T>;
}
