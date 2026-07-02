# AI & Media Processing Guidelines

This skill defines the development workflows and operational guidelines for integrating AI features and media processing logic within the backend `/server` workspace of **Blacknails-Media-v3**.

## Media Processing Pipeline

1. **Importing Assets**:
   - New media is detected in `IMPORT_DIR` and processed asynchronously.
   - Original files must be safely copied to `ORIGINALS_DIR` using unique hash-based filenames to prevent duplicates.
   - EXIF and media metadata should be extracted immediately.

2. **Thumbnail & Sidecar Generation**:
   - Save web-optimized thumbnails in `THUMBNAILS_DIR` to avoid loading full-resolution images on the client.
   - Generate sidecar JSON metadata files in `SIDECARS_DIR` to keep track of analysis (e.g., labels, descriptions, face embeddings).

## Ollama Integrations

We use two primary LLMs hosted via local Ollama:
- **Vision Model** (`huihui_ai/qwen3-vl-abliterated:4b-instruct`):
  - Used for image and video frame analysis.
  - Prompts must be precise: ask for tags, descriptions, colors, and content structure in structured JSON formats.
- **Text Model** (`qwen2.5:7b`):
  - Used for processing descriptions, generating titles, semantic search parsing, and structuring search tags.

### Prompts & Parsing Rules
- Always request outputs in strict JSON format when calling LLMs.
- Always include an error/fallback parsing mechanism to prevent application crashes when Ollama returns non-compliant formats.
- Implement reasonable request timeouts and concurrency limits to avoid exhausting GPU VRAM.

## Face Detection & Clustering

- Maintain the `Face` domain entity and link face mappings to `Asset`.
- Keep face embeddings compact and stored in the SQLite database or sidecar files.
- Clustering algorithms (e.g., DBSCAN) should run asynchronously in worker threads to prevent blocking the main event loop.