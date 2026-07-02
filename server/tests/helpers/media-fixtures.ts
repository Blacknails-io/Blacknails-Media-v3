import { mkdir, utimes, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function ensureParent(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function createImageFixture(filePath: string, exifDate?: string): Promise<void> {
  await ensureParent(filePath);
  await execFileAsync('ffmpeg', [
    '-v', 'error',
    '-y',
    '-f', 'lavfi',
    '-i', 'color=c=red:s=16x16:d=1',
    '-frames:v', '1',
    filePath
  ]);

  if (exifDate) {
    await execFileAsync('exiftool', [
      '-overwrite_original',
      `-DateTimeOriginal=${exifDate}`,
      filePath
    ]);
  }
}

export async function createVideoFixture(filePath: string, mtime?: Date): Promise<void> {
  await ensureParent(filePath);
  await execFileAsync('ffmpeg', [
    '-v', 'error',
    '-y',
    '-f', 'lavfi',
    '-i', 'color=c=blue:s=16x16:d=1',
    '-pix_fmt', 'yuv420p',
    '-t', '1',
    filePath
  ]);

  if (mtime) {
    await utimes(filePath, mtime, mtime);
  }
}

export async function createTextFixture(filePath: string, content = 'not media'): Promise<void> {
  await ensureParent(filePath);
  await writeFile(filePath, content, 'utf8');
}
