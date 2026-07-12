import assert from 'node:assert/strict';
import { copyFile, mkdir, readdir, access, readFile } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { join, dirname } from 'path';
import test from 'node:test';
import { createPipelineTestEnvironment } from '../helpers/test-environment.js';
import { createImageFixture, createTextFixture, createVideoFixture } from '../helpers/media-fixtures.js';
import { PipelineCoordinatorService } from '../../src/application/services/PipelineCoordinatorService.js';

async function copyIntoImport(source: string, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function listFilesRecursive(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

test('Importa una foto moviendo el original sin optimizar y crea sidecar al indexar', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    // GIVEN: Una instalación limpia, DB vacía, y un archivo en library/import/
    const sourceFixture = join(env.rootDir, 'fixtures', 'vacaciones_playa.jpg');
    const importTarget = join(env.importDir, 'vacaciones_playa.jpg');
    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget);
    
    assert.equal((await env.assetRepo.getAll()).length, 0, 'La BD debería empezar sin assets');

    // WHEN: El pipeline de importación e indexación procesa el archivo
    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    // THEN: La carpeta library/import/ queda vacía
    const importFiles = await listFilesRecursive(env.importDir);
    assert.equal(importFiles.length, 0, 'La carpeta import debería quedar vacía tras procesar');

    // Y: El archivo original se mueve a library/originals/ sin sufrir transformación (.webp)
    const importedFiles = await listFilesRecursive(env.originalsDir);
    assert.equal(importedFiles.filter((file) => file.endsWith('.jpg')).length, 1, 'Debe existir 1 original JPG');
    assert.equal(importedFiles.filter((file) => file.endsWith('.webp')).length, 0, 'No deben existir archivos convertidos a webp en originals');

    // Y: La base de datos contiene el Asset y el MediaFile enlazados con el nombre original
    const assets = await env.assetRepo.getAll();
    assert.equal(assets.length, 1, 'El asset debe haber sido indexado');
    assert.equal(assets[0].assetType, 'PHOTO');
    const linkedMediaFiles = await env.mediaRepo.getByAssetId(assets[0].id);
    assert.equal(linkedMediaFiles[0].originalFilename, 'vacaciones_playa.jpg', 'El nombre original debe respetarse');

    // Y: En library/storage/sidecars/ encontramos el archivo .meta.json correspondiente
    const sidecars = await listFilesRecursive(env.storageDir);
    const jsonFiles = sidecars.filter(f => f.endsWith('.meta.json'));
    assert.equal(jsonFiles.length, 1, 'Debe haberse generado 1 sidecar .meta.json');
    const sidecarContent = JSON.parse(await readFile(jsonFiles[0], 'utf8'));
    assert.equal(sidecarContent.title, 'vacaciones_playa.jpg', 'El JSON sidecar debe contener el título original');

  } finally {
    await env.cleanup();
  }
});

test('Importa un vídeo preservando su extensión original y creando el sidecar correspondiente', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    // GIVEN: Una instalación limpia y un archivo de vídeo en library/import/
    const sourceFixture = join(env.rootDir, 'fixtures', 'video_conejito_demo.mp4');
    const importTarget = join(env.importDir, 'video_conejito_demo.mp4');
    const fallbackDate = new Date('2023-07-04T10:20:30.000Z');
    await createVideoFixture(sourceFixture, fallbackDate);
    await copyIntoImport(sourceFixture, importTarget);

    assert.equal((await env.assetRepo.getAll()).length, 0, 'La BD debería empezar sin assets');

    // WHEN: El backend procesa la importación e indexación
    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    // THEN: La carpeta library/import/ queda vacía
    const importFiles = await listFilesRecursive(env.importDir);
    assert.equal(importFiles.length, 0, 'La carpeta import debería estar vacía');

    // Y: El vídeo se encuentra en library/originals sin haber sido transformado
    const importedFiles = await listFilesRecursive(env.originalsDir);
    assert.equal(importedFiles.filter((file) => file.endsWith('.mp4')).length, 1, 'Debe existir 1 original MP4');
    assert.equal(importedFiles.filter((file) => file.endsWith('.webp')).length, 0, 'No deben haber transformaciones');

    // Y: Existe el asset de tipo VIDEO en la BD con el nombre original
    const assets = await env.assetRepo.getAll();
    assert.equal(assets.length, 1, 'Debe existir 1 asset de tipo video');
    assert.equal(assets[0].assetType, 'VIDEO');
    const linkedMediaFiles = await env.mediaRepo.getByAssetId(assets[0].id);
    assert.equal(linkedMediaFiles[0].originalFilename, 'video_conejito_demo.mp4');

    // Y: Se genera correctamente su sidecar .meta.json envolvente
    const sidecars = await listFilesRecursive(env.storageDir);
    const jsonFiles = sidecars.filter(f => f.endsWith('.meta.json'));
    assert.equal(jsonFiles.length, 1, 'Debe haberse generado 1 sidecar .meta.json');
    const sidecarContent = JSON.parse(await readFile(jsonFiles[0], 'utf8'));
    assert.equal(sidecarContent.title, 'video_conejito_demo.mp4');

  } finally {
    await env.cleanup();
  }
});

test('Deduplica correctamente saltándose el archivo si el hash ya existe en la base de datos', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    // GIVEN: Una foto ya procesada (primer importTarget) y una copia duplicada en import (importTarget2)
    const sourceFixture = join(env.rootDir, 'fixtures', 'duplicate.jpg');
    const importTarget1 = join(env.importDir, 'duplicate1.jpg');
    const importTarget2 = join(env.importDir, 'duplicate2.jpg');
    
    await createImageFixture(sourceFixture, '2024:07:04 12:34:56');
    await copyIntoImport(sourceFixture, importTarget1);
    await env.importWorker.trigger(); // Importamos la primera vez

    assert.equal((await env.mediaRepo.getOrphans()).length, 1, 'Debe existir el registro inicial');

    // WHEN: Se introduce el archivo duplicado y el worker intenta procesarlo
    await copyIntoImport(sourceFixture, importTarget2);
    await env.importWorker.trigger();

    // THEN: El sistema desecha la copia por colisión de Hash y sólo queda 1 archivo en DB y disco
    const mediaFiles = await env.mediaRepo.getOrphans();
    assert.equal(mediaFiles.length, 1, 'No debe generarse un segundo registro si el hash es idéntico');
    
    const importFiles = await listFilesRecursive(env.importDir);
    assert.equal(importFiles.length, 0, 'La carpeta import debe haberse vaciado tras la purga del duplicado');

  } finally {
    await env.cleanup();
  }
});

test('Soporta el modo copy en lugar del movido estándar desde la carpeta import', async () => {
  const env = await createPipelineTestEnvironment({ action: 'copy' });
  try {
    // GIVEN: Un origen a importar en un entorno configurado con action=copy
    const sourceFixtureJpg = join(env.rootDir, 'fixtures', 'copy-mode-source.jpg');
    const sourceFixture = join(env.rootDir, 'fixtures', 'copy-mode.jpg');
    await createImageFixture(sourceFixtureJpg, '2024:07:04 12:34:56');
    await copyFile(sourceFixtureJpg, sourceFixture);
    
    // WHEN: El caso de uso se ejecuta directamente sobre el archivo origen
    const result = await env.importUseCase.execute(sourceFixture);

    // THEN: La operación finaliza con éxito
    assert.equal(result.imported, true, 'El archivo debe haber sido importado');
    
    // Y: El archivo de origen sigue existiendo sin borrarse
    assert.equal(await exists(sourceFixture), true, 'El archivo original NO debe haberse movido/borrado, sino copiado');
    assert.equal((await env.mediaRepo.getOrphans()).length, 1, 'Debe existir en base de datos');
  } finally {
    await env.cleanup();
  }
});

test('Rechaza y descarta archivos no soportados como los de texto', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    // GIVEN: Un archivo .txt introducido por error en la carpeta library/import/
    const sourceFixture = join(env.rootDir, 'fixtures', 'unsupported.txt');
    const importTarget = join(env.importDir, 'unsupported.txt');
    await createTextFixture(sourceFixture, 'plain text');
    await copyIntoImport(sourceFixture, importTarget);

    // WHEN: El worker intenta procesar el archivo
    await env.importWorker.trigger();

    // THEN: La BD ignora el archivo y el bus de eventos registra el rechazo
    assert.equal((await env.assetRepo.getAll()).length, 0, 'No debe existir ningún asset');
    assert.equal((await env.mediaRepo.getOrphans()).length, 0, 'No debe existir registro huerfano en media files');
    assert.ok(env.eventBus.events.some((event) => event.action === 'REJECTED'), 'Debe publicarse un evento REJECTED en el eventBus');
  } finally {
    await env.cleanup();
  }
});

test('Caso 4: Content mismatch - falla de forma segura ante un desajuste de contenido', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    // GIVEN: Un archivo de texto con una extensión engañosa (ej. .jpg) en la carpeta de importación
    const sourceFixture = join(env.rootDir, 'fixtures', 'mismatch.jpg');
    const importTarget = join(env.importDir, 'mismatch.jpg');
    await createTextFixture(sourceFixture, 'Esto no es una imagen en absoluto');
    await copyIntoImport(sourceFixture, importTarget);

    // WHEN: El pipeline procesa el archivo engañoso
    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    // THEN: El worker sobrevive sin indexarlo (0 assets)
    assert.equal((await env.assetRepo.getAll()).length, 0, 'No debe existir ningún asset');

    // Y: El MediaFile problemático ya no está pendiente para evitar loops infinitos
    const orphans = await env.mediaRepo.getOrphans();
    assert.equal(orphans.length, 0, 'El archivo corrupto no debe quedar atascado como huérfano');
  } finally {
    await env.cleanup();
  }
});

test('Caso 5: Metadata corruption - maneja archivos con metadatos corruptos o vacíos de forma segura', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    // GIVEN: Un archivo que dice ser imagen pero no tiene cabeceras o metadatos válidos
    const sourceFixture = join(env.rootDir, 'fixtures', 'corrupt.jpg');
    const importTarget = join(env.importDir, 'corrupt.jpg');
    // Simulamos un binario corrupto escribiendo basura
    await createTextFixture(sourceFixture, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00]).toString('utf-8'));
    await copyIntoImport(sourceFixture, importTarget);

    // WHEN: El pipeline intenta indexar el archivo
    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    // THEN: El backend rechaza el archivo
    assert.equal((await env.assetRepo.getAll()).length, 0, 'No debe crearse asset para archivo corrupto');

    // Y: No queda atascado en el bucle de huérfanos
    const orphans = await env.mediaRepo.getOrphans();
    assert.equal(orphans.length, 0, 'Debe ser removido o marcado como error, no quedar huérfano');
  } finally {
    await env.cleanup();
  }
});

