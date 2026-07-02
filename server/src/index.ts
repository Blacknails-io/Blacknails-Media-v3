import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './adapters/out/database/SqliteDatabase.js';
import { InMemoryEventBus } from './adapters/out/services/InMemoryEventBus.js';
import { OutboxDispatcher } from './adapters/out/database/OutboxDispatcher.js';
import { SqliteUnitOfWork } from './adapters/out/database/SqliteUnitOfWork.js';
import { SqliteAssetRepository } from './adapters/out/database/SqliteAssetRepository.js';
import { GetAssetsUseCase } from './application/use_cases/GetAssetsUseCase.js';
import { AssetController } from './adapters/in/http/AssetController.js';
import { Photo } from './domain/entities/Asset.js';
import { ImportMediaUseCase } from './application/use_cases/ImportMediaUseCase.js';
import { IndexMediaUseCase } from './application/use_cases/IndexMediaUseCase.js';
import { PurgeMediaUseCase } from './application/use_cases/PurgeMediaUseCase.js';
import { ImportTaskRunner } from './application/workers/ImportTaskRunner.js';
import { IndexTaskRunner } from './application/workers/IndexTaskRunner.js';
import { ThumbnailTaskRunner } from './application/workers/ThumbnailTaskRunner.js';
import { DescriptionTaskRunner } from './application/workers/DescriptionTaskRunner.js';
import { TagsTaskRunner } from './application/workers/TagsTaskRunner.js';
import { TitleTaskRunner } from './application/workers/TitleTaskRunner.js';
import { NsfwTaskRunner } from './application/workers/NsfwTaskRunner.js';
import { FaceTaskRunner } from './application/workers/FaceTaskRunner.js';
import { FaceClusterTaskRunner } from './application/workers/FaceClusterTaskRunner.js';
import { PipelineCoordinatorService } from './application/services/PipelineCoordinatorService.js';
import { PipelineController } from './adapters/in/http/PipelineController.js';
import { CommandLineMediaProcessingService } from './adapters/out/services/CommandLineMediaProcessingService.js';
import { OllamaService } from './adapters/out/services/OllamaService.js';
import { XmlSidecarService } from './adapters/out/services/XmlSidecarService.js';
import { PythonFaceDetectionService } from './adapters/out/services/PythonFaceDetectionService.js';
import { SqliteFaceRepository } from './adapters/out/database/SqliteFaceRepository.js';
import { SqliteEventRepository } from './adapters/out/database/SqliteEventRepository.js';
import { NoopVectorMemoryService } from './adapters/out/services/NoopVectorMemoryService.js';
import { QdrantVectorMemoryService } from './adapters/out/services/QdrantVectorMemoryService.js';
import { PeopleUseCase } from './application/use_cases/PeopleUseCase.js';
import { PeopleController } from './adapters/in/http/PeopleController.js';
import { requireAdmin, requireUser } from './adapters/in/http/auth.js';

// Módulo de Autenticación
import { SqliteUserRepository } from './adapters/out/database/SqliteUserRepository.js';
import { SqliteSessionRepository } from './adapters/out/database/SqliteSessionRepository.js';
import { PasswordHasher } from './adapters/out/security/PasswordHasher.js';
import { LoginUseCase } from './application/use_cases/LoginUseCase.js';
import { RegisterUseCase } from './application/use_cases/RegisterUseCase.js';
import { GetSessionUserUseCase } from './application/use_cases/GetSessionUserUseCase.js';
import { AuthController } from './adapters/in/http/AuthController.js';
import { ListUsersUseCase } from './application/use_cases/ListUsersUseCase.js';
import { AdminUsersController } from './adapters/in/http/AdminUsersController.js';
import { UpdateUserRoleUseCase } from './application/use_cases/UpdateUserRoleUseCase.js';
import { DeleteUserUseCase } from './application/use_cases/DeleteUserUseCase.js';
import { UpdateUserActiveUseCase } from './application/use_cases/UpdateUserActiveUseCase.js';
import { UpdateAvatarUseCase } from './application/use_cases/UpdateAvatarUseCase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DATABASE_PATH || './data/blacknails.db';

const REQUIRED_DIRECTORIES = [
  path.dirname(DB_PATH),
  './library/import',
  './library/originals',
  process.env.ARCHIVE_DIR || './library/archive',
  './library/storage',
  process.env.THUMBNAILS_DIR || './library/storage/thumbnails',
  process.env.SIDECARS_DIR || './library/storage/sidecars'
];

const IMPORT_DIR = process.env.IMPORT_DIR || './library/import';
const ORIGINALS_DIR = process.env.ORIGINALS_DIR || './library/originals';
const ARCHIVE_DIR = process.env.ARCHIVE_DIR || './library/archive';
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(path.dirname(ORIGINALS_DIR), 'storage');
const IMPORT_INTERVAL_MS = Number(process.env.IMPORT_INTERVAL_MS || 10000);
const INDEX_INTERVAL_MS = Number(process.env.INDEX_INTERVAL_MS || 15000);
const IMPORT_SCHEDULER_ENABLED = String(process.env.IMPORT_SCHEDULER_ENABLED || 'false') === 'true';
const INDEX_SCHEDULER_ENABLED = String(process.env.INDEX_SCHEDULER_ENABLED || 'false') === 'true';
const THUMBNAIL_INTERVAL_MS = Number(process.env.THUMBNAIL_INTERVAL_MS || 15000);
const DESCRIPTION_INTERVAL_MS = Number(process.env.DESCRIPTION_INTERVAL_MS || 30000);
const TAGS_INTERVAL_MS = Number(process.env.TAGS_INTERVAL_MS || 30000);
const TITLE_INTERVAL_MS = Number(process.env.TITLE_INTERVAL_MS || 30000);
const NSFW_INTERVAL_MS = Number(process.env.NSFW_INTERVAL_MS || 30000);
const FACE_INTERVAL_MS = Number(process.env.FACE_INTERVAL_MS || 45000);
const FACE_CLUSTER_INTERVAL_MS = Number(process.env.FACE_CLUSTER_INTERVAL_MS || 90000);
const THUMBNAILS_DIR = process.env.THUMBNAILS_DIR || './library/storage/thumbnails';
const SIDECARS_DIR = process.env.SIDECARS_DIR || './library/storage/sidecars';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'llava:7b';
const OLLAMA_TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || 'llama3.1:8b';
const OLLAMA_VISION_CONCURRENCY = Number(process.env.OLLAMA_VISION_CONCURRENCY || 2);
const OLLAMA_TEXT_CONCURRENCY = Number(process.env.OLLAMA_TEXT_CONCURRENCY || 2);
const QDRANT_URL = process.env.QDRANT_URL;
const NSFW_THRESHOLD = Number(process.env.NSFW_THRESHOLD || 0.6);
const FACE_PYTHON_BIN = process.env.FACE_PYTHON_BIN || 'python3';
const FACE_CLUSTER_THRESHOLD = Number(process.env.FACE_CLUSTER_THRESHOLD || 0.65);

app.use(express.json());

// 1. Inicialización de la base de datos
const db = initializeDatabase(DB_PATH);

// 2. Inicialización de Mensajería local (Hito 3)
const eventRepository = new SqliteEventRepository(db);
const eventBus = new InMemoryEventBus(async (event) => {
  await eventRepository.savePublished(event);
});
const outboxDispatcher = new OutboxDispatcher(db, eventBus, 1000); // Chequea cada 1 segundo

// Iniciamos el despachador de fondo
outboxDispatcher.start();

// Opcional: Nos suscribimos a cualquier evento de base de datos para confirmar que funciona
eventBus.subscribe('CONNECTED', (event) => {
  console.log(`[GlobalLogListener] [VERIFIED] Detectado evento en el bus: "${event.message}"`);
});

// 3. Inicialización del Módulo de Autenticación (IAM)
const userRepository = new SqliteUserRepository(db);
const sessionRepository = new SqliteSessionRepository(db);
const passwordHasher = new PasswordHasher();
const loginUseCase = new LoginUseCase(userRepository, sessionRepository, passwordHasher);
const registerUseCase = new RegisterUseCase(userRepository, passwordHasher);
const getSessionUserUseCase = new GetSessionUserUseCase(userRepository, sessionRepository);
const updateAvatarUseCase = new UpdateAvatarUseCase(userRepository, eventBus);
const authController = new AuthController(loginUseCase, registerUseCase, getSessionUserUseCase, eventBus, updateAvatarUseCase);
const listUsersUseCase = new ListUsersUseCase(userRepository);
const updateUserRoleUseCase = new UpdateUserRoleUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const updateUserActiveUseCase = new UpdateUserActiveUseCase(userRepository);
const adminUsersController = new AdminUsersController(getSessionUserUseCase, listUsersUseCase, updateUserRoleUseCase, deleteUserUseCase, updateUserActiveUseCase);

// Sincronización de usuarios por defecto (Seeding)
const seedUsers = async () => {
  try {
    const adminUserVar = process.env.ADMIN_USER;
    const adminPassVar = process.env.ADMIN_PASS;
    const partnerUserVar = process.env.PARTNER_USER;
    const partnerPassVar = process.env.PARTNER_PASS;

    if (adminUserVar && adminPassVar) {
      const existingAdmin = await userRepository.findByUsername(adminUserVar);
      if (!existingAdmin) {
        await registerUseCase.execute({
          username: adminUserVar,
          passwordRaw: adminPassVar,
          role: 'ADMIN'
        });
        console.log(`[Seed] Administrador '${adminUserVar}' sembrado con éxito.`);
      }
    } else {
      console.warn('[Seed] ADMIN_USER/ADMIN_PASS no definidos; no se sembrará administrador por defecto.');
    }

    if (partnerUserVar && partnerPassVar) {
      const existingPartner = await userRepository.findByUsername(partnerUserVar);
      if (!existingPartner) {
        await registerUseCase.execute({
          username: partnerUserVar,
          passwordRaw: partnerPassVar,
          role: 'VIEWER'
        });
        console.log(`[Seed] Partner '${partnerUserVar}' sembrado con éxito.`);
      }
    }
  } catch (err: any) {
    console.warn(`[Bootstrap] Error al sembrar los usuarios iniciales: ${err.message}`);
  }
};
seedUsers();

// 4. Configuración de API
const sharedUow = new SqliteUnitOfWork(db);
const assetRepository = new SqliteAssetRepository(db);
const mediaRepository = sharedUow.mediaFiles;
const getAssetsUseCase = new GetAssetsUseCase(assetRepository, mediaRepository, ORIGINALS_DIR, STORAGE_DIR);
const assetController = new AssetController(getAssetsUseCase);

const processingService = new CommandLineMediaProcessingService(ARCHIVE_DIR);
const ollamaService = new OllamaService(OLLAMA_URL, OLLAMA_VISION_MODEL, OLLAMA_TEXT_MODEL, OLLAMA_VISION_CONCURRENCY, OLLAMA_TEXT_CONCURRENCY);
const sidecarService = new XmlSidecarService(SIDECARS_DIR);
const faceDetectionService = new PythonFaceDetectionService(FACE_PYTHON_BIN);
const faceRepository = new SqliteFaceRepository(db);
const vectorMemoryService = QDRANT_URL ? new QdrantVectorMemoryService(QDRANT_URL) : new NoopVectorMemoryService();
const pipelineWorkerManager = new PipelineCoordinatorService(sharedUow, faceRepository, IMPORT_DIR, THUMBNAILS_DIR, ORIGINALS_DIR, eventBus);
const importMediaUseCase = new ImportMediaUseCase(sharedUow, eventBus, processingService, ORIGINALS_DIR, 'move');
const indexMediaUseCase = new IndexMediaUseCase(sharedUow, processingService, eventBus);
const purgeMediaUseCase = new PurgeMediaUseCase(sharedUow, faceRepository, eventBus);
const importWorker = new ImportTaskRunner(eventBus, importMediaUseCase, IMPORT_DIR, IMPORT_INTERVAL_MS);
const indexWorker = new IndexTaskRunner(eventBus, sharedUow, indexMediaUseCase, purgeMediaUseCase, INDEX_INTERVAL_MS);
const thumbnailWorker = new ThumbnailTaskRunner(eventBus, sharedUow, THUMBNAIL_INTERVAL_MS, THUMBNAILS_DIR);
const descriptionWorker = new DescriptionTaskRunner(eventBus, sharedUow, DESCRIPTION_INTERVAL_MS, ollamaService, sidecarService);
const tagsWorker = new TagsTaskRunner(eventBus, sharedUow, TAGS_INTERVAL_MS, ollamaService, sidecarService);
const titleWorker = new TitleTaskRunner(eventBus, sharedUow, TITLE_INTERVAL_MS, ollamaService, sidecarService);
const nsfwWorker = new NsfwTaskRunner(eventBus, sharedUow, NSFW_INTERVAL_MS, ollamaService, NSFW_THRESHOLD);
const faceWorker = new FaceTaskRunner(eventBus, sharedUow, FACE_INTERVAL_MS, faceRepository, faceDetectionService, vectorMemoryService, ollamaService);
const faceClusterWorker = new FaceClusterTaskRunner(eventBus, sharedUow, faceRepository, FACE_CLUSTER_INTERVAL_MS, FACE_CLUSTER_THRESHOLD);
const pipelineController = new PipelineController(getSessionUserUseCase, pipelineWorkerManager);
const peopleUseCase = new PeopleUseCase(faceRepository, assetRepository, getAssetsUseCase);
const peopleController = new PeopleController(peopleUseCase);

pipelineWorkerManager.register(importWorker);
pipelineWorkerManager.register(indexWorker);
pipelineWorkerManager.register(thumbnailWorker);
pipelineWorkerManager.register(descriptionWorker);
pipelineWorkerManager.register(tagsWorker);
pipelineWorkerManager.register(titleWorker);
pipelineWorkerManager.register(nsfwWorker);
pipelineWorkerManager.register(faceWorker);
pipelineWorkerManager.register(faceClusterWorker);

if (IMPORT_SCHEDULER_ENABLED) {
  void importWorker.start();
}

if (INDEX_SCHEDULER_ENABLED) {
  void indexWorker.start();
}

app.get('/api/assets', async (req, res) => {
  if (!(await requireUser(req, res, getSessionUserUseCase))) return;
  await assetController.getAssets(req, res);
});
app.get('/api/people', async (req, res) => {
  if (!(await requireUser(req, res, getSessionUserUseCase))) return;
  await peopleController.getPeople(req, res);
});
app.put('/api/people/:id', async (req, res) => {
  if (!(await requireAdmin(req, res, getSessionUserUseCase))) return;
  await peopleController.renamePerson(req, res);
});
app.get('/api/people/:id/assets', async (req, res) => {
  if (!(await requireUser(req, res, getSessionUserUseCase))) return;
  await peopleController.getPersonAssets(req, res);
});
app.delete('/api/people/orphans', async (req, res) => {
  if (!(await requireAdmin(req, res, getSessionUserUseCase))) return;
  await peopleController.deleteOrphanPersons(req, res);
});

app.use('/api/media/originals', async (req, res, next) => {
  if (!(await requireUser(req, res, getSessionUserUseCase))) return;
  next();
}, express.static(path.resolve(ORIGINALS_DIR)));
app.use('/api/media/storage', async (req, res, next) => {
  if (!(await requireUser(req, res, getSessionUserUseCase))) return;
  next();
}, express.static(path.resolve(STORAGE_DIR)));
app.use('/static/users', async (req, res, next) => {
  if (!(await requireUser(req, res, getSessionUserUseCase))) return;
  next();
}, express.static(path.resolve('./data/users')));
app.use('/api/auth', authController.router);
app.use('/api/admin', adminUsersController.router);
app.use('/api/admin/pipeline', pipelineController.router);

// Endpoint de Health Check
app.get('/health', async (req, res) => {
  const healthReport: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    services: {
      database: 'DOWN',
      storage: 'DOWN',
      eventBus: 'UP',
      outboxDispatcher: 'RUNNING'
    }
  };

  let hasErrors = false;

  // 1. Verificar Base de Datos SQLite (Consulta de lectura rápida de control)
  try {
    const result = db.prepare('SELECT 1 as ping').get() as { ping: number };
    if (result && result.ping === 1) {
      healthReport.services.database = 'UP';
    } else {
      throw new Error('SQLite no retornó el valor esperado');
    }
  } catch (error: any) {
    healthReport.services.database = `DOWN: ${error.message || error}`;
    hasErrors = true;
  }

  // 2. Verificar Sistema de Archivos (Directorios requeridos legibles/escribibles)
  try {
    for (const dir of REQUIRED_DIRECTORIES) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
    }
    healthReport.services.storage = 'UP';
  } catch (error: any) {
    healthReport.services.storage = `DOWN: ${error.message || error}`;
    hasErrors = true;
  }

  if (hasErrors) {
    healthReport.status = 'unhealthy';
    return res.status(503).json(healthReport);
  }

  return res.json(healthReport);
});

// Endpoint de prueba transaccional para el Hito 3: Simula la inserción de una foto y el outbox
app.post('/test/trigger-event', async (req, res) => {
  try {
    if (process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
      return res.status(404).json({ error: 'Endpoint de prueba desactivado.' });
    }

    if (!(await requireAdmin(req, res, getSessionUserUseCase))) return;

    const uow = new SqliteUnitOfWork(db);

    const testResult = await uow.runTransaction(async (tx) => {
      // Creamos una foto de prueba
      const testPhoto = new Photo({
        dateTaken: new Date().toISOString(),
        timezoneOffset: 'Z'
      });

      // Añadimos un evento de sistema en el aggregate root
      const eventId = `evt-${Math.random().toString(36).substring(2)}`;
      (testPhoto as any).addDomainEvent({
        id: eventId,
        type: 'SYSTEM',
        subsystem: 'DATABASE',
        action: 'CONNECTED',
        source: 'API_GATEWAY',
        message: `Prueba Hito 3: Foto indexada de forma transaccional. ID: ${testPhoto.id}`,
        occurredAt: new Date().toISOString()
      });

      // Guardamos en el repositorio
      await tx.assets.save(testPhoto);

      return {
        photoId: testPhoto.id,
        eventId
      };
    });

    res.json({
      status: 'ok',
      message: 'Transacción guardada en SQLite con éxito. El OutboxDispatcher la publicará en el bus en breve.',
      details: testResult
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || error
    });
  }
});

// Endpoint de Server-Sent Events (SSE) para streaming de eventos en tiempo real (Hito 4)
app.get('/api/events/stream', async (req, res) => {
  if (!(await requireUser(req, res, getSessionUserUseCase))) return;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Keep the stream alive without adding synthetic log events.
  res.write(': connected\n\n');

  const recentEvents = await eventRepository.getRecent(100);
  for (const event of recentEvents) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  // Escuchador que retransmite cualquier evento publicado en el bus
  const listener = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  eventBus.subscribe('*', listener);

  const heartbeat = setInterval(() => {
    if (res.writableEnded) return;
    res.write(': ping\n\n');
  }, 15000);

  // Limpieza al desconectarse el cliente
  req.on('close', () => {
    // Para desvincular el listener en InMemoryEventBus usando EventEmitter nativo
    clearInterval(heartbeat);
    (eventBus as any).emitter.off('*', listener);
    res.end();
  });
});

// ── MONOLITO ESTÁTICO: Servir el frontend React compilado en la raíz (Estilo PhotoPrism) ──
const CLIENT_DIST_PATH = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(CLIENT_DIST_PATH)) {
  app.use(express.static(CLIENT_DIST_PATH));
  
  // Soporte para React Router (cualquier ruta no API se redirige al index.html)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/test')) {
      return next();
    }
    res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'));
  });
  console.log(`[StaticHosting] Frontend monolítico detectado y activo desde ${CLIENT_DIST_PATH}`);
} else {
  console.log(`[StaticHosting] Carpeta frontend no encontrada en ${CLIENT_DIST_PATH} (modo desarrollo/API pura)`);
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Blacknails-Media-v3] Servidor ejecutándose en puerto ${PORT}`);
});
