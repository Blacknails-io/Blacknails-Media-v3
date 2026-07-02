# PhotoPrism: Workers, Scheduling & Synchronization (Deep Dive)

**Fecha**: 2026-07-02  
**Enfoque**: Cómo PhotoPrism implementa workers de fondo, scheduling, pools de concurrencia y mecanismos de sincronización/mutexes. Todo lo importante para entender su modelo de procesamiento asíncrono (indexación, visión IA, metadata, backups, sync, etc.).

Este documento complementa el reporte general en `photoprism-investigation.md`.

## 1. Arquitectura General de Workers

PhotoPrism separa claramente:
- **Workers programados** (cron-like vía gocron).
- **Workers periódicos por ticker**.
- **Workers automáticos** (triggered por WebDAV/upload).
- **Workers internos de procesamiento** (pools de goroutines dentro del core `photoprism`).
- **CLI/manual** que lanzan los mismos workers.

Todo se coordina desde:
- `internal/commands/start.go` → lanza `workers.Start(conf)` + `auto.Start(conf)`.
- `internal/workers/` → orquestación.
- `internal/mutex/` → control de concurrencia.
- `internal/photoprism/` → lógica pesada (index, faces, vision, etc.).
- `internal/ai/vision/` → modelos IA.

**Portal mode** (para clustering avanzado): deshabilita muchos workers de fondo.

## 2. Scheduler (gocron/v2)

Archivo clave: `internal/workers/scheduler.go` + `workers.go`

```go
// Inicialización
Scheduler, _ := gocron.NewScheduler(gocron.WithLocation(conf.DefaultTimezone()))
Jobs = make(map[string]gocron.Job)
```

**Creación de jobs** (`NewJob`):
- Usa `CronJob(schedule, false)` (no con segundos).
- `NewTask(function, params...)`
- **SingletonMode**: `gocron.WithSingletonMode(gocron.LimitModeWait)` → si ya está corriendo, **espera** en vez de solapar o saltar.

Jobs configurables:
- `backup` → `conf.BackupSchedule()` (default "daily")
- `index` → `conf.IndexSchedule()` (solo si no es portal)
- `vision` → `conf.VisionSchedule()` (solo si no es portal)

Inicio:
```go
Scheduler.Start()
```

Apagado:
```go
Scheduler.Shutdown()
```

**Ventaja**: jobs cron seguros contra solapamiento gracias al LimitModeWait.

## 3. Workers Principales (Orquestación)

`internal/workers/workers.go`

### Arranque (`Start`)
1. Configura gocron + registra jobs programados.
2. Lanza goroutine con `time.NewTicker(conf.WakeupInterval())` (default 15m):
   - `RunMeta(conf)`
   - `RunShare(conf)`
   - `RunSync(conf)`
3. Cada Run chequea su mutex específico antes de lanzar.

### Apagado (`Shutdown`)
- Envía a canal `stop`.
- Cancela mutexes específicos.
- Apaga scheduler.

### Funciones RunXXX
Ejemplo típico:
```go
func RunMeta(conf *config.Config) {
    if !mutex.WorkersRunning() {   // guardia global
        go func() {
            worker := NewMeta(conf)
            worker.Start(delay, interval, false)
        }()
    }
}
```

Similar para Share y Sync (con chequeo `!mutex.XXXWorker.Running()`).

## 4. Mutexes y Sincronización (El Corazón)

Paquete: `internal/mutex/`

**Objetivo**: Evitar que operaciones pesadas (indexación, visión, backup, modificación de archivos/DB) se solapen y causen corrupción o inconsistencias.

### Estructura principal (`resources.go` + `mutex.go`)
- `sync.Mutex` compartidos globales:
  - `Db`
  - `Index`
- Por-worker "actividades" o mutexes dedicados (ver `activities.go`, `activity.go`).

**Mutexes clave por worker** (patrón común):
- `IndexWorker`
- `VisionWorker`
- `MetaWorker`
- `ShareWorker`
- `SyncWorker`
- `BackupWorker`
- Otros (Face?, etc.)

**API típica de un worker mutex**:
```go
mutex.VisionWorker.Start()     // adquiere o falla si ya corriendo
defer mutex.VisionWorker.Stop()

if mutex.VisionWorker.Canceled() { return err }

mutex.VisionWorker.LastRun()   // para lógica de "solo si hace falta"
```

**Guardias frecuentes**:
- `if mutex.IndexWorker.Running() || mutex.BackupWorker.Running() { return }`
- `if err := mutex.VisionWorker.Start(); err != nil { return err }`
- Chequeos dentro de loops largos: `if mutex.XXXWorker.Canceled() { return }`

**Global**:
- `mutex.WorkersRunning()`
- `mutex.CancelAll()` (en shutdown)

Esto es **crítico** porque:
- Indexación toca muchos archivos + DB.
- Visión/IA puede ser lento y modificar metadata.
- Backup necesita consistencia.
- SQLite es especialmente sensible a concurrencia (PhotoPrism limita workers automáticamente).

## 5. Workers Específicos (Implementación)

### Index Worker (`workers/index.go`)
- `StartScheduled()` → llamado por cron.
- Chequea mutexes.
- Usa `get.Index()` (singleton de photoprism).
- Ejecuta:
  1. `ind.Start(indOpt)` (indexación real).
  2. Purge de archivos desaparecidos.
  3. Moments update.
- Publica eventos: `index.updating`, `index.completed`.
- Evita trabajo si no hay cambios (compara con lastRun/lastFound).

### Vision Worker (`workers/vision.go`)
Uno de los más complejos.

- `Start(filter, count, models, src, force, runType)`
- Adquiere `mutex.VisionWorker`.
- Filtra modelos según `vision.yml` + `VisionModelShouldRun(..., runType)` (on-schedule, newly-indexed, etc.).
- Busca fotos con `search.Photos(...)`.
- Loop por foto:
  - Carga MediaFile.
  - Detecta caras (si aplica).
  - Genera labels, captions, NSFW.
  - `photo.SaveVision()`.
  - Guarda sidecar YAML si está habilitado.
- Post-procesado si hubo cambios:
  - Face recognition (`photoprism.NewFaces().Start()`).
  - Moments.
  - `entity.UpdateCounts()`.
  - `query.UpdateCovers()`.
- Manejo de pánico + cancelación.
- Usa `vision.RunOnSchedule`, `RunNewlyIndexed`, etc.

### Meta Worker (`workers/meta.go`)
"Optimización de metadata".

- Ticker-driven (cada wakeup).
- Query `query.PhotosMetadataUpdate(...)`.
- Para fotos newly-indexed o que necesitan update:
  - Opcionalmente llama visión (labels/caption/faces) vía photoprism.
  - `photo.Optimize(...)` (stacking, estimates, etc.).
- Guarda si cambió.
- Al final: face rec + moments + counts + covers + flag hidden.
- Controlado por `entity.MetadataUpdateInterval`, `IndexUpdateInterval`.

### Otros
- **Backup**: Scheduled, usa `NewBackup().StartScheduled()`.
- **Share / Sync**: Para compartir y sincronización con servicios externos.

## 6. Auto Workers (WebDAV / Upload Triggers)

`internal/workers/auto/auto.go`

- Ticker cada minuto.
- `conf.AutoIndex()` (default 300s) y `conf.AutoImport()` (-1 = disabled).
- `mustIndex()` / `mustImport()`: chequean tiempo desde último evento.
- Llaman `Index()` o `Import()` (wrappers que usan los workers principales).
- `ResetIndex()` / `ResetImport()` para reiniciar timers.

Esto permite indexación/importación **automática** tras subir por WebDAV sin bloquear el upload.

## 7. Workers Internos del Core (`internal/photoprism/`)

Además de los workers de orquestación:

- **Pools de goroutines** reales para procesamiento paralelo de archivos.
  - Controlado por `PHOTOPRISM_INDEX_WORKERS` ("auto" deriva de cores; SQLite tiene cap ~4).
- En indexación:
  - Walk de directorio.
  - Worker pool para procesar MediaFiles (metadata, thumbs, visión, persist).
  - Mutexes compartidos para DB y archivos.
- Faces: `photoprism/faces*.go` + clustering tunable.
- Convert, thumbs, etc. usan FFmpeg/libvips en paralelo donde corresponde.

## 8. Configuración que Controla Todo Esto

(De config-options + código)

| Variable                        | Default     | Importancia |
|--------------------------------|-------------|-------------|
| `INDEX_WORKERS` / `WORKERS`    | auto        | Concurrencia real del pool de index |
| `INDEX_SCHEDULE`               | "" (off)    | Cron para index |
| `VISION_SCHEDULE`              | ""          | Cron para vision |
| `VISION_FILTER`                | public:true | Filtro para scheduled vision |
| `WAKEUP_INTERVAL`              | 15m         | Ticker de meta/share/sync |
| `AUTO_INDEX`                   | 300s        | Delay post-WebDAV para auto index |
| `AUTO_IMPORT`                  | -1 (off)    | Delay para auto import |
| `BACKUP_SCHEDULE`              | daily       | Cron backup |
| Feature flags `DISABLE_*`      | -           | Deshabilita workers pesados (faces, classification, etc.) |

También:
- `DETECT_NSFW`, vision models en `vision.yml` + `Run` modes.
- `SIDECAR_YAML`.

## 9. Patrones de Sincronización y Buenas Prácticas

1. **Defensa en profundidad con mutexes**:
   - Chequeo antes de arrancar + Start/Stop + chequeos de Canceled() dentro de loops.

2. **Singleton para scheduled** (LimitModeWait) + guardia de mutex.

3. **Eventos** (`internal/event`): publican progreso (`index.updating`, `completed`) para que el frontend muestre en tiempo real sin polling pesado.

4. **Graceful shutdown**:
   - Señales → auto.Shutdown + workers.Shutdown + mutex.CancelAll + cancel context + DB close.

5. **Diferencia DB**:
   - SQLite: workers limitados automáticamente. Menos concurrente.
   - MariaDB: permite más paralelismo.

6. **Evitar trabajo innecesario**:
   - Comparaciones lastRun / lastFound.
   - `ShouldGenerateLabels(force)`, `IsNewlyIndexed()`, etc.
   - Purge solo de lo necesario.

7. **Post-procesado centralizado**:
   - Después de cambios → faces + moments + counts + covers + sidecars.

8. **Separación clara**:
   - Workers de orquestación (no tocan archivos directamente).
   - Lógica en `photoprism.*` (reutilizable desde CLI y API).

## 10. Flujo Típico de Ejemplo

**Indexación programada**:
Scheduler → Index.StartScheduled() → chequeo mutex → photoprism.Index.Start() (pool workers) → eventos → purge → moments.

**Visión en background**:
Vision cron o meta → Vision.Start(..., RunOnSchedule) → filtra modelos → busca fotos → procesa una a una (con mutex) → SaveVision + sidecar → post faces/moments.

**Auto tras WebDAV**:
Upload/WebDAV → timer Auto → después de delay → Index o Import → workers normales.

## 11. Lecciones / Inspiración para Blacknails-Media-v3

- Usa un scheduler robusto (gocron o similar) + singleton mode.
- Mutex por tipo de worker + global + cancelación explícita.
- Separa "orquestador de workers" de "lógica de procesamiento".
- Pools limitados + config de workers (con caps según DB).
- Auto-triggers con delay configurable (importante para no indexar mientras se sube).
- Eventos pub/sub para UI reactiva.
- Post-procesado (moments, counts, covers) después de cambios.
- `vision.yml` + run modes para controlar cuándo corre cada modelo IA.
- Chequeos de "ya procesado" / "necesita" antes de trabajo caro.
- Sidecars + momentos como resultado de workers.

Esto explica por qué PhotoPrism escala bien y es confiable incluso con bibliotecas grandes.

---

**Archivos clave para seguir profundizando** (en el repo release):
- `internal/workers/{workers.go, scheduler.go, index.go, vision.go, meta.go, auto/auto.go}`
- `internal/mutex/{mutex.go, resources.go, activities.go, activity.go}`
- `internal/commands/start.go`
- `internal/photoprism/{index*.go, faces*.go, mediafile*.go}`
- `internal/config/` (métodos de schedules e intervals)
- `internal/ai/vision/` (model filtering y run types)

Fuentes: código fuente directo + docs + salidas de agentes de investigación.
