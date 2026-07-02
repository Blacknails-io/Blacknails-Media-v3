# Blacknails Media v3 - Plan de Validacion Alpha Avanzada

## Contexto Real

Proyecto: **Blacknails Media v3**

Ruta remota operativa:

```bash
/srv/storage/ai-lab/Blacknails-Media-v3
```

Repositorio:

```text
https://github.com/Blacknails-io/Blacknails-Media-v3
```

Blacknails Media v3 no es una app desde cero. Es una biblioteca multimedia privada, autoalojada y local-first, inspirada en PhotoPrism, con una base tecnica ya avanzada:

- Monorepo npm con workspaces `shared`, `server`, `client`.
- Backend Node/Express con arquitectura hexagonal.
- SQLite con `better-sqlite3`.
- Pipeline asyncrono de importacion, indexado, thumbnails e IA.
- Integracion local con Ollama.
- Flujo de personas/caras.
- SSE protegido para eventos de pipeline.
- UI React 19 con direccion prosumer/photo-centric.
- Despliegue detras de Nginx en `https://media.blacknails.io`.

La meta no es "hacer una alpha", sino **validar, endurecer y pulir una alpha avanzada para uso personal real**.

## Documentacion Fuente

Antes de proponer cambios, leer:

```text
README.md
docs/NORTH_STAR.md
docs/FEATURES_AND_ARCHITECTURE.md
docs/security.md
docs/deployment.md
docs/design/prosumer_ui_technical_spec.md
docs/design/ux_design_proposal_v2.md
docs/design/layout_specifications.md
```

Principios clave de `NORTH_STAR.md`:

- Privacidad absoluta: todo local.
- No SaaS generico.
- No upload web principal: ingestion por filesystem en `library/import`.
- UI prosumer tipo PhotoPrism: potente, limpia y centrada en la media.
- IA local para tags, descripciones, NSFW y caras.

## Estado Actual Confirmado

### Backend

Implementado:

- Arquitectura hexagonal.
- Event bus y outbox dispatcher.
- Workers/task runners:
  - Import
  - Index
  - Thumbnail
  - Description
  - Tags
  - Title
  - Nsfw
  - Face
  - FaceCluster
- `OllamaService` con text/vision y concurrencia configurable.
- `PythonFaceDetectionService`.
- `QdrantVectorMemoryService`.
- Auth con sesiones SQLite.
- `Authorization: Bearer <token>` para APIs.
- Cookie `bn_session` `HttpOnly`/`SameSite=Lax` para media, avatares y SSE.
- Roles runtime:
  - `ADMIN`
  - `STANDARD`
  - `VIEWER`
- SSE protegido.
- Reprocess API admin:
  - `POST /api/admin/assets/reprocess`
- People curation:
  - `DELETE /api/people/:id`
  - `DELETE /api/people/orphans`

### Frontend

Implementado:

- Gallery grid.
- Viewer/modal avanzado.
- Filtros y ordenacion local.
- Seleccion masiva.
- Admin console con eventos SSE.
- Admin users.
- Admin pipeline.
- Admin people.
- Acciones de reencolado IA para admins.

### Seguridad Ya Encarrilada

Confirmado por documentacion:

- `/health` publico.
- `/api/auth/login` publico.
- `/api/auth/register` bloqueado salvo `ALLOW_PUBLIC_REGISTRATION=true`.
- Media/originals/storage/static users protegidos.
- `/api/events/stream` protegido.
- `/api/people*` protegido.
- `/api/admin*` protegido.
- No exponer `data/`, `library/`, thumbnails, sidecars ni originales directamente por Nginx.

### Deployment

Produccion:

- El backend sirve API y `client/dist` desde el mismo origen si el cliente esta construido.
- Docker compose expone:
  - contenedor `blacknails-media-v3-api`
  - container port `3000`
  - host port `3003`
- Nginx debe proxyar a `http://127.0.0.1:3003` o equivalente desde el host.
- HTTPS recomendado con `COOKIE_SECURE=true`.

## Reglas de Trabajo para Agentes

Antes de editar:

```bash
cd /srv/storage/ai-lab/Blacknails-Media-v3
git status --short --branch
```

Normas:

- No borrar datos, media, DBs, thumbnails, sidecars ni carpetas de libreria sin autorizacion explicita.
- No revertir cambios ajenos.
- Si el working tree esta sucio, asumir que hay trabajo en curso y pedir/mostrar contexto antes de tocar esas zonas.
- Cambios pequenos, revisables y verificables.
- No commitear sin mostrar `git diff`, salvo instruccion explicita.
- Ejecutar build/test relevante al final.
- Respetar la arquitectura hexagonal: dominio/aplicacion/adaptadores/puertos.
- Respetar la vision PhotoPrism/prosumer: media primero, UI potente pero discreta.

## Estado de Working Tree al Revisar

Se detectaron cambios en curso en remoto en multiples archivos:

```text
.env.example
client/src/components/AdminPeoplePanel.tsx
client/tests/e2e/people-panel.spec.ts
client/tests/e2e/support/adminMocks.ts
docker-compose.yml
docs/FEATURES_AND_ARCHITECTURE.md
server/src/adapters/in/http/PeopleController.ts
server/src/adapters/out/database/SqliteFaceRepository.ts
server/src/adapters/out/services/OllamaService.ts
server/src/application/ports/in/IPeopleUseCase.ts
server/src/application/ports/out/IFaceRepository.ts
server/src/application/ports/out/IOllamaService.ts
server/src/application/use_cases/PeopleUseCase.ts
server/src/application/workers/BaseAssetWorker.ts
server/src/application/workers/DescriptionTaskRunner.ts
server/src/application/workers/FaceTaskRunner.ts
server/src/application/workers/NsfwTaskRunner.ts
server/src/application/workers/TagsTaskRunner.ts
server/src/application/workers/TitleTaskRunner.ts
server/src/index.ts
server/tests/OllamaService.test.ts
server/tests/integration/face-worker.test.ts
server/tests/integration/people-endpoints.test.ts
server/tests/integration/pipeline-per-item-events.test.ts
```

Tambien habia sin trackear:

```text
docs/design/pipeline-flow-overview.svg
ollama/
outputs/
```

Antes de cualquier cambio nuevo, entender si estos cambios son del agente remoto, de Ivan o de una tarea activa.

## Plan Priorizado

### Fase 1 - Auditoria de Estado y No Regresion

Objetivo: saber exactamente que funciona ahora.

Tareas:

- Revisar `git diff` actual por bloques.
- Clasificar cambios actuales:
  - UI
  - backend
  - Ollama/concurrencia
  - people/faces
  - tests
  - docs/deployment
- Ejecutar builds:

```bash
npm run build --workspace=@blacknails/shared
npm run build --workspace=blacknails-media-v3-server
npm run build --workspace=blacknails-media-v3-client
```

- Ejecutar tests de servidor:

```bash
npm run test --workspace=blacknails-media-v3-server
```

- Si hay E2E Playwright preparados y entorno disponible, ejecutar solo los relevantes a people/gallery/login.

Criterio de salida:

- Sabemos que cambios hay.
- Sabemos que rompe y que no.
- No se mezclan mejoras visuales con cambios de pipeline sin razon.

### Fase 2 - Seguridad Operativa

Objetivo: app personal expuesta con riesgos controlados.

Checklist:

- Confirmar `COOKIE_SECURE=true` en produccion tras Nginx HTTPS.
- Confirmar `ALLOW_PUBLIC_REGISTRATION=false`.
- Confirmar `ENABLE_TEST_ENDPOINTS=false`.
- Confirmar que media/originals/storage/static users pasan por backend autenticado.
- Confirmar que SSE no acepta token por query string.
- Confirmar permisos `ADMIN` para mutaciones:
  - users
  - pipeline
  - reprocess
  - people mutations/delete/orphans
- Confirmar que `VIEWER` solo ve/lee lo permitido.

### Fase 3 - Validacion del Pipeline Real

Objetivo: comprobar ingestion y procesamiento de assets reales/sandbox.

Tareas:

- Usar `test_assets/` si existe y esta documentado.
- Verificar import desde `library/import`.
- Confirmar que los workers procesan 1 asset por ejecucion y no bloquean la app.
- Verificar eventos SSE durante pipeline.
- Verificar thumbnails.
- Verificar descriptions/tags/title/nsfw/faces segun Ollama disponible.
- Verificar errores cuando Ollama no esta disponible.

Criterio de salida:

- Se puede meter media en `library/import`.
- La UI muestra progreso/estado.
- Los resultados aparecen en galeria/modal/people.

### Fase 4 - UX Prosumer y Login

Objetivo: que la app se sienta premium y usable sin contradecir la documentacion.

Linea visual:

- PhotoPrism/prosumer, media protagonista.
- Neon/gloss/cyberpunk solo como capa de identidad, sin teñir ni tapar las fotos.
- Sidebar/admin presente pero discreta.
- Grid denso, limpio, sin inspector lateral fijo si el spec dice que el modal lleva metadata profunda.
- Modal/lightbox potente para EXIF, tags, descripcion IA, caras y acciones.

Login:

- Compacto.
- Responsive.
- Boton visible sin hover.
- Errores sin saltos de layout.
- Contraste claro.

Gallery:

- Sin "upload" principal.
- Filtros utiles y claros.
- Estados vacios/cargando/error.
- Badges de IA y metadata solo donde ayuden.

### Fase 5 - People/Faces

Objetivo: validar una de las areas diferenciales del producto.

Tareas:

- Revisar endpoints people.
- Revisar `AdminPeoplePanel`.
- Verificar filtrado/ordenacion.
- Verificar abrir media asociada.
- Verificar descartar falso positivo.
- Verificar orphan cleanup solo admin.
- Verificar tests:

```bash
server/tests/integration/people-endpoints.test.ts
client/tests/e2e/people-panel.spec.ts
```

### Fase 6 - Documentacion Final de Operacion

Objetivo: que Ivan pueda operar el proyecto sin depender de memoria.

Actualizar:

- `README.md`
- `docs/deployment.md`
- `docs/security.md`
- `docs/FEATURES_AND_ARCHITECTURE.md`

Incluir:

- Como arrancar.
- Como reconstruir.
- Como verificar Nginx.
- Como crear admin.
- Como importar media.
- Que hace Ollama y como configurarlo.
- Como diagnosticar pipeline.

## Primer Encargo Recomendado para el Codex Remoto

```text
Trabaja en /srv/storage/ai-lab/Blacknails-Media-v3.
Lee primero:
- README.md
- docs/NORTH_STAR.md
- docs/FEATURES_AND_ARCHITECTURE.md
- docs/security.md
- docs/deployment.md
- docs/design/prosumer_ui_technical_spec.md
- docs/design/ux_design_proposal_v2.md
- docs/design/layout_specifications.md

Antes de editar ejecuta:
git status --short --branch

No borres datos/media/DB/thumbnails/sidecars.
No reviertas cambios ajenos.

Objetivo inmediato: auditar el estado actual avanzado.
1. Resume que cambios hay ahora en git diff, agrupados por area.
2. Ejecuta los builds de shared/server/client.
3. Ejecuta tests de servidor si el entorno lo permite.
4. Detecta riesgos o regresiones.
5. No hagas cambios ni commits todavia.

Entrega:
- resumen corto
- comandos ejecutados y resultado
- riesgos encontrados
- recomendacion del siguiente parche pequeno
```

## Criterio de Aceptacion General

Una tarea solo esta lista si:

- Respeta `NORTH_STAR.md`.
- No rompe arquitectura hexagonal.
- Build/test relevante pasa o se explica claramente por que no.
- El diff es pequeño o esta bien separado.
- No toca datos/media.
- No degrada privacidad ni auth.
- Mejora una experiencia real: importar, ver, organizar, procesar o administrar media.

