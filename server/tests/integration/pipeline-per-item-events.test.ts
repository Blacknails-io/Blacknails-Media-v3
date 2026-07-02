import assert from 'node:assert/strict';
import test from 'node:test';
import { Photo, Asset } from '../../src/domain/entities/Asset.js';
import { BaseAssetWorker } from '../../src/application/workers/BaseAssetWorker.js';
import { IEventBus } from '../../src/application/ports/out/IEventBus.js';
import { IUnitOfWork } from '../../src/application/ports/out/IUnitOfWork.js';
import { IAssetRepository } from '../../src/application/ports/out/IAssetRepository.js';
import { IMediaFileRepository } from '../../src/application/ports/out/IMediaFileRepository.js';
import { IEventRepository } from '../../src/application/ports/out/IEventRepository.js';
import type { AppEvent } from '@blacknails/shared';

class TestAssetWorker extends BaseAssetWorker {
  public readonly id = 'test-worker';
  public readonly label = 'Test Worker';
  public readonly intervalMs = 0;

  protected isPending(_asset: Asset): boolean {
    return true;
  }

  protected async processAsset(_asset: Asset): Promise<void> {}
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
    runTransaction: async <T>(work: (u: IUnitOfWork) => Promise<T>): Promise<T> => work(uow)
  };

  return uow;
}

test('emits one PIPELINE event per processed asset', async () => {
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

  const perAssetMessages = published
    .filter((event) => event.subsystem === 'AI' && event.source === 'test-worker')
    .map((event) => event.message)
    .filter((message) => /Processed item \d+\/\d+ \(.+\)/.test(message));

  assert.equal(perAssetMessages.length, 2);
  assert.ok(perAssetMessages.some((message) => message.includes(assets[0].id)));
  assert.ok(perAssetMessages.some((message) => message.includes(assets[1].id)));
});
