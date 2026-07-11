# Risks And Unknowns

## Risks

- risk/high: A mobile upload endpoint would handle large private photos/videos and must validate auth, file type, size, path traversal, partial upload cleanup, and duplicate behavior.
- risk/high: Writing directly into `IMPORT_DIR` before the upload is complete could let `import-worker` process partial files. A staging directory plus atomic rename is safer.
- risk/medium: iOS background uploads require stable HTTPS endpoints and resumable/error-tolerant client behavior; the backend currently has no resumable upload contract.
- risk/medium: `ImportMediaUseCase` currently records all imports as `sourceDevice: 'import-folder'`, so device attribution would require a small model/use-case change or a separate metadata sidecar.
- risk/medium: The current worktree has many user changes and deleted client files; avoid broad edits without inspecting the new frontend shape.

## Unknowns

- unknown/high: Should iPhone sync be ADMIN-only, available to STANDARD users, or available to VIEWER users?
- unknown/high: Should uploaded iPhone media be imported immediately by invoking a use case after upload, or should the endpoint only deposit files into `IMPORT_DIR` and rely on `import-worker`?
- unknown/high: Should the server preserve original iPhone filenames/metadata sidecars, or only rely on embedded EXIF/video metadata and hashes?
- unknown/medium: What maximum file size and quota policy should be enforced for personal deployment?
- unknown/medium: Should device registration be first-class (`device_id`, name, token revocation), or should the app reuse normal user sessions only for MVP?

## Readiness

- PREPARATION_NEEDED: the repo has enough import/auth context to design the MVP, but implementation should start with characterization tests for the new upload boundary and human validation for authorization/device semantics.
