import { IAssetRepository } from '../ports/out/IAssetRepository.js';
import { IGetAssetDetailsQuery, AssetDto } from '../ports/in/IGetAssetsQuery.js';
import { GetAssetsUseCase } from './GetAssetsUseCase.js';

export class GetAssetDetailsUseCase implements IGetAssetDetailsQuery {
  constructor(
    private assetRepository: IAssetRepository,
    private getAssetsUseCase: GetAssetsUseCase
  ) {}

  public async execute(id: string): Promise<AssetDto> {
    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new Error(`Asset with ID ${id} not found`);
    }
    return this.getAssetsUseCase.mapToDto(asset);
  }
}
