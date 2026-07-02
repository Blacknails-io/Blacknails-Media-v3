import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ReprocessAssetsUseCase } from '../../src/application/use_cases/ReprocessAssetsUseCase.js';
import type { IAssetRepository } from '../../src/application/ports/out/IAssetRepository.js';
import type { AssetReprocessJob } from '../../src/application/ports/in/IReprocessAssetsUseCase.js';

function createRepository(existingIds: string[]) {
  const calls: Array<{ assetIds: string[]; jobs: AssetReprocessJob[] }> = [];
  const repo = {
    calls,
    async markForReprocessing(assetIds: string[], jobs: AssetReprocessJob[]) {
      calls.push({ assetIds, jobs });
      const existing = new Set(existingIds);
      return {
        accepted: assetIds.filter((id) => existing.has(id)),
        missing: assetIds.filter((id) => !existing.has(id))
      };
    }
  } as unknown as IAssetRepository & { calls: Array<{ assetIds: string[]; jobs: AssetReprocessJob[] }> };
  return repo;
}

describe('ReprocessAssetsUseCase', () => {
  it('validates, deduplicates and returns accepted and missing assets', async () => {
    const repository = createRepository(['asset-1', 'asset-2']);
    const useCase = new ReprocessAssetsUseCase(repository);

    const result = await useCase.execute({
      assetIds: ['asset-1', 'asset-1', 'asset-404', 'asset-2'],
      jobs: ['description', 'nsfw', 'description']
    });

    assert.deepEqual(repository.calls, [{
      assetIds: ['asset-1', 'asset-404', 'asset-2'],
      jobs: ['description', 'nsfw']
    }]);
    assert.deepEqual(result, {
      requested: 3,
      accepted: 2,
      missing: ['asset-404'],
      jobs: ['description', 'nsfw']
    });
  });

  it('rejects empty asset selections', async () => {
    const useCase = new ReprocessAssetsUseCase(createRepository([]));

    await assert.rejects(
      () => useCase.execute({ assetIds: [], jobs: ['faces'] }),
      /Selecciona al menos un asset/
    );
  });

  it('rejects unsupported jobs', async () => {
    const useCase = new ReprocessAssetsUseCase(createRepository(['asset-1']));

    await assert.rejects(
      () => useCase.execute({ assetIds: ['asset-1'], jobs: ['metadata' as AssetReprocessJob] }),
      /reanálisis válido/
    );
  });
});
