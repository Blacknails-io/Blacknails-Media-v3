# Security & Privacy Guidelines

This skill defines the security checklist and mandatory secure coding rules for developers working on **Blacknails-Media-v3**.

## 1. Path Traversal & File Access Controls

Since the server handles and serves media files directly from local storage, path traversal is a high-risk vector.
- **Rules**:
  - NEVER accept absolute paths directly from client requests. Use relative paths or database IDs (e.g. Asset ID).
  - Resolve paths using Node's `path.resolve()` or `path.normalize()`.
  - ALWAYS check that the target file path resides strictly within the designated directories (`ORIGINALS_DIR`, `IMPORT_DIR`, `ARCHIVE_DIR`, `THUMBNAILS_DIR`, `SIDECARS_DIR`).
  - Implement a helper function like `isPathSafe(targetPath, baseDir)` to verify that `targetPath.startsWith(baseDir)` before reading or writing files.

## 2. SQL Injection Prevention (SQLite)

- **Rules**:
  - Use parameterized queries or bound parameters for ALL database operations (using prepared statements).
  - NEVER concatenate user inputs directly into SQL string queries.
  - If using an ORM or query builder, ensure that sorting fields (`ORDER BY`) or column selections are validated against an allowed whitelist rather than passed directly from user request parameters.

## 3. Safe Command Execution (Command Injection)

When invoking system binaries (e.g. `ffmpeg`, `exiftool`, `ffprobe`):
- Avoid using `child_process.exec(commandString)`.
- Prefer `child_process.execFile` or `child_process.spawn` where arguments are passed as an array of strings. This prevents shell expansion and command injection.
- Sanitize and whitelist all input arguments (like filenames and formats).

## 4. Session & Authentication Security

- Cookie flags: `HttpOnly`, `Secure` (in production), and `SameSite=Lax` or `SameSite=Strict`.
- Avoid storing sensitive data directly in the session object; store only the `userId` and query it from the database.