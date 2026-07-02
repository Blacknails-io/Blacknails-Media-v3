import assert from 'node:assert/strict';
import test from 'node:test';
import { Photo } from '../../src/domain/entities/Asset.js';
import { DescriptionTaskRunner } from '../../src/application/workers/DescriptionTaskRunner.js';
import { TagsTaskRunner } from '../../src/application/workers/TagsTaskRunner.js';
import { TitleTaskRunner } from '../../src/application/workers/TitleTaskRunner.js';
import { IEventBus } from '../../src/application/ports/out/IEventBus.js';
import { IUnitOfWork } from '../../src/application/ports/out/IUnitOfWork.js';
import { IAssetRepository } from '../../src/application/ports/out/IAssetRepository.js';
import { IMediaFileRepository } from '../../src/application/ports/out/IMediaFileRepository.js';
import { IEventRepository } from '../../src/application/ports/out/IEventRepository.js';
import { IOllamaService } from '../../src/application/ports/out/IOllamaService.js';
import { ISidecarService } from '../../src/application/ports/out/ISidecarService.js';
import { IWorkerExecutionRepository } from '../../src/application/ports/out/IWorkerExecutionRepository.js';

function createEventBusMock(): IEventBus {
  return {
    publish: async () => {},
    subscribe: () => {}
  };
}

function createNoopMediaRepo(): IMediaFileRepository {
  return {
    save: async () => {},
    getById: async () => null,
    getByAssetId: async () => [],
    getOrphans: async () => [],
    getByPath: async () => null,
    getByFileHash: async () => null,
    delete: async () => {},
    detachAllOriginals: async () => 0
  };
}

function createNoopEventRepo(): IEventRepository {
  return {
    save: async () => {},
    getUnpublished: async () => [],
    markAsPublished: async () => {}
  };
}

function createNoopWorkerExecutionRepo(): IWorkerExecutionRepository {
  return {
    save: async () => {},
    getLatestByRunner: async () => undefined
  };
}

function createUnitOfWorkForAssets(assets: Photo[]): IUnitOfWork {
  const repo: IAssetRepository = {
    save: async () => {},
    getById: async () => null,
    getByOriginalFileHash: async () => null,
    getAll: async () => assets,
    delete: async () => {},
    deleteAll: async () => 0
  };

  const uow: IUnitOfWork = {
    assets: repo,
    mediaFiles: createNoopMediaRepo(),
    events: createNoopEventRepo(),
    workerExecutions: createNoopWorkerExecutionRepo(),
    runTransaction: async <T>(work: (u: IUnitOfWork) => Promise<T>): Promise<T> => work(uow)
  };

  return uow;
}

test('description worker uses legacy-rich prompt instructions', async () => {
  const asset = new Photo({});
  asset.thumbnailPath = '/tmp/fake-thumbnail.webp';
  let capturedPrompt = '';

  const ollama: IOllamaService = {
    describeImage: async (_path, prompt) => {
      capturedPrompt = prompt;
      return 'Generated description';
    },
    extractJson: async () => ({}),
    acquireLock: () => true,
    releaseLock: () => {}
  };
  const sidecar: ISidecarService = { write: async () => '/tmp/test.xmp' };

  const worker = new DescriptionTaskRunner(
    createEventBusMock(),
    createUnitOfWorkForAssets([asset]),
    0,
    ollama,
    sidecar
  );
  await worker.trigger();

  assert.match(capturedPrompt, /Analyze this image in extreme detail/i);
  assert.match(capturedPrompt, /NEVER return an empty response/i);
  assert.equal(asset.aiDescription, 'Generated description');
});

test('tags worker accepts legacy concepts schema and canonicalizes tags', async () => {
  const asset = new Photo({});
  asset.aiDescription = 'A young woman is sitting on a black sofa';
  let capturedPrompt = '';

  const ollama: IOllamaService = {
    describeImage: async () => '',
    extractJson: async (_text, prompt) => {
      capturedPrompt = prompt;
      return {
        concepts: [{ tag: 'Young woman' }, { tag: 'young woman' }, 'sit', { tag: ' BLACK sofa ' }]
      };
    },
    acquireLock: () => true,
    releaseLock: () => {}
  };
  const sidecar: ISidecarService = { write: async () => '/tmp/test.xmp' };

  const worker = new TagsTaskRunner(
    createEventBusMock(),
    createUnitOfWorkForAssets([asset]),
    0,
    ollama,
    sidecar
  );
  await worker.trigger();

  assert.match(capturedPrompt, /RULE 1 — NOUNS/i);
  assert.match(capturedPrompt, /Respond ONLY with valid JSON/i);
  assert.deepEqual(asset.tags, ['YOUNG WOMAN', 'SIT', 'BLACK SOFA']);
});

test('title worker uses legacy title prompt and cleans quoted output', async () => {
  const asset = new Photo({});
  asset.aiDescription = 'An urban portrait with rain and neon reflections in the street at night.';
  let capturedPrompt = '';

  const ollama: IOllamaService = {
    describeImage: async () => '',
    extractJson: async (_text, prompt) => {
      capturedPrompt = prompt;
      return {
        title: '"A cinematic portrait of a woman in rain with neon reflections and street lights at midnight scene"'
      };
    },
    acquireLock: () => true,
    releaseLock: () => {}
  };
  const sidecar: ISidecarService = { write: async () => '/tmp/test.xmp' };

  const worker = new TitleTaskRunner(
    createEventBusMock(),
    createUnitOfWorkForAssets([asset]),
    0,
    ollama,
    sidecar
  );
  await worker.trigger();

  assert.match(capturedPrompt, /3 to 6 words long/i);
  assert.match(capturedPrompt, /same language as the description/i);
  assert.ok(asset.title);
  assert.equal(asset.title?.startsWith('"'), false);
  assert.equal(asset.title?.endsWith('"'), false);
  assert.ok((asset.title?.length ?? 0) <= 100);
});
