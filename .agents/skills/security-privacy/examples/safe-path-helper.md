# Safe Path Helper Example

This example demonstrates how to validate that a client-requested filepath resides strictly inside a permitted base directory, protecting the Node.js backend from **Path Traversal** attacks.

---

## Safe Path Helper Function

```typescript
import * as path from 'path';

/**
 * Checks if targetPath is physically inside baseDir.
 * Prevents Path Traversal (e.g., using '../../etc/passwd').
 * 
 * @param targetPath Requested file path (relative or absolute)
 * @param baseDir Permitted root directory (absolute)
 * @returns true if the path is secure, false otherwise
 */
export function isPathSafe(targetPath: string, baseDir: string): boolean {
  // 1. Resolve and normalize absolute paths (resolves '.' and '..')
  const absoluteBaseDir = path.resolve(baseDir);
  const absoluteTargetPath = path.resolve(targetPath);

  // 2. Prevent boundary mismatch by enforcing trailing separator checks
  const baseDirWithSeparator = absoluteBaseDir.endsWith(path.sep)
    ? absoluteBaseDir
    : absoluteBaseDir + path.sep;

  return absoluteTargetPath.startsWith(baseDirWithSeparator) || absoluteTargetPath === absoluteBaseDir;
}
```

---

## Express Controller Usage Example

```typescript
// server/src/adapters/in/http/ServeThumbnailController.ts
import { Request, Response } from 'express';
import * as path from 'path';
import { isPathSafe } from './isPathSafe.js';

export async function serveThumbnailController(req: Request, res: Response) {
  const filename = req.query.file; // e.g. "subdir/image.webp" or "../../etc/passwd"
  const THUMBNAILS_DIR = path.resolve('./library/storage/thumbnails');

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Missing required query parameter: file.' });
  }

  // Combine safely
  const targetFilePath = path.join(THUMBNAILS_DIR, filename);

  // CRITICAL SECURITY VALIDATION:
  if (!isPathSafe(targetFilePath, THUMBNAILS_DIR)) {
    console.warn(`[Security Alert] Path traversal attempt blocked: "${filename}"`);
    return res.status(403).json({ error: 'Access Denied: Unauthorized path.' });
  }

  // Safely stream file
  res.sendFile(targetFilePath);
}
```
