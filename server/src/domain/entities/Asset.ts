import { randomUUID } from 'crypto';
import { AggregateRoot } from './AggregateRoot.js';
import { Location, ExifData, Resolution } from './ValueObjects.js';

export type AssetType = 'PHOTO' | 'VIDEO';

export abstract class Asset extends AggregateRoot {
  public readonly id: string;
  public dateTaken: string; // ISO string UTC
  public timezoneOffset: string; // Ej: "+02:00" o "Z"
  public location?: Location;
  public thumbnailPath?: string;
  public aiThumbnailPath?: string;
  public videoPreviewPath?: string;
  public aiDescription?: string;
  public tags: string[];
  public title?: string;
  public sidecarPath?: string;
  public isNsfw?: boolean | null;
  public nsfwReason?: string;
  public tagNsfwScores?: Record<string, unknown> | null;
  
  // Procesamiento del pipeline (Hito 2: timestamps directos)
  public indexedAt?: string;
  public aiProcessedAt?: string;
  public describedAt?: string;
  public taggedAt?: string;
  public titledAt?: string;
  public facesProcessedAt?: string;
  public nsfwProcessedAt?: string;

  constructor(props: {
    id?: string;
    dateTaken?: string;
    timezoneOffset?: string;
    location?: Location;
    thumbnailPath?: string;
    aiThumbnailPath?: string;
    videoPreviewPath?: string;
    aiDescription?: string;
    tags?: string[];
    title?: string;
    sidecarPath?: string;
    isNsfw?: boolean | null;
    nsfwReason?: string;
    tagNsfwScores?: Record<string, unknown> | null;
    indexedAt?: string;
    aiProcessedAt?: string;
    describedAt?: string;
    taggedAt?: string;
    titledAt?: string;
    facesProcessedAt?: string;
    nsfwProcessedAt?: string;
  }) {
    super();
    this.id = props.id || randomUUID();
    this.dateTaken = props.dateTaken || new Date().toISOString();
    this.timezoneOffset = props.timezoneOffset || 'Z';
    this.location = props.location;
    this.thumbnailPath = props.thumbnailPath;
    this.aiThumbnailPath = props.aiThumbnailPath;
    this.videoPreviewPath = props.videoPreviewPath;
    this.aiDescription = props.aiDescription;
    this.tags = props.tags || [];
    this.title = props.title;
    this.sidecarPath = props.sidecarPath;
    this.isNsfw = props.isNsfw;
    this.nsfwReason = props.nsfwReason;
    this.tagNsfwScores = props.tagNsfwScores;
    this.indexedAt = props.indexedAt;
    this.aiProcessedAt = props.aiProcessedAt;
    this.describedAt = props.describedAt;
    this.taggedAt = props.taggedAt;
    this.titledAt = props.titledAt;
    this.facesProcessedAt = props.facesProcessedAt;
    this.nsfwProcessedAt = props.nsfwProcessedAt;
  }

  public abstract get assetType(): AssetType;
}

export class Photo extends Asset {
  public resolution?: Resolution;
  public exif?: ExifData;

  constructor(props: ConstructorParameters<typeof Asset>[0] & {
    resolution?: Resolution;
    exif?: ExifData;
  }) {
    super(props);
    this.resolution = props.resolution;
    this.exif = props.exif;
  }

  public get assetType(): AssetType {
    return 'PHOTO';
  }
}

export class Video extends Asset {
  public resolution?: Resolution;
  public durationSeconds: number;
  public framerate: number;
  public videoCodec?: string;
  public audioCodec?: string;

  constructor(props: ConstructorParameters<typeof Asset>[0] & {
    resolution?: Resolution;
    durationSeconds?: number;
    framerate?: number;
    videoCodec?: string;
    audioCodec?: string;
  }) {
    super(props);
    this.resolution = props.resolution;
    this.durationSeconds = props.durationSeconds || 0;
    this.framerate = props.framerate || 0;
    this.videoCodec = props.videoCodec;
    this.audioCodec = props.audioCodec;
  }

  public get assetType(): AssetType {
    return 'VIDEO';
  }
}
