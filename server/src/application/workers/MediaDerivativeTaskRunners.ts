/*
 * Copyright (c) 2026 MyCompany LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from 'path';
import { promises as fs } from 'fs';
import { Asset } from '../../domain/entities/Asset.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { BaseAssetWorker } from './BaseAssetWorker.js';
import { IMediaProcessingService } from '../ports/out/IMediaProcessingService.js';

abstract class MediaDerivativeTaskRunner extends BaseAssetWorker {
  constructor(
    eventBus: IEventBus,
    uow: IUnitOfWork,
    protected readonly mediaProcessingService: IMediaProcessingService,
    public readonly intervalMs: number,
    protected readonly thumbsDir: string
  ) {
    super(eventBus, uow);
  }

  protected async getOriginal(asset: Asset) {
    const mediaFiles = await this.uow.mediaFiles.getByAssetId(asset.id);
    return mediaFiles.find((media) => media.role === 'ORIGINAL');
  }

  protected async getOutputDir(fileHash: string): Promise<string> {
    const shard = fileHash.slice(0, 2);
    const outputDir = path.join(this.thumbsDir, shard);
    await fs.mkdir(outputDir, { recursive: true });
    return outputDir;
  }
}

export class ImagePreviewTaskRunner extends MediaDerivativeTaskRunner {
  public readonly id = 'image-preview-worker';
  public readonly label = 'Image Preview';
  public readonly provides = ['image_previews'];
  public readonly requires = ['assets'];

  protected isPending(asset: Asset): boolean {
    return asset.assetType === 'PHOTO' && !asset.thumbnailPath;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const original = await this.getOriginal(asset);
    if (!original) return;

    const outputDir = await this.getOutputDir(original.fileHash);
    const thumbPath = path.join(outputDir, `${asset.id}.webp`);

    await this.mediaProcessingService.generateImagePreview(original.currentPath, thumbPath);

    asset.thumbnailPath = thumbPath;
    await this.uow.assets.save(asset);
  }
}

export class ImageTranscodeTaskRunner extends MediaDerivativeTaskRunner {
  public readonly id = 'image-transcode-worker';
  public readonly label = 'Image Transcode';
  public readonly provides = ['image_transcodes'];
  public readonly requires = ['image_previews'];

  protected isPending(asset: Asset): boolean {
    return asset.assetType === 'PHOTO' && Boolean(asset.thumbnailPath) && !asset.aiThumbnailPath;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    if (!asset.thumbnailPath) return;

    const original = await this.getOriginal(asset);
    if (!original) return;

    const outputDir = await this.getOutputDir(original.fileHash);
    const aiThumbPath = path.join(outputDir, `${asset.id}.ai.webp`);

    await fs.copyFile(asset.thumbnailPath, aiThumbPath);

    asset.aiThumbnailPath = aiThumbPath;
    await this.uow.assets.save(asset);
  }
}

export class VideoPreviewTaskRunner extends MediaDerivativeTaskRunner {
  public readonly id = 'video-preview-worker';
  public readonly label = 'Video Preview';
  public readonly provides = ['video_previews'];
  public readonly requires = ['assets'];

  protected isPending(asset: Asset): boolean {
    return asset.assetType === 'VIDEO' && !asset.thumbnailPath;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const original = await this.getOriginal(asset);
    if (!original) return;

    const outputDir = await this.getOutputDir(original.fileHash);
    const thumbPath = path.join(outputDir, `${asset.id}.webp`);
    const aiThumbPath = path.join(outputDir, `${asset.id}.ai.webp`);

    await this.mediaProcessingService.generateVideoPreview(original.currentPath, thumbPath);
    await fs.copyFile(thumbPath, aiThumbPath);

    asset.thumbnailPath = thumbPath;
    asset.aiThumbnailPath = aiThumbPath;
    await this.uow.assets.save(asset);
  }
}

export class VideoTranscodeTaskRunner extends MediaDerivativeTaskRunner {
  public readonly id = 'video-transcode-worker';
  public readonly label = 'Video Transcode';
  public readonly provides = ['video_transcodes'];
  public readonly requires = ['video_previews'];

  protected isPending(asset: Asset): boolean {
    return asset.assetType === 'VIDEO' && Boolean(asset.thumbnailPath) && !asset.videoPreviewPath;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const original = await this.getOriginal(asset);
    if (!original) return;

    const outputDir = await this.getOutputDir(original.fileHash);
    const previewPath = path.join(outputDir, `${asset.id}.preview.mp4`);

    try {
      await this.mediaProcessingService.generateVideoClipsPreview(original.currentPath, previewPath);
      asset.videoPreviewPath = previewPath;
      await this.uow.assets.save(asset);
    } catch (err) {
      console.error(`[VideoTranscodeTaskRunner] Error generating video preview for ${asset.id}:`, err);
    }
  }
}
