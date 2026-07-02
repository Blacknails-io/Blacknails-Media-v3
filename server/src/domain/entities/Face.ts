import { randomUUID } from 'crypto';

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Face {
  public readonly id: string;
  public readonly photoId: string;
  public personId?: string;
  public readonly embedding: number[];
  public readonly bbox: FaceBoundingBox;
  public readonly createdAt: string;
  public clusteredAt?: string;

  constructor(props: {
    id?: string;
    photoId: string;
    personId?: string;
    embedding: number[];
    bbox: FaceBoundingBox;
    createdAt?: string;
    clusteredAt?: string;
  }) {
    this.id = props.id || randomUUID();
    this.photoId = props.photoId;
    this.personId = props.personId;
    this.embedding = props.embedding;
    this.bbox = props.bbox;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.clusteredAt = props.clusteredAt;
  }
}

export class Person {
  public readonly id: string;
  public label: string;
  public name?: string;
  public readonly createdAt: string;

  constructor(props: { id?: string; label: string; name?: string; createdAt?: string }) {
    this.id = props.id || randomUUID();
    this.label = props.label;
    this.name = props.name;
    this.createdAt = props.createdAt || new Date().toISOString();
  }
}
