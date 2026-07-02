import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { copyFile, mkdir, readFile, stat, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { createPipelineTestEnvironment } from '../helpers/test-environment.js';
import { createImageFixture } from '../helpers/media-fixtures.js';
import { PipelineCoordinatorService } from '../../src/application/services/PipelineCoordinatorService.js';
import { SqliteFaceRepository } from '../../src/adapters/out/database/SqliteFaceRepository.js';
import { DaemonWorker } from '../../src/application/services/DaemonWorker.js';
import { IEventBus } from '../../src/application/ports/out/IEventBus.js';
import { OriginalFile } from '../../src/domain/entities/MediaFile.js';

async function copyIntoImport(source: string, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function seedOriginalMediaFile(env: Awaited<ReturnType<typeof createPipelineTestEnvironment>>, filePath: string): Promise<void> {
  const [content, fileStats] = await Promise.all([readFile(filePath), stat(filePath)]);
  const mediaFile = new OriginalFile({
    assetId: null,
    currentPath: filePath,
    fileSize: fileStats.size,
    fileHash: createHash('sha1').update(content).digest('hex'),
    extension: filePath.slice(filePath.lastIndexOf('.')).toLowerCase(),
    sourceDevice: 'test-seed'
  });
  await env.uow.runTransaction(async (tx) => {
    await tx.mediaFiles.save(mediaFile);
  });
}

class DummyWorker extends DaemonWorker {
  constructor(eventBus: IEventBus, public readonly id: string) {
    super(eventBus);
  }

  public readonly label = 'Dummy Worker';
  public readonly intervalMs = 0;
  protected async catchUp(): Promise<void> {}
  protected subscribeToEvents(): void {}
  protected unsubscribeFromEvents(): void {}
  protected async getPendingItems(): Promise<number> { return 0; }
}

test('core-index reset detaches originals and reindexes immediately', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'reset-index.jpg');
    const importTarget = join(env.importDir, 'reset-index.jpg');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);

    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    assert.equal((await env.assetRepo.getAll()).length, 1);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);

    const coordinator = new PipelineCoordinatorService(
      env.uow,
      new SqliteFaceRepository(env.db),
      env.importDir,
      join(env.storageDir, 'thumbnails'),
      env.originalsDir
    );
    coordinator.register(env.indexWorker);
    await env.indexWorker.start();

    const status = await coordinator.resetWorker('index-worker');
    assert.ok(status);
    assert.equal(status.isRunning, false);

    assert.equal((await env.assetRepo.getAll()).length, 1);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);
  } finally {
    await env.cleanup();
  }
});

test('description reset clears generated descriptions', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'reset-description.jpg');
    const importTarget = join(env.importDir, 'reset-description.jpg');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);

    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    const [asset] = await env.assetRepo.getAll();
    assert.ok(asset);
    asset.aiDescription = 'Descripción temporal';
    asset.describedAt = new Date().toISOString();
    await env.assetRepo.save(asset);

    const coordinator = new PipelineCoordinatorService(
      env.uow,
      new SqliteFaceRepository(env.db),
      env.importDir,
      join(env.storageDir, 'thumbnails'),
      env.originalsDir
    );
    coordinator.register(new DummyWorker(env.eventBus, 'description-worker'));

    const status = await coordinator.resetWorker('description-worker');
    assert.ok(status);

    const [updated] = await env.assetRepo.getAll();
    assert.equal(updated.aiDescription, undefined);
    assert.equal(updated.describedAt, undefined);
  } finally {
    await env.cleanup();
  }
});

test('core-index reset tolerates legacy lowercase media role values', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'reset-index-lowercase-role.jpg');
    const importTarget = join(env.importDir, 'reset-index-lowercase-role.jpg');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);

    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    env.db.prepare("UPDATE media_files SET role = 'original' WHERE role = 'ORIGINAL'").run();

    const coordinator = new PipelineCoordinatorService(
      env.uow,
      new SqliteFaceRepository(env.db),
      env.importDir,
      join(env.storageDir, 'thumbnails'),
      env.originalsDir
    );
    coordinator.register(env.indexWorker);

    const status = await coordinator.resetWorker('index-worker');
    assert.ok(status);
    assert.equal((await env.assetRepo.getAll()).length, 1);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);
  } finally {
    await env.cleanup();
  }
});

test('core-index reset rehydrates originals when media table is empty', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'reset-index-rehydrate.jpg');
    const originalTarget = join(env.originalsDir, '2024', '07', '20240704_123456_REBUILD.jpg');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, originalTarget);

    const coordinator = new PipelineCoordinatorService(
      env.uow,
      new SqliteFaceRepository(env.db),
      env.importDir,
      join(env.storageDir, 'thumbnails'),
      env.originalsDir
    );
    coordinator.register(env.indexWorker);

    const status = await coordinator.resetWorker('index-worker');
    assert.ok(status);
    assert.equal((await env.assetRepo.getAll()).length, 1);

    const media = await env.mediaRepo.getByPath(originalTarget);
    assert.ok(media);
    assert.ok(media.assetId);
  } finally {
    await env.cleanup();
  }
});

test('core-index reset rehydrates missing originals without duplicating existing media rows', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const fixtureA = join(env.rootDir, 'fixtures', 'reset-index-mixed-a.jpg');
    const fixtureB = join(env.rootDir, 'fixtures', 'reset-index-mixed-b.jpg');
    const originalA = join(env.originalsDir, '2024', '07', '20240704_123456_EXISTING.jpg');
    const originalB = join(env.originalsDir, '2024', '07', '20240704_123457_MISSING.jpg');

    await createImageFixture(fixtureA, '2024:07:04 12:34:56');
    await createImageFixture(fixtureB, '2024:07:04 12:34:57');
    await copyIntoImport(fixtureA, originalA);
    await copyIntoImport(fixtureB, originalB);

    await seedOriginalMediaFile(env, originalA);

    const coordinator = new PipelineCoordinatorService(
      env.uow,
      new SqliteFaceRepository(env.db),
      env.importDir,
      join(env.storageDir, 'thumbnails'),
      env.originalsDir
    );
    coordinator.register(env.indexWorker);

    const status = await coordinator.resetWorker('index-worker');
    assert.ok(status);
    assert.equal((await env.assetRepo.getAll()).length, 2);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);

    const mediaRowCount = env.db.prepare("SELECT COUNT(*) as c FROM media_files WHERE UPPER(role) = 'ORIGINAL'").get() as { c: number };
    assert.equal(mediaRowCount.c, 2);
  } finally {
    await env.cleanup();
  }
});

test('core-index reset ignores unsupported files when rebuilding media rows', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const fixture = join(env.rootDir, 'fixtures', 'reset-index-supported.jpg');
    const originalSupported = join(env.originalsDir, '2024', '07', '20240704_130000_SUPPORTED.jpg');
    const originalUnsupported = join(env.originalsDir, '2024', '07', 'notes.txt');

    await createImageFixture(fixture, '2024:07:04 13:00:00');
    await copyIntoImport(fixture, originalSupported);
    await mkdir(dirname(originalUnsupported), { recursive: true });
    await writeFile(originalUnsupported, 'unsupported-file');

    const coordinator = new PipelineCoordinatorService(
      env.uow,
      new SqliteFaceRepository(env.db),
      env.importDir,
      join(env.storageDir, 'thumbnails'),
      env.originalsDir
    );
    coordinator.register(env.indexWorker);

    const status = await coordinator.resetWorker('index-worker');
    assert.ok(status);
    assert.equal((await env.assetRepo.getAll()).length, 1);
    assert.equal(await env.mediaRepo.getByPath(originalUnsupported), null);
  } finally {
    await env.cleanup();
  }
});
