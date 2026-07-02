import type { IReprocessAssetsUseCase, ReprocessAssetsCommand, ReprocessAssetsResult, AssetReprocessJob } from '../ports/in/IReprocessAssetsUseCase.js';
import type { IAssetRepository } from '../ports/out/IAssetRepository.js';

const VALID_JOBS: ReadonlySet<AssetReprocessJob> = new Set(['description', 'nsfw', 'faces']);
const MAX_ASSET_IDS = 500;

export class ReprocessAssetsUseCase implements IReprocessAssetsUseCase {
  constructor(private readonly assetRepository: IAssetRepository) {}

  async execute(command: ReprocessAssetsCommand): Promise<ReprocessAssetsResult> {
    const assetIds = this.normalizeIds(command.assetIds);
    const jobs = this.normalizeJobs(command.jobs);

    const result = await this.assetRepository.markForReprocessing(assetIds, jobs);
    return {
      requested: assetIds.length,
      accepted: result.accepted.length,
      missing: result.missing,
      jobs
    };
  }

  private normalizeIds(assetIds: unknown): string[] {
    if (!Array.isArray(assetIds)) {
      throw new Error('assetIds debe ser una lista.');
    }

    const normalized = Array.from(new Set(
      assetIds
        .map((value) => typeof value === 'string' ? value.trim() : '')
        .filter((value) => value.length > 0)
    ));

    if (normalized.length === 0) {
      throw new Error('Selecciona al menos un asset.');
    }

    if (normalized.length > MAX_ASSET_IDS) {
      throw new Error(`No se pueden reanalizar más de ${MAX_ASSET_IDS} assets por petición.`);
    }

    return normalized;
  }

  private normalizeJobs(jobs: unknown): AssetReprocessJob[] {
    if (!Array.isArray(jobs)) {
      throw new Error('jobs debe ser una lista.');
    }

    const normalized = Array.from(new Set(
      jobs
        .map((value) => typeof value === 'string' ? value.trim() : '')
        .filter((value): value is AssetReprocessJob => VALID_JOBS.has(value as AssetReprocessJob))
    ));

    if (normalized.length === 0) {
      throw new Error('Selecciona al menos un tipo de reanálisis válido.');
    }

    return normalized;
  }
}
