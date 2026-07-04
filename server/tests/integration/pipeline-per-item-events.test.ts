import assert from 'node:assert/strict';
import test from 'node:test';
import { Photo, Video, Asset } from '../../src/domain/entities/Asset.js';
import { BaseAssetWorker } from '../../src/application/workers/BaseAssetWorker.js';
import { IEventBus } from '../../src/application/ports/out/IEventBus.js';
import { IUnitOfWork } from '../../src/application/ports/out/IUnitOfWork.js';
import { IAssetRepository } from '../../src/application/ports/out/IAssetRepository.js';
import { IMediaFileRepository } from '../../src/application/ports/out/IMediaFileRepository.js';
import { IEventRepository } from '../../src/application/ports/out/IEventRepository.js';
import { IWorkerExecutionRepository } from '../../src/application/ports/out/IWorkerExecutionRepository.js';
import type { AppEvent } from '@blacknails/shared';

class TestAssetWorker extends BaseAssetWorker {
  public readonly id = 'test-worker';
  public readonly label = 'Test Worker';
  public readonly intervalMs = 0;
  public readonly processedAssetIds: string[] = [];
  public readonly observedAssetTypes: Array<'PHOTO' | 'VIDEO' | undefined> = [];

  protected isPending(asset: Asset): boolean {
    return !this.processedAssetIds.includes(asset.id);
  }

  protected async processAsset(asset: Asset): Promise<void> {
    this.observedAssetTypes.push((await this.describe()).currentAssetType);
    this.processedAssetIds.push(asset.id);
  }
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

function createUnitOfWorkForAssets(assets: Asset[]): IUnitOfWork {
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

test('asset workers process one pending asset per trigger', async () => {
  const assets = [new Photo({}), new Photo({})];
  const published: AppEvent[] = [];
  const eventBus: IEventBus = {
    publish: async (event) => {
      published.push(event);
    },
    subscribe: () => {}
  };

  const worker = new TestAssetWorker(eventBus, createUnitOfWorkForAssets(assets));

  await worker.trigger();
  assert.deepEqual(worker.processedAssetIds, [assets[0].id]);

  let perAssetMessages = published
    .filter((event) => event.subsystem === 'AI' && event.source === 'test-worker')
    .map((event) => event.message)
    .filter((message) => /Processed item \d+\/\d+ \(.+\)/.test(message));

  assert.equal(perAssetMessages.length, 1);
  assert.ok(perAssetMessages[0].includes(assets[0].id));

  await worker.trigger();
  assert.deepEqual(worker.processedAssetIds, [assets[0].id, assets[1].id]);

  perAssetMessages = published
    .filter((event) => event.subsystem === 'AI' && event.source === 'test-worker')
    .map((event) => event.message)
    .filter((message) => /Processed item \d+\/\d+ \(.+\)/.test(message));

  assert.equal(perAssetMessages.length, 2);
  assert.ok(perAssetMessages[1].includes(assets[1].id));
});

test('asset workers expose the current media type while processing', async () => {
  const assets: Asset[] = [new Photo({}), new Video({})];
  const eventBus: IEventBus = {
    publish: async () => {},
    subscribe: () => {}
  };

  const worker = new TestAssetWorker(eventBus, createUnitOfWorkForAssets(assets));

  await worker.trigger();
  assert.deepEqual(worker.observedAssetTypes, ['PHOTO']);
  assert.equal((await worker.describe()).currentAssetType, undefined);

  await worker.trigger();
  assert.deepEqual(worker.observedAssetTypes, ['PHOTO', 'VIDEO']);
  assert.equal((await worker.describe()).currentAssetType, undefined);
});
