# Safe Command Execution Example

This example demonstrates how to invoke system binaries (like ffmpeg, ffprobe, or exiftool) safely inside Node.js, preventing **Command Injection** vulnerabilities.

---

## ❌ Vulnerable Execution Pattern
Avoid using `child_process.exec(commandString)`.

```typescript
// ❌ VULNERABLE: Direct concatenation spawns a subshell
import { exec } from 'child_process';
exec(`ffmpeg -i "${userInputFilename}" output.mp4`);
// If userInputFilename = 'img.jpg"; rm -rf /; "', the shell executes the injection!
```

---

##  Secure Execution Pattern
Always use `child_process.execFile` or `child_process.spawn` where input parameters are passed strictly as separate elements in an argument string array. This prevents shell expansion and command injection.

### Standard Command (Using `execFile`)

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function extractVideoDuration(videoPath: string): Promise<number> {
  const args = [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    videoPath // Passed as a literal argument, no shell parsing occurs
  ];

  try {
    const { stdout } = await execFileAsync('ffprobe', args);
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : duration;
  } catch (error: any) {
    console.error(`[FFprobe] Failed to extract duration: ${error.message}`);
    throw new Error('Could not process video file metadata.');
  }
}
```

### Heavy Outputs / Streams (Using `spawn`)

```typescript
import { spawn } from 'child_process';

export function generateThumbnailStream(imagePath: string) {
  const args = [
    '-y',
    '-i', imagePath,
    '-vf', 'scale=300:-1',
    '-f', 'image2',
    '-vcodec', 'mjpeg',
    '-' // Output is redirected to stdout stream rather than storing in memory
  ];

  // Spawn does not invoke an intermediate shell (/bin/sh)
  const ffmpegProcess = spawn('ffmpeg', args);

  ffmpegProcess.stderr.on('data', (data) => {
    console.warn(`[FFmpeg Log]: ${data.toString()}`);
  });

  return ffmpegProcess.stdout;
}
```
