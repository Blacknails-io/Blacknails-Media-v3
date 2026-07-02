import { Resolution } from './ValueObjects.js';

export type MediaRole = 'ORIGINAL' | 'THUMBNAIL' | 'PREVIEW' | 'SIDECAR';

export abstract class MediaFile {
  public readonly id: string;
  public assetId: string | null;
  public currentPath: string;
  public fileSize: number;
  public fileHash: string;
  public extension: string;
  public createdAt: string;

  constructor(props: {
    id?: string;
    assetId: string | null;
    currentPath: string;
    fileSize: number;
    fileHash: string;
    extension: string;
    createdAt?: string;
  }) {
    this.id = props.id || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substring(2));
    this.assetId = props.assetId;
    this.currentPath = props.currentPath;
    this.fileSize = props.fileSize;
    this.fileHash = props.fileHash;
    this.extension = props.extension;
    this.createdAt = props.createdAt || new Date().toISOString();
  }

  public abstract get role(): MediaRole;
}

export class OriginalFile extends MediaFile {
  public sourceDevice: string;
  public importDate: string;

  constructor(props: {
    id?: string;
    assetId: string | null;
    currentPath: string;
    fileSize: number;
    fileHash: string;
    extension: string;
    createdAt?: string;
    sourceDevice?: string;
    importDate?: string;
  }) {
    super(props);
    this.sourceDevice = props.sourceDevice || 'unknown';
    this.importDate = props.importDate || new Date().toISOString();
  }

  public get role(): MediaRole {
    return 'ORIGINAL';
  }
}

export class ThumbnailFile extends MediaFile {
  public resolution?: Resolution;
  public webpQuality: number;

  constructor(props: {
    id?: string;
    assetId: string | null;
    currentPath: string;
    fileSize: number;
    fileHash: string;
    extension: string;
    createdAt?: string;
    resolution?: Resolution;
    webpQuality?: number;
  }) {
    super(props);
    this.resolution = props.resolution;
    this.webpQuality = props.webpQuality || 85;
  }

  public get role(): MediaRole {
    return 'THUMBNAIL';
  }
}

export class PreviewFile extends MediaFile {
  public fps: number;
  public loopDurationMs: number;

  constructor(props: {
    id?: string;
    assetId: string | null;
    currentPath: string;
    fileSize: number;
    fileHash: string;
    extension: string;
    createdAt?: string;
    fps?: number;
    loopDurationMs?: number;
  }) {
    super(props);
    this.fps = props.fps || 30;
    this.loopDurationMs = props.loopDurationMs || 5000;
  }

  public get role(): MediaRole {
    return 'PREVIEW';
  }
}

export class SidecarFile extends MediaFile {
  public schemaVersion: string;
  public xmlNamespace: string;

  constructor(props: {
    id?: string;
    assetId: string | null;
    currentPath: string;
    fileSize: number;
    fileHash: string;
    extension: string;
    createdAt?: string;
    schemaVersion?: string;
    xmlNamespace?: string;
  }) {
    super(props);
    this.schemaVersion = props.schemaVersion || '1.0';
    this.xmlNamespace = props.xmlNamespace || 'xmp';
  }

  public get role(): MediaRole {
    return 'SIDECAR';
  }
}
