import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';

/**
 * PLANTILLA DE TEST DE REGRESIÓN (Bug Regression Test Template)
 * 
 * Este archivo demuestra cómo estructurar un test de regresión para reproducir
 * y prevenir bugs en el backend usando el framework nativo de Node.js.
 * 
 * Pautas clave:
 * 1. Utilizar una base de datos SQLite en memoria (como :memory:) para aislamiento.
 * 2. Reproducir el escenario exacto del fallo antes de aplicar la corrección.
 * 3. Ejecutar los tests con `npm run test` en el server.
 */

test.describe('Regression Test: [BUG-ID] / [Breve descripción del bug]', () => {
  let db: any;

  test.beforeEach(() => {
    // 1. Aislamiento de base de datos: Usamos una base de datos en memoria para el test.
    // Esto garantiza que el test sea limpio, determinista y no ensucie el desarrollo.
    db = new Database(':memory:');
    
    // Si tienes scripts de migración o inicialización, ejecútalos aquí:
    db.exec(`
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        hash TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL
      );
    `);
  });

  test.afterEach(() => {
    if (db) {
      db.close();
    }
  });

  test('debe evitar el error de duplicados cuando se importa el mismo asset dos veces', () => {
    // Escenario: El bug original causaba que si el hash ya existía,
    // la base de datos lanzaba una excepción fatal que no se controlaba.
    
    const insertAsset = db.prepare('INSERT INTO assets (id, filename, hash, status) VALUES (?, ?, ?, ?)');
    
    // Paso 1: Insertar el asset por primera vez
    insertAsset.run('id-1', 'photo.jpg', 'sha256-hash123', 'imported');
    
    // Paso 2: Intentar simular el flujo del bug (segunda inserción con el mismo hash)
    // En el código corregido, deberíamos controlar esto (p. ej., capturando el error o ignorándolo).
    const executeDuplicateAction = () => {
      try {
        // Ejecutamos la lógica que causaba el bug.
        // Aquí simulamos la corrección: si detectamos duplicado, no lanzamos error fatal.
        const hashExists = db.prepare('SELECT 1 FROM assets WHERE hash = ?').get('sha256-hash123');
        if (hashExists) {
          // Corrección aplicada: devolvemos el existente en lugar de intentar reinsertar
          return { status: 'already_imported', id: 'id-1' };
        }
        
        insertAsset.run('id-2', 'duplicate_photo.jpg', 'sha256-hash123', 'imported');
        return { status: 'inserted', id: 'id-2' };
      } catch (err: any) {
        throw new Error(`Excepción fatal no controlada: ${err.message}`);
      }
    };

    // Aserción del test de regresión:
    // Con la corrección, no debe lanzar error y debe devolver 'already_imported'
    const result = executeDuplicateAction();
    assert.equal(result.status, 'already_imported');
    assert.equal(result.id, 'id-1');
  });
});
