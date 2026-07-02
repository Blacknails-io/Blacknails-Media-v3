# PhotoPrism Comprehensive Research Report

**Synthesized by Lead Researcher (Grok Build subagent)**  
**Date:** 2026-07-02  
**Sources:** Official Documentation (docs.photoprism.app), GitHub Repository (github.com/photoprism/photoprism), Docker Hub, release notes, and related pages.  
**Local Context:** Blacknails-Media-v3 workspace (v3 architecture, docs, docker-compose.yml, design specs).

This report consolidates research across PhotoPrism's docs, GitHub code structure (Go backend + Vue frontend), AI pipeline, deployment, search/organization, integrations, and direct comparison to the local Blacknails-Media-v3 project.

**Key Source URLs (for citations):**
- Main GitHub: https://github.com/photoprism/photoprism [web:0][web:23]
- Official Site/Features: https://www.photoprism.app/ and https://www.photoprism.app/features/ [web:9][web:25]
- Docs: https://docs.photoprism.app/ [web:5][web:24]
- Docker Compose Guide: https://docs.photoprism.app/getting-started/docker-compose/ [web: fetched content]
- AI / Vision: https://docs.photoprism.app/user-guide/ai/ [web: fetched]
- Config: https://docs.photoprism.app/getting-started/config-options/ [web: fetched]
- CODEMAPs: Backend/Frontend in repo [web: fetched raw]

---

## 1. Overview & Positioning

PhotoPrism® is an **AI-powered, privacy-first, self-hosted app** for browsing, organizing, and sharing photos and videos. It automatically tags, searches, and helps rediscover media without compromising user freedom or requiring cloud services.

**Core Positioning:**
- **Privacy & Independence:** 100% self-funded, independent project. Never sells data; all processing local (or user-controlled via Ollama/OpenAI). Data stays under user control. AGPL 3.0 license for Community Edition.
- **Target Audience:** Individuals, prosumers, families, and organizations seeking a powerful local alternative to Google Photos, Apple Photos, or cloud galleries. Supports personal use (Community free), Plus/Personal memberships for extras (maps, support), and Team/Enterprise editions.
- **Deployment Focus:** Designed for Docker (primary), but also tarballs, NAS (Synology, etc.), Raspberry Pi, FreeBSD, DigitalOcean, PikaPods, Portainer. Runs on AMD64, ARM64 (Apple Silicon, Pi), etc.
- **Mission:** "The most user- and privacy-friendly solution to keep your pictures organized and accessible." Runs everywhere with a responsive PWA (Progressive Web App) for native-like experience.

**Editions Comparison (from features page):**
- **Community (Free):** Core indexing, search, faces (TensorFlow), labels, basic sharing, WebDAV. Self-hosted.
- **Plus/Personal:** Enhanced maps, more AI (Ollama/OpenAI deeply), advanced features.
- **Team/Pro:** SSO, roles, hardened security, on-prem scale.

It positions as a decentralized, AI-enhanced personal media library with strong emphasis on file format breadth (RAW, videos, Live Photos, HEIC, etc.) and metadata fidelity.

**Inspiration in Local Project:** Blacknails-Media-v3 explicitly draws from PhotoPrism: "Nuestra idea surge de las capacidades de herramientas como **PhotoPrism** como base." North Star emphasizes "Prosumer UI (PhotoPrism Style)", privacy-first local AI (Ollama), background ingestion, and elegant self-hosted experience. See `docs/NORTH_STAR.md` and `docs/design/prosumer_ui_technical_spec.md`.

**Citations:** Primary from GitHub README [web:23][web:0], Features page [web:25], Docs index [web:24].

---

## 2. Features Deep Dive

PhotoPrism offers a rich, data-dense yet clean experience:

**Core Media Handling:**
- Broad format support: JPEG, PNG, GIF, BMP, HEIF/HEIC, WebP, RAW (extensive via Darktable/RawTherapee), MP4/MOV, WebM, Live Photos/Motion Photos, Animated GIFs, PDF, Vector (SVG), JPEG XL (Plus). Max 900 MP.
- **Indexing vs Import:** Index originals in-place (preserve structure/names) or import from folder (dedup, canonical YYYY/MM naming, original filename preserved as metadata).
- **Duplicate Detection:** Skips exact duplicates (by hash/UID/filename/time+location). Automatic stacking of bursts/variants/sidecars.
- **Metadata:** Deep Exif/XMP extraction + merging (via ExifTool), Google Photos JSON support. Fields: title, description, date, location, camera/lens (ISO, f/, exposure, focal), keywords, copyright, artist. YAML sidecars optional for backups.
- **Thumbnails & Previews:** Multiple sizes; on-demand or pre-generated. Video transcoding to AVC via FFmpeg (hardware accel support: NVIDIA, Intel QSV, VAAPI, Apple). RAW conversion.
- **Organization Views:** Timeline browse, Albums (manual + auto "Moments"), Labels (auto + custom), People (faces), Places (maps), Calendar, Review/Archive/Private flags. Stacks, Favorites.
- **Live Photos:** Hover-play in grid/slideshow.
- **Maps & Geocoding:** 6 high-res world maps (Plus+). Privacy-preserving reverse geocoding. S2 cells, lat/lng, altitude, OLC support.
- **Sharing:** Secret links for albums (expiring optional). No registration required for viewers. WebDAV for direct FS access (Windows Explorer, Finder, PhotoSync clients for phone backup).
- **PWA:** Installable on desktop/mobile; offline-capable elements.
- **Other:** Batch edit (Plus+), Info sidebar (deep metadata + editing), Uploads/Web Upload, Read-only mode, NSFW flagging (optional auto-private).

**Search & Filters:** Extremely powerful (see dedicated section).

**AI Features:** See AI & Vision Pipeline section.

**Admin & Ops:** Library index/scan (full rescan option), Face indexing/reset, Vision runs, Backups (DB + YAML albums), Users/roles, CLI (`photoprism index`, `import`, `faces`, `vision`, `backup`, etc.), Prometheus metrics, Webhooks? (limited), Session monitoring (Plus).

**UI:** Responsive PWA with cards/list/mosaic views, lightbox (immersive viewer with metadata), sidebar details, filters toolbar. Data-dense prosumer style (badges, overlays on hover).

**Limitations (Community):** Some advanced AI/maps/SSO in paid; no native mobile apps beyond PWA + partners.

**Citations:** Features [web:25], User Guide sections, GitHub [web:23].

---

## 3. AI & Vision Pipeline (with config examples)

PhotoPrism has a sophisticated **multi-engine computer vision pipeline**. Defaults use built-in TensorFlow (ONNX transition for faces) for:
- Label classification (objects/scenes)
- Face detection + recognition + clustering
- NSFW detection (optional, flags private)
- Basic captions? (enhanced externally)

**Modern Extensions (key recent additions):**
- Direct **Ollama** integration for high-quality captions and labels (vision models).
- **OpenAI** API support (GPT vision models) for captions/labels.
- Custom TensorFlow models.
- `vision.yml` for declarative configuration of models, engines, run modes, prompts, options, services.
- Multiple models per type (labels, caption, face, nsfw) with fallbacks.
- Scheduling: workers for metadata/vision.

**Performance Notes:**
- TensorFlow: Fast, local, low-res (224px).
- Ollama/OpenAI: Higher quality, 720px input. Ollama: 1-4s/image on RTX 4060 GPU; 10s–1min+ CPU.
- Run modes prevent slowing import: `auto` (post-index), `on-demand`, `on-schedule`, `newly-indexed`, `manual`, `on-index` (TF only), `always`, `never`.

**vision.yml Reference (excerpts from docs):**
```yaml
Models:
- Type: caption
  Model: gemma4:latest
  Engine: ollama
  Run: auto
  Prompt: >
    Create a caption with exactly one sentence in the active voice that
    describes the main visual content. Begin with the main subject and
    clear action. Avoid text formatting, meta-language, and filler words.
  Service:
    Uri: http://ollama:11434/api/generate
- Type: labels
  Model: qwen3-vl:4b-instruct
  Engine: ollama
  Run: on-demand   # or auto / on-schedule
  Prompt: |
    Analyze the image and return JSON label objects with name, confidence (0-1), and topicality (0-1):
    - Return AT MOST 3 labels.
    - Each label name MUST be a single-word noun...
  Options:
    Seed: 3407
    Temperature: 0.01
    TopK: 40
    TopP: 0.9
    MinP: 0.05
    RepeatLastN: 128
    RepeatPenalty: 1.2
    NumPredict: 512
  Service:
    Uri: http://ollama:11434/api/generate
Thresholds:
  Confidence: 10
  Topicality: 0
  NSFW: 75
```

**Ollama Compose Snippet (from docs):**
```yaml
ollama:
  image: ollama/ollama:latest
  environment:
    OLLAMA_HOST: "0.0.0.0:11434"
    OLLAMA_MODELS: "/root/.ollama"
    # GPU flags, KV cache (f16/q8_0), flash-attention, etc.
  volumes:
    - "./ollama:/root/.ollama"
```

**Recommended Models (docs):**
- Gemma 4 (gemma4:latest or :e4b/e2b): Reliable, fast JSON, good default for labels/captions.
- Qwen3-VL (qwen3-vl:latest or :4b-instruct variants, or community like huihui_ai/...): Superior vision/OCR/reasoning; strict prompts + low temp needed for labels.
- Prompts emphasize: active voice, no meta ("This image shows"), factual, limited output, singular nouns.

**Face Pipeline:** ONNX engine (replaced legacy Pigo). Configurable: min size/score, cluster core/dist/radius, match dist, etc. CLI: `photoprism faces index/reset`.

**NSFW:** Optional via TF or Ollama (when DETECT_NSFW + EXPERIMENTAL).

**CLI/Workers:**
- `photoprism vision run -m labels/caption --count N --force`
- `photoprism vision ls` to inspect loaded config.
- Background: index workers + vision/metadata workers (wakeup-interval).

**Config Flags:** `PHOTOPRISM_VISION_YAML`, `PHOTOPRISM_DETECT_NSFW`, disable flags for TF/faces/classification.

**Citations:** AI docs pages (multiple fetches from docs.photoprism.app/user-guide/ai/*), vision.yml reference, Ollama setup.

**Local Parallel in Blacknails:** Uses Ollama directly (env `OLLAMA_URL`, models `huihui_ai/qwen3-vl-abliterated:4b-instruct` for vision + `qwen2.5:7b` text). Task runners: Description, Tags, Title, Nsfw, Face, FaceCluster. Python face service + Qdrant vectors. Event-driven (SSE to admin console).

---

## 4. Architecture & Code (Go + Vue)

**Backend (Go):**
- **Structure (from CODEMAP.md):** `cmd/photoprism/photoprism.go` (CLI entry). `internal/commands/` for all subcommands. `internal/server/` (Gin HTTP server, routes, middleware, static/UI/WebDAV). `internal/api/` (handlers + Swagger).
- **Core Domain:** `internal/photoprism/` (indexing, import, media processing, faces, thumbs). `internal/entity/` (GORM models, queries, search). `internal/ai/vision/` (multi-engine vision: adapters for TF, Ollama, OpenAI; schema/prompts).
- **Workers/Scheduling:** `internal/workers/` (index, vision, meta, sync, backup). Started at `start`.
- **Config:** `internal/config/` (Options with yaml/json/flag tags; precedence defaults.yml < CLI/env < options.yml). DB: GORM (SQLite default or MariaDB/MySQL recommended for scale).
- **Other:** `internal/auth/`, `internal/meta/`, `internal/ffmpeg/`, `internal/thumb/` (libvips preferred), `pkg/*` (pure utils, no internal imports).
- **Startup:** CLI start → config/DB migrate → server/routes → workers.
- **API:** REST v1 under /api/v1. Swagger generated. WebSockets for live updates? SSE-like in places. Prometheus /metrics.
- **DB:** SQLite (simple, capped workers) or MariaDB (high concurrency). Entities for photos, files, labels, subjects (people), albums, etc. Sidecars + YAML exports.
- **Build:** Makefile heavy; Go modules. Multi-arch Docker.

**Frontend (Vue 3 + Vuetify 3):**
- **CODEMAP:** `frontend/src/`. `app.vue` + `app.js` (bootstrap, Vuetify, router). `src/app/routes.js`. Singletons: `$config`, `$session`, `$api` (Axios).
- **Models:** REST base + concrete (photo, album, etc.) for CRUD/search.
- **Components/Pages:** `src/component/`, `src/page/` (Gallery/Photos, Albums, People, Places, Settings, Admin, Login). Lightbox shared.
- **Common:** api, websocket, view (scroll restore), gettext i18n, pwa (Workbox).
- **Theming:** Options + Vuetify themes. Pinned Vuetify 3.12.2 (known issues avoided).
- **Build:** Webpack (via package.json scripts). Vitest for unit. Service worker.
- **PWA & SPA:** Full SPA served by backend (monolith style noted in local code too).

**Key Design:** Backend-heavy logic (indexing/AI in Go). Frontend thin client consuming API + config injection (`window.__CONFIG__`). Strong separation; pkg/ for reuse.

**Citations:** Raw CODEMAP.md fetches (backend + frontend), GitHub tree, developer guide.

**Local Contrast:** Blacknails uses **Node.js/Express** (hexagonal/ports-adapters), **React 19 + TS + Tailwind 4 + Framer Motion + Atropos**, SQLite, event bus + task runners (domain/application/adapters), SSE for admin logs. Client/server workspaces. Less monolithic than PhotoPrism's Go+Vue SPA served together.

---

## 5. Deployment & Ops (Docker, DB, config)

**Primary: Docker Compose**
- Example downloads from dl.photoprism.app (platform-specific: linux, arm64, windows, macos, podman).
- Core service: `photoprism/photoprism:latest` or `:preview`.
- **Volumes (critical):**
  - `/photoprism/originals` → host media (read-only possible).
  - `/photoprism/storage` → config, cache, thumbs, sidecars, DB (if SQLite). **Must be persistent SSD preferred**.
  - Optional `/photoprism/import`.
- **DB:** SQLite (in storage) or MariaDB (recommended compose service; better concurrency). DSN via env.
- **Env/Config:** Dozens of `PHOTOPRISM_*`. Or `options.yml` / `vision.yml` in config dir. `photoprism show config` / `config-options`.
- **Admin Password:** Set `PHOTOPRISM_ADMIN_PASSWORD` on first start (min 8 chars). Change later via CLI.
- **Users/UID:** `PHOTOPRISM_UID/GID`, umask. Non-root recommended.
- **Networking:** Default port 2342. Proxy support (trusted-proxy), TLS options, CORS, CSP headers.
- **Resources:** 4GB+ RAM recommended + swap. No hard mem limits (indexing spikes). Workers auto or `PHOTOPRISM_WORKERS`.
- **Init/Extras:** `PHOTOPRISM_INIT` (tensorflow, https, gpu, etc.). Profiles for ollama/vision/qdrant in dev compose.
- **Ops CLI (inside container):** `photoprism index [--cleanup|-f]`, `import`, `convert`, `thumbs -f`, `backup/restore`, `faces`, `vision run`, `passwd`, `reset`, `migrations`, `users`.
- **Backups:** Scheduled DB + album YAML. Sidecar YAML.
- **Other:** Read-only mode, feature flags (`PHOTOPRISM_DISABLE_*`), index schedule, vision schedule, auto-index on WebDAV.

**Example Minimal Compose Snippet (adapted):**
```yaml
services:
  photoprism:
    image: photoprism/photoprism:latest
    ports: ["2342:2342"]
    volumes:
      - "./originals:/photoprism/originals"
      - "./storage:/photoprism/storage"
      - "./import:/photoprism/import"  # optional
    environment:
      PHOTOPRISM_ADMIN_PASSWORD: "securepass"
      PHOTOPRISM_DATABASE_DRIVER: "sqlite"  # or mysql + server
      # ... many others
  # Optional: mariadb, ollama (profile)
```

**Local Blacknails docker-compose.yml:** Custom multi-service (api: node build/dev, client), volumes for library/{import,originals,archive,storage}, data/ for DB. Env: OLLAMA_URL + specific models. Healthchecks. External ai_network. No PhotoPrism image; custom app.

**Citations:** Docker compose guide (detailed fetch), config-options (comprehensive), compose.yaml raw (dev example).

**Other Ops:** Tarball install, systemd?, NAS apps, cloud marketplace. Troubleshooting emphasizes swap, storage (SSD), workers, DB choice.

---

## 6. Search & Organization

**Search is a standout strength:**
- Toolbar dropdowns + free-text query syntax.
- **Syntax:** `label:cat color:green type:live`, `label:cat|dog`, `label:cat&!blurry`, `keywords:"buffalo & water"`, wildcards `*`, escapes `\`.
- **Filters (extensive):** uid, path/folder, filename/name/original, title/caption/description, label/labels, people/person/subjects, album/albums, year/month/day, country/state/city, camera/lens, color, chroma, mp, iso, f, mm, geo/lat/lng/s2/olc/dist, quality, favorite, private/public, type (image/raw/video/live/...), stack, face/faces, added/taken/updated, error, review, etc.
- AND/OR/NOT combinations. Bounding boxes, near, etc.
- Excludes hidden/archived/private/dupe by default.
- Results power all views (browse, people, places).

**Organization Primitives:**
- **Albums:** Manual + auto (Moments, folders as albums on index).
- **Labels:** Auto-classified + user custom/rename/merge.
- **People:** Face clusters → named subjects. Manual tagging/confirmation.
- **Places:** Geocoded + maps.
- **Flags:** Favorite, Private, Archived, Review, Hidden (errors).
- **Stacks:** Auto for related (bursts, raw+jpeg, sidecars).
- **Folders:** Preserved or canonicalized.
- **Sidecars:** XMP/YAML/JSON for metadata portability.

**Performance:** Fast scrolling, infinite load, cached thumbs. Server-side filtering.

**Local Blacknails:** Gallery grid + filters (incomplete in docs but implemented). AI tags/descriptions/faces feed search/organization. No maps mentioned. Event logs for pipeline visibility. Prosumer sidebar/details panel planned (PhotoPrism-inspired).

**Citations:** Search filters doc (detailed fetch).

---

## 7. Integrations & Extensibility

**Integrations:**
- **Clients:** PhotoSync (iOS/Android backup), WebDAV (Explorer/Finder/any DAV client), native apps via API.
- **Sync/Backup:** WebDAV bidirectional, import folders, uploads.
- **Auth:** Password, OIDC/OpenID Connect (Google, Keycloak, custom; Plus features for groups), 2FA, app passwords, client credentials. Roles: Super Admin/Admin/User/Viewer/Guest.
- **AI Ext:** Ollama (self-hosted), OpenAI, custom TF/vision services (via vision.yml + /api/vision).
- **Maps:** Built-in + external geocoding service (privacy-preserving).
- **Monitoring:** Prometheus metrics.
- **Other:** yt-dlp? (in dev), FFmpeg/ExifTool/Darktable as external bins (configurable paths), MCP (Model Context Protocol) API for AI agents (can disable).
- **Export:** YAML sidecars, DB backups, downloads/zips.
- **PWA/Service Workers.**

**Extensibility:**
- **Config-Driven AI:** vision.yml, options.yml.
- **CLI:** Full automation/scripting.
- **API:** REST + (limited) vision endpoints. Swagger.
- **Custom Models:** TF paths, Ollama any vision model.
- **Themes/Locale:** UI customization.
- **Cluster/Portal:** Advanced multi-node (Pro/Team?).
- **Dev:** Full developer guide, CODEMAPs, Makefile targets, AGENTS.md for contributors. Fork-friendly.
- **Contrib:** Scripts in photoprism-contrib repo.

**Local Blacknails:** Ollama integration (direct service), Qdrant for faces, Python face detection, hexagonal for easy adapters, SSE events, shared package, Playwright tests. Import via FS watch? Event bus for pipeline. Less emphasis on WebDAV/DAV clients or maps yet. Monolith serving (noted "Estilo PhotoPrism").

**Citations:** Features, advanced docs, AI integration pages, GitHub.

---

## 8. Comparison to Blacknails-Media-v3 (based on local workspace docs/docker-compose)

**Similarities (PhotoPrism as North Star):**
- **Privacy/Local AI First:** Both emphasize no cloud leakage. Local Ollama processing. Blacknails explicitly "potenciado íntegramente por Inteligencia Artificial local."
- **Background Ingestion:** FS-based (library/import → originals). No browser upload primary. PhotoPrism import/originals distinction mirrors Blacknails library/import/originals/archive/storage.
- **AI Organization:** Auto descriptions, tags/labels, faces, NSFW. Blacknails workers: Description/Tags/Title/Nsfw/Face/FaceCluster. PhotoPrism has equivalent + vision pipeline.
- **Prosumer UI:** Blacknails design docs explicitly "PhotoPrism Style" — data-dense, sidebar (events/workers/users), details panel (EXIF + AI tags), grid + modal. Framer Motion for polish. North Star: "powerful yet clean... deep access to metadata, filtering, and AI tags."
- **Self-Hosted Docker:** Both use compose + volumes for media. Blacknails api+client split; PhotoPrism single + optional DB/Ollama.
- **Metadata/Thumbs:** EXIF, sidecars (YAML/XMP), thumbnails, archive.
- **Event/Pipeline Visibility:** Blacknails SSE admin console; PhotoPrism has logs/CLI/workers + metrics.

**Differences:**
- **Stack:**
  - PhotoPrism: Go (Gin/GORM) + Vue 3/Vuetify SPA (monolithic serve). Mature, performant backend logic.
  - Blacknails: Node/Express (hexagonal DDD/ports-adapters) + React 19/TS/Tailwind/Framer. Modern JS full-stack, event-driven with InMemoryEventBus + Outbox.
- **DB:** PhotoPrism: SQLite (default) or MariaDB. Blacknails: SQLite (better-sqlite3).
- **AI:** PhotoPrism: TF built-in + flexible Ollama/OpenAI via vision.yml (multiple run modes, prompts, thresholds). Blacknails: Direct Ollama (specific abliterated Qwen VL + text), Python OpenCV face + Qdrant vectors. Task runners in app layer.
- **Scale/Features:** PhotoPrism: Maps (6 high-res), advanced search syntax/filters, WebDAV server/clients, Live Photos hover, broad RAW/video, batch edit, OIDC/roles deep, stacks, places. Much more polished/mature.
  Blacknails: Focused pipeline (import/index/thumbnail/desc/tags/nsfw/face/cluster), prosumer admin, test sandbox (25 edge cases), face clustering emphasis. No maps/WebDAV yet.
- **UI Philosophy:** Both prosumer. PhotoPrism: Vuetify data-dense PWA. Blacknails: Invisible/minimal + modern (Tailwind + physics animations), design mocks for gallery/modal. Explicit "UI must be invisible" + "data-dense but clean".
- **Deployment:** PhotoPrism: Standardized compose + init scripts. Blacknails: Custom multi-stage Node Dockerfile (ffmpeg/exiftool/opencv), dev mounts, external network.
- **Architecture:** PhotoPrism pragmatic Go internals. Blacknails strict hexagonal + events for maintainability/agents.
- **Maturity:** PhotoPrism: 13k+ commits, broad ecosystem, releases, memberships. Blacknails: Alpha/Beta, core pipeline + UI scaffolded, test assets focus.
- **Ingestion:** Both dir-based. PhotoPrism has import canonicalization + dedup strong. Blacknails has archive/originals/storage distinction + fix_paths.mjs.

**Opportunities for Blacknails (Inspiration):**
- Adopt vision.yml-like declarative AI config.
- Expand search syntax/filters.
- Add WebDAV or robust external sync.
- Maps/geocoding (privacy first).
- More robust sidecar/backup (YAML).
- Face pipeline maturity (ONNX? clustering params).
- PWA + service worker polish.
- CLI parity or admin tooling.
- Multi-DB (MariaDB path).
- Broader format support via FFmpeg/ExifTool configs.

Blacknails can differentiate with stricter DDD, React modernity, Qdrant vector memory, and agent-friendly architecture while borrowing UI density and AI flexibility.

**Sources:** Local `docker-compose.yml`, `FEATURES_AND_ARCHITECTURE.md`, `NORTH_STAR.md`, design specs, server code snippets, PhotoPrism docs/CODEMAPs.

---

## 9. Key Takeaways & Inspiration Points

**Strengths of PhotoPrism:**
- Mature, battle-tested AI + media pipeline (multi-engine vision is powerful).
- Exceptional search expressiveness and organization primitives (labels/people/places/stacks).
- Excellent Docker-first ops story with clear volume/DB guidance.
- Privacy stance + independence model (sustainable via memberships).
- Broad compatibility (formats, clients, platforms).
- Prosumer UI that balances density and usability.

**Weaknesses/Gaps (for inspiration):**
- Backend is Go (learning curve for JS teams); frontend pinned older Vuetify.
- AI config powerful but requires YAML/CLI understanding.
- Some premium features gated.
- Indexing can be resource-heavy (RAM/swap guidance prominent).

**Inspiration for Blacknails-Media-v3:**
1. **AI Configurability:** Adopt structured `vision.yml` equivalent + run modes (auto vs scheduled) to decouple ingestion from heavy LLM.
2. **Search Power:** Implement rich query syntax (label:foo|bar, wildcards, negation) on top of current filters.
3. **Deployment Hygiene:** Standardize volume patterns (originals/storage/import), SSD recs, non-root, clear DB choice (SQLite vs MariaDB).
4. **UI Density:** Continue "PhotoPrism Style" prosumer panels, metadata sidebars, badges/overlays. Leverage Framer for physical feel.
5. **Pipeline Robustness:** Expand worker scheduling, vision reset/re-run, face cluster tuning params, sidecar YAML exports.
6. **Integrations:** Prioritize WebDAV server, OIDC, PhotoSync-like, Prometheus.
7. **Extensibility:** Expose more via API/events; consider MCP or vision service endpoints.
8. **Docs & Ops:** Mirror CLI help, `show config`, troubleshooting checklists. Maintain CODEMAP/AGENTS style for team.
9. **Differentiation:** Double down on hexagonal/events + vector (Qdrant) + React modernity + strict local privacy (no OpenAI unless opt-in). Test sandbox is unique strength.
10. **Organization:** Canonical import + preserve-structure indexing modes.

**Overall Recommendation:** PhotoPrism is an excellent reference implementation for a self-hosted AI photo library. Blacknails-Media-v3 has a strong modern foundation and can achieve parity or superiority in specific areas (architecture cleanliness, vector AI, UI fluidity) by selectively adopting patterns from it. Continue referencing its docs for edge cases (RAW, Live Photos, face tuning, indexing perf).

**Next Steps Suggestion:** Prototype vision config loader + expanded search parser; evaluate adding WebDAV or map tiles (privacy-safe).

**Full Source Citations:** All web fetches reference docs.photoprism.app, github.com/photoprism/*, and raw files. Local paths: `/srv/storage/ai-lab/Blacknails-Media-v3/{docker-compose.yml, docs/*, server/src/*}`.

---

*Report generated from comprehensive tool-assisted research. For latest, consult official docs and repo (active development noted in 2026 releases).*