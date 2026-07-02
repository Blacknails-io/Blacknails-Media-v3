# Blacknails Media v3 - Project Documentation

## 1. Overview
Blacknails Media v3 is an AI-powered, self-hosted media gallery application. It is designed to import, organize, deduplicate, and intelligently tag images and videos using local AI models (Ollama).

## 2. Technical Stack
- **Frontend**: React 19, Tailwind CSS 4, Framer Motion, Atropos UI (for 3D parallax effects).
- **Backend Architecture**: Hexagonal Architecture (Ports & Adapters).
- **Database**: SQLite (for fast local metadata and clustering storage).
- **AI Processing**: Ollama (derived `blacknails-vision` / `blacknails-text` models over Qwen3-VL and Qwen2.5) for image descriptions, NSFW scoring, video-frame validation, automated tagging, and title generation.
- **Testing**: Playwright (E2E Integration testing).

## 3. Implemented Features (Current State)
*Status: Core Pipeline and Frontend Implemented (Alpha/Beta)*

### 3.1. Backend Architecture (Node.js / Express)
- **Hexagonal Architecture**: Complete scaffolding with `domain`, `application` (use cases, task runners), and `adapters` (in/out).
- **Event-Driven Pipeline**: Implementado `InMemoryEventBus` con `OutboxDispatcher` para despachar eventos asíncronos transaccionales.
- **Workers & Task Runners**: Cola de tareas asíncronas ya registradas: `Import`, `Index`, `Thumbnail`, `Description`, `Tags`, `Title`, `Nsfw`, `Face`, `FaceCluster`. Los workers basados en assets procesan 1 elemento por ejecución para liberar locks/recursos entre items, mantener el pipeline reactivo y permitir que los modelos Ollama calientes se reutilicen sin retener lotes grandes.
- **AI & Integrations**: Integración lista con `OllamaService` (Text & Vision), `PythonFaceDetectionService`, y `QdrantVectorMemoryService`. La API usa solo dos modelos Ollama derivados: `blacknails-vision` para `description`, `nsfw` y validación opcional de frames de vídeo, y `blacknails-text` para `tags` y `title`; cada tarea ajusta `format`, `options` y timeout por request para evitar crear cinco modelos residentes. Ollama mantiene un pool compartido de dos cupos con afinidad por tipo: mientras un tipo está activo, el otro queda bloqueado. La concurrencia sigue siendo configurable por `OLLAMA_VISION_CONCURRENCY` y `OLLAMA_TEXT_CONCURRENCY`, que por defecto arrancan en 2. Cada request manda `keep_alive` configurable (por defecto `5m`); el runtime Ollama debe configurarse aparte con `OLLAMA_MAX_LOADED_MODELS=2` y `OLLAMA_NUM_PARALLEL=2` si se quiere probar dos modelos cargados y hasta dos solicitudes paralelas. Los Modelfiles viven en `ollama/modelfiles` y `ollama/bootstrap-models.sh` crea `blacknails-vision` y `blacknails-text` al arrancar el contenedor Ollama si faltan. `FaceTaskRunner` no reserva el pool de Ollama globalmente: fotos usan solo detección Python, y Ollama queda limitado a la validación opcional de frames de vídeo.
- **Auth & IAM**: Sistema de Login, Roles (`ADMIN`, `STANDARD`, `VIEWER`) y sesiones persistidas en SQLite. Las APIs aceptan `Authorization: Bearer <token>` y el login emite además una cookie `bn_session` `HttpOnly`/`SameSite=Lax` para que media, avatares y SSE puedan autenticarse sin exponer tokens en query string. `POST /api/auth/logout` limpia esa cookie. `PARTNER_USER` / `PARTNER_PASS` siembran una cuenta `VIEWER`; no existe rol runtime `PARTNER` en la alpha.
- **Streaming (SSE)**: Eventos emitidos en tiempo real al frontend a través de Server-Sent Events protegidos por sesión.
- **Asset Reprocessing API**: `POST /api/admin/assets/reprocess` permite a usuarios `ADMIN` reencolar análisis para assets seleccionados enviando `{ assetIds, jobs }`, donde `jobs` acepta `description`, `nsfw` y `faces`. El endpoint usa IDs de base de datos, valida el payload y marca campos/timestamps como pendientes para que los workers existentes los recojan; no acepta rutas de archivos desde el cliente.
- **People Curation API**: `DELETE /api/people/:id` permite a usuarios `ADMIN` descartar una persona detectada como falso positivo. La acción borra sus filas `faces` y la fila `persons`, pero no elimina assets ni miniaturas; `DELETE /api/people/orphans` se mantiene para limpieza de personas sin faces.

### 3.2. Frontend Application (React 19)
- **Gallery Grid**: Interfaz principal implementada como muro de media a ancho completo dentro del área principal, con visualización, filtrado con limpieza rápida, ordenación local, visor avanzado y selección masiva de assets. Los detalles profundos se consultan en el visor/modal, no en un inspector lateral fijo, para preservar densidad. `/api/assets`, `/api/media/originals`, `/api/media/storage` y `/static/users` requieren sesión válida. Los admins pueden reencolar análisis IA de la selección desde la toolbar masiva.
- **Admin Console**: Panel de eventos en tiempo real para visualizar los logs del Pipeline vía SSE.
- **Admin Users, Pipeline & People**: Paneles de administración para gestionar la importación, usuarios y personas detectadas. El panel de personas permite filtrar/ordenar identidades, abrir la media asociada, descartar falsos positivos de detección facial y reintentar la carga de archivos si falla una consulta puntual; el pipeline mantiene acciones agrupadas y señales visuales de recursos Ollama por tipo de modelo.

### 3.3. Test Assets Sandbox
A robust testing laboratory has been generated in `/srv/storage/ai-lab/Blacknails-Media-v3/test_assets/`, containing 25 edge-cases including perceptual hashes, face clustering subjects, and format variations.

### 3.4. Agent Skills Framework
Progressive Disclosure pattern applied to specialized agent skills (`frontend-ui-motion`, `server-architecture`, etc.).

### 3.5. Operations Documentation
- `README.md`: install, build/test, local run and first admin notes.
- `docs/deployment.md`: local, Docker and Nginx deployment checklist.
- `docs/security.md`: auth, roles, protected routes and safe operational defaults.

## 4. Pending Implementations & Next Steps
- **Conectar el Sandbox**: Ejecutar la carpeta `test_assets` contra el `ImportMediaUseCase` y verificar que todos los workers reaccionan correctamente.
- **Validación de la Detección Facial**: Comprobar que el script de Python de caras extrae correctamente los embeddings y los guarda en SQLite/Qdrant.
- **UI Polish**: Afinar los componentes visuales (Atropos) y el renderizado final de los metadatos.
