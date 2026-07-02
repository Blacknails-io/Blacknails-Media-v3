# PhotoPrism Research Report

**Date**: 2026-07-02  
**Sources**: https://docs.photoprism.app/ + https://github.com/photoprism/photoprism (release + develop trees)  
**Purpose**: Thorough investigation to understand architecture, features, AI pipeline, deployment and potential inspiration for Blacknails-Media-v3.

## 1. Overview & Positioning

PhotoPrism® is a **mature, privacy-first, AI-powered self-hosted app** for browsing, organizing and sharing photos & videos.

- 40k+ GitHub stars, very active.
- AGPL licensed (Community Edition).
- Mission: "the most user- and privacy-friendly solution".
- Fully independent / self-funded (memberships for + features like full maps).
- Strong emphasis on **not selling data**, transparency.
- Runs everywhere: Docker (primary), Raspberry Pi, NAS, bare Linux, etc.
- Multi-arch: amd64, arm64, armv7.

**Core value props**:
- Automatic AI labeling, face recognition, captions.
- Extremely powerful combined search filters.
- Excellent media format support (RAW, Live Photos, video, HEIC, etc.).
- PWA-first experience.
- WebDAV + native app sync (PhotoSync etc.).
- Maps & places (privacy-preserving geocoding).

## 2. Key Features (User-Facing)

### Browsing & Organization
- Cards / list / full-screen viewer with Live Photos hover play.
- Stacks (group Live Photos, bursts, RAW+JPEG).
- Albums, labels, people (faces), places.
- Review queue, favorites, archive, private, hidden.
- Batch edit metadata (recent major feature).
- Info sidebar: edit titles, captions, labels, people, albums in-viewer.
- Six high-res world maps.

### Search (one of the strongest points)
Very rich filter syntax usable in search bar or dropdowns:

Examples:
```
label:cat|dog&!blurry color:green type:live
people:"Jane & John" year:2020|2021 mp:4-12
```

**Full filter reference** includes:
- Boolean switches: `live:yes`, `raw:yes`, `mono:yes`, `panorama:yes`, `stack:yes`, `review:yes`...
- Numeric: `quality:`, `mp:`, `chroma:`, `faces:`, `dist:`
- Text + operators: `&` (AND), `|` (OR), `!` (NOT), wildcards `*`
- Geo: `lat:`, `lng:`, `s2:`, `latlng:`, `near:`, `geo:yes`
- Metadata: `camera:`, `lens:`, `iso:`, `f:`, `mm:`, `caption:`, `title:`, `path:`, `filename:`, `hash:`, `uid:`, `keywords:`, `label:`, `person:`, `subjects:`, `album:`, `color:`, etc.
- Time: `year:`, `month:`, `day:`, `taken:`, `added:`, `updated:`

This is significantly more advanced than most self-hosted galleries.

### AI Capabilities
- **Hybrid engine system** (very flexible, recent evolution):
  - **TensorFlow** (built-in): labels, faces, NSFW (224px). Fast, offline.
  - **Ollama** (self-hosted, recommended for quality): captions + labels at 720px.
  - **OpenAI** (cloud): highest quality captions/labels.
- `vision.yml` configuration for complete control:
  - Per-type (caption, labels, face, nsfw) models + engine.
  - Run modes: `auto`, `on-index`, `newly-indexed`, `on-demand`, `on-schedule`, `always`, `manual`, `never`.
  - Full Ollama sampling options (temperature, top_p, mirostat, num_ctx, etc.).
  - Service endpoints, auth, prompts, schemas.
- Face recognition: modern ONNX pipeline (replaced legacy Pigo). Tunable clustering parameters (cluster dist, core size, radius, match dist, etc.).
- NSFW detection (can auto-flag private).
- Recent additions: Batch metadata editing, improved faces, direct Ollama/OpenAI integration.

### Other Notable
- Sidecar YAML files for metadata backup.
- ExifTool + FFmpeg + Darktable/RawTherapee + ImageMagick + libheif.
- WebDAV (full read/write on originals/import).
- Import folder + structured move/copy on import.
- Upload limits, NSFW upload control.
- Scheduled indexing, vision workers, backups.
- PWA installable, nice mobile experience.

## 3. Architecture & Tech Stack

### Backend (Go ~75%)
From CODEMAP.md and source:

- `cmd/photoprism/photoprism.go` + `internal/commands/*`
- `internal/server/*` (Gin, routes, middleware, WebDAV, static)
- `internal/api/*` (handlers + Swagger)
- `internal/config/*` (very rich options system, flags/env/yaml precedence)
- `internal/entity/*` (GORM models, queries, search, migrations)
- `internal/photoprism/*` (core: index, import, media, thumbs)
- `internal/ai/vision/*` (multi-engine vision pipeline, adapters for ollama/openai + TF)
- `internal/workers/*` (background: index, vision, meta, sync, backup)
- `internal/auth/*`, `internal/ffmpeg/*`, `internal/thumb/*`, `internal/meta/*`
- `pkg/*` (pure utilities, no internal imports)

**Database**: GORM v1. SQLite (default for simple) or MariaDB (strongly recommended for scale/performance). MySQL 8 dropped.

**Key patterns**:
- Workers + schedulers (cron-like).
- Clear separation: api (glue) vs photoprism (domain).
- Heavy use of sidecars + YAML for portability.
- Sophisticated file handling (dedup by hash + perceptual?).

### Frontend (Vue 3 + Vuetify)
- Separate `frontend/` tree.
- PWA, service workers.
- Rich UI for search, lightbox, maps, people clustering.

### Build & Dev
- Makefile-centric.
- Docker dev container recommended.
- `make build-go`, `make build-js`, swag for API docs.
- Multi-stage Dockerfiles.
- AGENTS.md + per-package AGENTS.md (very similar to this project's skill system).

## 4. Deployment & Operations (Excellent)

### Recommended: Docker Compose
Example (from dl.photoprism.app):

- `photoprism` service + `mariadb`
- Optional `ollama` + `open-webui` via profiles.
- NVIDIA support via device reservations + env.
- Volumes:
  - `/photoprism/originals` (your media — critical)
  - `/photoprism/storage` (thumbnails, cache, sidecars, db if sqlite)
  - `/photoprism/import` (optional staging)
- Database volume for MariaDB.

**Important production notes**:
- Minimum: 2 cores, 3-4GB RAM + **4GB+ swap**. No hard memory limits.
- SSD for storage + db recommended.
- Always put behind reverse proxy (Traefik/Caddy) for HTTPS.
- Change admin password immediately.
- `PHOTOPRISM_INIT: "https tensorflow"` (or gpu variants).

### Config System
Extremely complete (100+ options):
- All via env (`PHOTOPRISM_*`), `options.yml`, or `defaults.yml`.
- `vision.yml` for AI models (the killer feature for flexibility).
- Feature flags: `PHOTOPRISM_DISABLE_*` for almost everything (tensorflow, faces, ffmpeg, exiftool, webdav, etc.).
- Read-only mode.
- Detailed face clustering tunables.
- Workers, schedules, upload/import limits.

### DB Choice
- **SQLite**: Fine for small/personal, simple deploys. Capped workers (~4).
- **MariaDB**: Production recommendation. Better concurrency, performance for large libraries.

### CLI Power
`photoprism` binary inside container has rich subcommands:
- `index`, `import`, `faces index/reset`, `convert`, `thumbs`, `backup`, `restore`, `passwd`, `show config`, migrations, etc.
- Great for automation + cron.

### Security & Ops
- Session control, OIDC support (advanced).
- Rate limiting / IP blocking.
- Read-only + permissions.
- Sidecar + DB + album YAML backups.
- Watchtower example for updates.

## 5. Integrations & Extensibility

- **WebDAV**: First-class (Windows Explorer, macOS Finder, many clients).
- **Mobile sync**: PhotoSync recommended.
- **API**: REST + Swagger (v1). Also new MCP (Model Context Protocol) endpoint for AI agents (can be disabled).
- **Native apps**: Limited, but WebDAV + PWA + sync apps cover a lot.
- **Vision service**: Can point to external vision API.
- **Prometheus metrics**.
- **Cluster/Portal** (more advanced editions): multi-node.

## 6. Comparison to Blacknails-Media-v3

**Similarities** (great overlap):
- Self-hosted AI media gallery.
- `originals` / `import` / `storage` (thumbnails/sidecars) layout.
- Heavy Ollama usage for vision (Blacknails uses Qwen3-VL + text models).
- Task/worker pipeline for import → index → thumbs → description/tags/faces.
- Event-driven elements (Blacknails has InMemoryEventBus + Outbox).
- Docker Compose.
- Focus on local/privacy AI (no cloud lock-in).
- Metadata handling (EXIF/sidecars).

**PhotoPrism advantages / maturity**:
- Production-hardened for years (huge library support).
- Best-in-class search/filter language.
- Hybrid AI (TF fast path + Ollama/OpenAI high quality) with `vision.yml` + run modes.
- Mature face clustering with many tunable params.
- Excellent video/RAW/Live Photo handling + transcoding options.
- WebDAV out of the box.
- Maps + places (with privacy service).
- Batch operations, rich UI polish, PWA.
- MariaDB option + better scaling story.
- Very complete config + CLI.
- Sidecar YAML + scheduled backups built-in.
- Massive community + docs.

**Blacknails advantages / differentiators** (current):
- Hexagonal architecture (clean ports/adapters) — PhotoPrism is more traditional layered Go.
- Modern React 19 + Tailwind 4 + Framer Motion + Atropos (very nice modern UI tech).
- SQLite + Qdrant vector (explicit vector memory).
- Event bus + outbox pattern visible.
- Focused Python face service integration.
- Potentially lighter / more customizable stack for specific needs.
- Agent skills system (this project).

**Opportunities for Blacknails inspired by PhotoPrism**:
1. **vision.yml-style declarative AI config** — extremely powerful.
2. **Advanced search query language** (operators, wildcards, geo, etc.).
3. **Tunable face clustering parameters** and reset/index faces commands.
4. **Flexible run modes** for AI (on-index vs background).
5. **YAML sidecars** for metadata portability.
6. **MariaDB as production DB option** (consider for scale).
7. **Rich CLI** for all operations.
8. **Profiled Docker Compose** (ollama, gpu, etc.).
9. **WebDAV** support.
10. Better thumbnail / media processing pipeline robustness (FFmpeg variants, hardware accel matrix).
11. Scheduled workers + vision schedule.
12. Places / geo features if relevant.

## 7. Key Takeaways & Inspiration Points

- **Declarative AI is king**: vision.yml + multiple engines + run modes is a model worth copying/adapting.
- **Search UX wins users**: The filter system is a killer feature.
- **Mature media handling matters**: Support for stacks, Live Photos, RAW conversion tools, proper dedup.
- **Ops first**: Excellent Docker examples, clear volume strategy, swap/memory guidance, CLI everywhere.
- **Hybrid AI strategy**: Don't force one model; let users mix fast local + quality local/cloud.
- **Sidecars + exportable metadata**: Future-proofing.
- **Go + Vue works great** for this domain (performant backend + rich SPA).
- PhotoPrism shows what a "complete" version of this product looks like after years of iteration.

## Useful Links (from research)

- Docs home: https://docs.photoprism.app/
- Getting Started / Docker: https://docs.photoprism.app/getting-started/docker-compose/
- AI / vision: https://docs.photoprism.app/user-guide/ai/
- Config options: https://docs.photoprism.app/getting-started/config-options/
- Search filters: https://docs.photoprism.app/user-guide/search/filters/
- GitHub: https://github.com/photoprism/photoprism (release branch)
- CODEMAP.md (backend): excellent architecture map.
- AGENTS.md: contributor/agent guidelines (very structured, similar spirit to our skills).

## Status of Agents

Multiple specialized subagents were launched in parallel (`spawn_subagent`) for:
- Full user docs & features
- AI/vision deep dive
- Codebase architecture (CODEMAP + packages)
- Deployment / ops / security
- Synthesis report

Results will be available via subagent output tools.

---

*Report generated from direct page fetches + GitHub exploration. More depth available in running subagents.*
