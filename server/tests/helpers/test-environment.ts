import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { initializeDatabase } from '../../src/adapters/out/database/SqliteDatabase.js';
import { SqliteUnitOfWork } from '../../src/adapters/out/database/SqliteUnitOfWork.js';
import { SqliteAssetRepository } from '../../src/adapters/out/database/SqliteAssetRepository.js';
import { SqliteMediaFileRepository } from '../../src/adapters/out/database/SqliteMediaFileRepository.js';
import { ImportMediaUseCase } from '../../src/application/use_cases/ImportMediaUseCase.js';
import { IndexMediaUseCase } from '../../src/application/use_cases/IndexMediaUseCase.js';
import { ImportTaskRunner } from '../../src/application/workers/ImportTaskRunner.js';
import { IndexTaskRunner } from '../../src/application/workers/IndexTaskRunner.js';
import { CommandLineMediaProcessingService } from '../../src/adapters/out/services/CommandLineMediaProcessingService.js';
import { IEventBus } from '../../src/application/ports/out/IEventBus.js';
import { AppEvent } from '@blacknails/shared';
import { SqliteFaceRepository } from '../../src/adapters/out/database/SqliteFaceRepository.js';
import { PurgeMediaUseCase } from '../../src/application/use_cases/PurgeMediaUseCase.js';


class RecordingEventBus implements IEventBus {
  public readonly events: AppEvent[] = [];

  async publish(event: AppEvent): Promise<void> {
    this.events.push(event);
  }

  subscribe(_action: string, _handler: (event: AppEvent) => void): void {}
}

export interface PipelineTestEnvironment {
  rootDir: string;
  dbPath: string;
  importDir: string;
  originalsDir: string;
  archiveDir: string;
  storageDir: string;
  db: ReturnType<typeof initializeDatabase>;
  uow: SqliteUnitOfWork;
  assetRepo: SqliteAssetRepository;
  mediaRepo: SqliteMediaFileRepository;
  faceRepo: SqliteFaceRepository;
  eventBus: RecordingEventBus;
  processingService: CommandLineMediaProcessingService;
  importUseCase: ImportMediaUseCase;
  indexUseCase: IndexMediaUseCase;
  importWorker: ImportTaskRunner;
  indexWorker: IndexTaskRunner;
  cleanup(): Promise<void>;
}

export async function createPipelineTestEnvironment(options: { action?: 'move' | 'copy' } = {}): Promise<PipelineTestEnvironment> {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'bn-v3-pipeline-'));
  const dbPath = path.join(rootDir, 'db', 'blacknails.db');
  const importDir = path.join(rootDir, 'import');
  const originalsDir = path.join(rootDir, 'originals');
  const archiveDir = path.join(rootDir, 'archive');
  const storageDir = path.join(rootDir, 'storage');

  const db = initializeDatabase(dbPath);
  const uow = new SqliteUnitOfWork(db);
  const assetRepo = new SqliteAssetRepository(db);
  const mediaRepo = new SqliteMediaFileRepository(db);
  const eventBus = new RecordingEventBus();
  const processingService = new CommandLineMediaProcessingService();
  const importUseCase = new ImportMediaUseCase(uow, eventBus, processingService, originalsDir, options.action || 'move');
  const indexUseCase = new IndexMediaUseCase(uow, processingService, eventBus, path.join(storageDir, 'sidecars'));
  const faceRepo = new SqliteFaceRepository(db);
  const purgeUseCase = new PurgeMediaUseCase(uow, faceRepo, eventBus);
  const importWorker = new ImportTaskRunner(eventBus, importUseCase, importDir, 0);
  const indexWorker = new IndexTaskRunner(eventBus, uow, indexUseCase, purgeUseCase, 0);



  return {
    rootDir,
    dbPath,
    importDir,
    originalsDir,
    archiveDir,
    storageDir,
    db,
    uow,
    assetRepo,
    mediaRepo,
    faceRepo,
    eventBus,
    processingService,
    importUseCase,
    indexUseCase,
    importWorker,
    indexWorker,
    cleanup: async () => {
      db.close();
      await rm(rootDir, { recursive: true, force: true });
    }
  };
}
