import { IPeopleUseCase, PersonDTO } from '../ports/in/IPeopleUseCase.js';
import { IFaceRepository } from '../ports/out/IFaceRepository.js';
import { IAssetRepository } from '../ports/out/IAssetRepository.js';
import { GetAssetsUseCase } from './GetAssetsUseCase.js';
import { ThinAssetDto } from '../ports/in/IGetAssetsQuery.js';

export class PeopleUseCase implements IPeopleUseCase {
  constructor(
    private readonly faceRepository: IFaceRepository,
    private readonly assetRepository: IAssetRepository,
    private readonly getAssetsUseCase: GetAssetsUseCase
  ) {}

  public async getPeople(): Promise<PersonDTO[]> {
    const rawPeople = await this.faceRepository.getAllPersonsWithStats();
    return rawPeople.map(p => ({
      id: p.id,
      label: p.label,
      name: p.name,
      faceCount: p.faceCount,
      bbox: p.bbox,
      thumbnailUrl: this.getAssetsUseCase.resolvePathUrl(p.thumbnailUrl)
    }));
  }

  public async renamePerson(personId: string, name: string): Promise<void> {
    const person = await this.faceRepository.getPersonById(personId);
    if (!person) {
      throw new Error(`Person with ID ${personId} not found.`);
    }
    const cleanName = name.trim();
    if (!cleanName) {
      throw new Error('Name cannot be empty.');
    }
    const existingPerson = await this.faceRepository.getPersonByName(cleanName);
    if (existingPerson && existingPerson.id !== personId) {
      await this.faceRepository.mergePersons(personId, existingPerson.id);
    } else {
      await this.faceRepository.updatePersonName(personId, cleanName);
    }
  }

  public async dismissPerson(personId: string): Promise<number> {
    const person = await this.faceRepository.getPersonById(personId);
    if (!person) {
      throw new Error('Person not found.');
    }
    return this.faceRepository.deletePersonAndFaces(personId);
  }

  public async getPersonAssets(personId: string): Promise<ThinAssetDto[]> {
    const assets = await this.assetRepository.getAssetsByPersonId(personId);
    return Promise.all(assets.map(a => this.getAssetsUseCase.mapToThinDto(a)));
  }

  public async deleteOrphanPersons(): Promise<number> {
    return this.faceRepository.deleteOrphanPersons();
  }
}

