# Documentation Guidelines

Rules for keeping the project's documentation consistent and up-to-date.

## 1. Central Documentation File
All high-level features, system architecture, and workflows are documented in the central file:
*   **[FEATURES_AND_ARCHITECTURE.md](../../../docs/FEATURES_AND_ARCHITECTURE.md)** (relative path).

## 2. Mandatory Updates
Whenever you complete implementing an accepted production feature, fixing a major structural bug, changing the system architecture, or adding APIs, you **MUST** update [FEATURES_AND_ARCHITECTURE.md](../../../docs/FEATURES_AND_ARCHITECTURE.md).

## 3. Lab Exception
For work isolated under `client/src/lab` (Lab-only experiments), **DO NOT** update the central documentation. Keep notes inside the lab folder instead. Only update [FEATURES_AND_ARCHITECTURE.md](../../../docs/FEATURES_AND_ARCHITECTURE.md) once the experiment is promoted to production or if it changes a core architecture rule.

## 4. What to Document
- **New APIs**: Endpoint paths, HTTP methods, payloads, and response structures.
- **Database Changes**: Schema modifications, migrations, or new tables.
- **Core Algorithms**: Deduplication flow, Face AI pipelines, EXIF parsing logic.
- **Infrastructure**: New dependencies, Docker containers, or environment configurations.

## 5. Style
Be concise. Use Markdown. Focus on explaining concepts, flows, and rationales rather than copy-pasting raw source code blocks.
