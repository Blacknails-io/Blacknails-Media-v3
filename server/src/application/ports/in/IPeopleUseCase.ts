import { AssetDto } from './IGetAssetsQuery.js';

export interface PersonDTO {
  id: string;
  label: string;
  name?: string;
  faceCount: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  thumbnailUrl: string;
}

export interface IPeopleUseCase {
  getPeople(): Promise<PersonDTO[]>;
  renamePerson(personId: string, name: string): Promise<void>;
  dismissPerson(personId: string): Promise<number>;
  getPersonAssets(personId: string): Promise<AssetDto[]>;
  deleteOrphanPersons(): Promise<number>;
}

