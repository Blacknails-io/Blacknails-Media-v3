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

import { IAvatarStorageService } from '../../../application/ports/out/IAvatarStorageService.js';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

export class LocalAvatarStorageService implements IAvatarStorageService {
  constructor(private readonly dataDir: string = './data') {}

  async processAndSaveAvatar(tempFilePath: string, userId: string): Promise<string> {
    const userDir = path.resolve(path.join(this.dataDir, 'users', userId));
    
    // Ensure target user directory exists
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const outputPath = path.join(userDir, 'avatar.webp');
    const relativeUrl = `/static/users/${userId}/avatar.webp?t=${Date.now()}`;

    try {
      // Process with ffmpeg: crop to 1:1, scale to 200x200, strip audio, format as webp
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempFilePath)
          .setDuration(5) // Limit max length
          .noAudio()
          .outputOptions([
            '-vf', "crop=w='min(in_w,in_h)':h='min(in_w,in_h)',scale=200:200",
            '-vcodec', 'libwebp',
            '-loop', '0',
            '-an',
            '-vsync', '0'
          ])
          .toFormat('webp')
          .save(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });
    } finally {
      // Always cleanup temporary upload files
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    return relativeUrl;
  }
}
