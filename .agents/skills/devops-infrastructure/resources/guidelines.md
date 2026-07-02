# DevOps & Infrastructure Guidelines

This skill defines the workflows for managing Docker containers, multi-service networking, and GPU integration within **Blacknails-Media-v3**.

## 1. Docker Compose & Services

The application orchestrates its development stack through [docker-compose.yml](file:///srv/storage/ai-lab/Blacknails-Media-v3/docker-compose.yml).
- **Service definitions**:
  - `api`: Node.js server building from [server/Dockerfile](file:///srv/storage/ai-lab/Blacknails-Media-v3/server/Dockerfile) mapped to port `3003:3000`.
- **Healthchecks**: Ensure healthchecks are correctly defined on API services (e.g. curling `http://localhost:3000/health`).

## 2. Storage & Volume Mapping

Persistent storage is split to isolate original assets, database files, and transient/derived assets:
- `./data` -> `/home/node/app/data` (stores the SQLite database file `blacknails.db`).
- `./library/import` -> `/home/node/app/library/import` (temporary staging directory).
- `./library/originals` -> `/home/node/app/library/originals` (source-of-truth read-only media library).
- `./library/storage/thumbnails` and `./library/storage/sidecars` (derived directories).
*Rule*: Never store database state inside transient directories.

## 3. Network & GPU Integration (Ollama)

The services communicate over an external Docker network:
- **Network Name**: `ai_network` (external). This network enables the API container to talk to the local host's Ollama instance.
- **Ollama Host URL**: `http://ollama-rocm:11434` (or `http://host.docker.internal:11434` depending on the environment).
- ROCm PyTorch TunableOp and GPU index naming behavior applies when accelerating processing with AMD GPUs. Ensure GPU device indexes are correctly addressed if mapping ROCm device paths (`/dev/kfd`, `/dev/dri`) inside containers.