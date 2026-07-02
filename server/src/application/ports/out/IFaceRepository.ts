import { Face, Person, FaceBoundingBox } from '../../../domain/entities/Face.js';

export interface FaceEmbeddingRow {
  faceId: string;
  photoId: string;
  embedding: number[];
  assignedName?: string | null;
}

export interface IFaceRepository {
  saveFace(face: Face): Promise<void>;
  getFacesForPhoto(photoId: string): Promise<Face[]>;
  deleteFacesForPhoto(photoId: string): Promise<void>;
  getAllEmbeddings(): Promise<Array<{ faceId: string; embedding: number[] }>>;
  getUnclusteredFacesCount(): Promise<number>;
  savePerson(person: Person): Promise<void>;
  resetClustering(): Promise<void>;
  updatePersonId(faceId: string, personId: string): Promise<void>;
  getAllPersonsWithStats(): Promise<Array<{
    id: string;
    label: string;
    name?: string;
    faceCount: number;
    bbox: FaceBoundingBox;
    thumbnailUrl: string;
  }>>;
  updatePersonName(personId: string, name: string): Promise<void>;
  getPersonById(personId: string): Promise<Person | null>;
  getPersonByName(name: string): Promise<Person | null>;
  mergePersons(sourcePersonId: string, targetPersonId: string): Promise<void>;
  deleteOrphanPersons(): Promise<number>;
}

