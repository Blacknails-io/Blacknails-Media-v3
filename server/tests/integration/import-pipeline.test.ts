import assert from 'node:assert/strict';
import { copyFile, mkdir, readdir, access, writeFile } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { join, dirname } from 'path';
import test from 'node:test';
import { createPipelineTestEnvironment } from '../helpers/test-environment.js';
import { createImageFixture, createTextFixture, createVideoFixture } from '../helpers/media-fixtures.js';
import { PipelineCoordinatorService } from '../../src/application/services/PipelineCoordinatorService.js';

async function copyIntoImport(source: string, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function listFilesRecursive(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

test('imports a photo, archives the original and leaves it as orphan until indexer runs', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'photo-source.jpg');
    const importTarget = join(env.importDir, 'nested', 'photo-source.jpg');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);
    await createTextFixture(join(env.importDir, '.hidden', 'ignored.txt'));

    await env.importWorker.trigger();

    const assetsBeforeIndex = await env.assetRepo.getAll();
    assert.equal(assetsBeforeIndex.length, 0);
    assert.equal((await env.mediaRepo.getOrphans()).length, 1);

    const importedFiles = await listFilesRecursive(env.originalsDir);
    assert.equal(importedFiles.filter((file) => file.endsWith('.webp')).length, 1);
    assert.equal(importedFiles.some((file) => file.endsWith('.jpg')), false);

    const archiveFiles = await listFilesRecursive(env.archiveDir);
    assert.equal(archiveFiles.filter((file) => file.endsWith('.jpg')).length, 1);

    assert.equal(await exists(join(env.importDir, '.hidden', 'ignored.txt')), true);
    await env.indexWorker.trigger();

    const assets = await env.assetRepo.getAll();
    assert.equal(assets.length, 1);
    assert.equal(assets[0].assetType, 'PHOTO');
    const photo = assets[0] as any;
    assert.ok(photo.resolution?.width);
    assert.ok(photo.resolution?.height);
    assert.ok(photo.indexedAt);

    const linkedMediaFiles = await env.mediaRepo.getByAssetId(assets[0].id);
    assert.equal(linkedMediaFiles.length, 1);
    assert.equal(linkedMediaFiles[0].assetId, assets[0].id);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);
  } finally {
    await env.cleanup();
  }
});

test('reports import and index pending items with current worker ids', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const coordinator = new PipelineCoordinatorService(
      env.uow,
      env.faceRepo,
      env.importDir,
      join(env.storageDir, 'thumbnails'),
      env.originalsDir,
      env.eventBus
    );
    coordinator.register(env.importWorker);
    coordinator.register(env.indexWorker);

    const sourceFixture = join(env.rootDir, 'fixtures', 'pending-source.jpg');
    const importTarget = join(env.importDir, 'pending-source.jpg');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);

    const importStatus = await coordinator.describeWorker('import-worker');
    assert.equal(importStatus?.pendingItems, 1);

    await env.importWorker.trigger();

    const indexStatus = await coordinator.describeWorker('index-worker');
    assert.equal(indexStatus?.pendingItems, 1);
  } finally {
    await env.cleanup();
  }
});

test('imports a video with mtime fallback and leaves it as orphan until indexer runs', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'video-source.mov');
    const importTarget = join(env.importDir, 'video-source.mov');
    const fallbackDate = new Date('2023-07-04T10:20:30.000Z');

    await createVideoFixture(sourceFixture, fallbackDate);
    await copyIntoImport(sourceFixture, importTarget);

    await env.importWorker.trigger();

    assert.equal((await env.assetRepo.getAll()).length, 0);
    assert.equal((await env.mediaRepo.getOrphans()).length, 1);

    const importedFiles = await listFilesRecursive(env.originalsDir);
    assert.equal(importedFiles.filter((file) => file.endsWith('.mp4')).length, 1);

    const archiveFiles = await listFilesRecursive(env.archiveDir);
    assert.equal(archiveFiles.filter((file) => file.endsWith('.mov')).length, 1);

    await env.indexWorker.trigger();

    const assets = await env.assetRepo.getAll();
    assert.equal(assets.length, 1);
    assert.equal(assets[0].assetType, 'VIDEO');
    assert.ok(assets[0].indexedAt);
    assert.ok((assets[0] as any).durationSeconds >= 1);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);
  } finally {
    await env.cleanup();
  }
});

test('rejects unsupported files and records a pipeline event', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'unsupported.txt');
    const importTarget = join(env.importDir, 'unsupported.txt');

    await createTextFixture(sourceFixture, 'plain text');
    await copyIntoImport(sourceFixture, importTarget);

    await env.importWorker.trigger();

    assert.equal((await env.assetRepo.getAll()).length, 0);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);
    assert.ok(env.eventBus.events.some((event) => event.action === 'REJECTED'));
  } finally {
    await env.cleanup();
  }
});

test('detects duplicate source files and stacks them with a stable hash', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'duplicate.jpg');
    const importTarget = join(env.importDir, 'duplicate.jpg');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);
    await env.importWorker.trigger();

    await copyIntoImport(sourceFixture, importTarget);
    await env.importWorker.trigger();

    const mediaFiles = await env.mediaRepo.getOrphans();
    assert.equal(mediaFiles.length, 2);
    assert.equal(new Set(mediaFiles.map((file) => file.fileHash)).size, 1);
    assert.ok(env.eventBus.events.some((event) => event.action === 'DUPLICATED'));
  } finally {
    await env.cleanup();
  }
});

test('supports copy mode for the import step', async () => {
  const env = await createPipelineTestEnvironment({ action: 'copy' });
  try {
    const sourceFixtureJpg = join(env.rootDir, 'fixtures', 'copy-mode-source.jpg');
    const sourceFixture = join(env.rootDir, 'fixtures', 'copy-mode.webp');

    await createImageFixture(sourceFixtureJpg, '2024:07:04 12:34:56');
    await copyFile(sourceFixtureJpg, sourceFixture);
    const result = await env.importUseCase.execute(sourceFixture);

    assert.equal(result.imported, true);
    assert.equal(await exists(sourceFixture), true);
    assert.equal((await env.mediaRepo.getOrphans()).length, 1);
  } finally {
    await env.cleanup();
  }
});

test('cleans optimized artifacts when archive step fails', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'archive-failure-source.jpg');
    const importTarget = join(env.importDir, 'archive-failure-source.jpg');
    const leakedOptimized = join(env.importDir, 'archive-failure-source.webp');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);
    await writeFile(env.archiveDir, 'not-a-directory', 'utf8');

    const result = await env.importUseCase.execute(importTarget);

    assert.equal(result.imported, false);
    assert.equal(result.skippedReason, 'processing-error');
    assert.equal(await exists(importTarget), true);
    assert.equal(await exists(leakedOptimized), false);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);
  } finally {
    await env.cleanup();
  }
});

test('import worker emits per-item PIPELINE events', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'per-item-import.jpg');
    const importTarget = join(env.importDir, 'per-item-import.jpg');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);

    await env.importWorker.trigger();

    const perItemEvents = env.eventBus.events.filter(
      (event) =>
        event.subsystem === 'IMPORT' &&
        event.source === 'import-worker' &&
        event.message.includes('Processed item')
    );

    assert.ok(perItemEvents.length >= 1);
    assert.ok(perItemEvents.some((event) => (event as any).workerName === 'import-worker'));
    assert.ok(perItemEvents.some((event) => (event as any).status === 'PROCESSED'));
  } finally {
    await env.cleanup();
  }
});

test('index worker emits per-item PIPELINE events', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFixture = join(env.rootDir, 'fixtures', 'per-item-index.jpg');
    const importTarget = join(env.importDir, 'per-item-index.jpg');

    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);
    await env.importWorker.trigger();

    const orphans = await env.mediaRepo.getOrphans();
    assert.ok(orphans.length > 0);

    await env.indexWorker.trigger();

    const perItemEvents = env.eventBus.events.filter(
      (event) =>
        event.subsystem === 'INDEX' &&
        event.source === 'index-worker' &&
        event.message.includes('elemento') &&
        event.message.includes('procesado')
    );

    assert.ok(perItemEvents.length >= 1);
    assert.ok(perItemEvents.some((event) => (event as any).workerName === 'index-worker'));
    assert.ok(perItemEvents.some((event) => (event as any).status === 'PROCESSED'));
  } finally {
    await env.cleanup();
  }
});
