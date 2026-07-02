import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export function initializeDatabase(dbPath: string): Database.Database {
  // Aseguramos que la carpeta del directorio del dbPath exista físicamente
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Optimizaciones de rendimiento recomendadas para SQLite (WAL Mode)
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  // Inicialización de Tablas SQL (Hito 0 e Hito 2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      asset_type TEXT NOT NULL, -- 'PHOTO' o 'VIDEO'
      date_taken TEXT NOT NULL,
      timezone_offset TEXT NOT NULL,
      
      -- Metadata óptica (ValueObjects)
      width INTEGER,
      height INTEGER,
      
      -- Metadata de Video
      duration_seconds REAL,
      framerate REAL,
      video_codec TEXT,
      audio_codec TEXT,
      
      -- Ubicación GPS (ValueObjects)
      latitude REAL,
      longitude REAL,
      altitude REAL,
      country TEXT,
      city TEXT,
      
      -- Exif y AI (Dumps JSON planos en BD)
      exif_json TEXT,
      
      -- Pipeline State (Timestamps directos)
      indexed_at TEXT,
      ai_processed_at TEXT,
      thumbnail_path TEXT,
      ai_thumbnail_path TEXT,
      video_preview_path TEXT,
      ai_description TEXT,
      tags_json TEXT,
      title TEXT,
      sidecar_path TEXT,
      is_nsfw INTEGER,
      nsfw_reason TEXT,
      tag_nsfw_scores_json TEXT,
      described_at TEXT,
      tagged_at TEXT,
      titled_at TEXT,
      faces_processed_at TEXT,
      nsfw_processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS media_files (
      id TEXT PRIMARY KEY,
      asset_id TEXT,
      role TEXT NOT NULL, -- 'ORIGINAL', 'THUMBNAIL', 'PREVIEW', 'SIDECAR'
      current_path TEXT UNIQUE NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      file_hash TEXT NOT NULL,
      extension TEXT NOT NULL,
      created_at TEXT NOT NULL,
      
      -- Campos específicos del archivo
      source_device TEXT,
      import_date TEXT,
      width INTEGER,
      height INTEGER,
      webp_quality INTEGER,
      fps INTEGER,
      loop_duration_ms INTEGER,
      schema_version TEXT,
      xml_namespace TEXT,
      
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      subsystem TEXT,
      action TEXT NOT NULL,
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      occurredAt TEXT NOT NULL,
      worker_name TEXT,
      item_id TEXT,
      status TEXT,
      process_name TEXT,
      entity_type TEXT,
      entity_id TEXT,
      published INTEGER DEFAULT 0 -- 0 = false, 1 = true (para outbox)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_assets_date_taken ON assets(date_taken);
    CREATE INDEX IF NOT EXISTS idx_media_files_asset_id ON media_files(asset_id);
    CREATE INDEX IF NOT EXISTS idx_system_events_published ON system_events(published);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS faces (
      id TEXT PRIMARY KEY,
      photo_id TEXT NOT NULL,
      person_id TEXT,
      embedding_json TEXT NOT NULL,
      bbox_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      clustered_at TEXT,
      FOREIGN KEY (photo_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS worker_executions (
      id TEXT PRIMARY KEY,
      runner TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      finishedAt TEXT,
      status TEXT NOT NULL,
      totalItems INTEGER NOT NULL,
      processed INTEGER NOT NULL,
      failed INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_faces_photo_id ON faces(photo_id);
    CREATE INDEX IF NOT EXISTS idx_faces_person_id ON faces(person_id);
  `);

  const userColumns = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
  if (!userColumns.some((column) => column.name === 'is_active')) {
    db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;`);
  }

  const eventColumns = db.prepare(`PRAGMA table_info(system_events)`).all() as Array<{ name: string }>;
  const eventMigrations: Record<string, string> = {
    worker_name: 'ALTER TABLE system_events ADD COLUMN worker_name TEXT;',
    item_id: 'ALTER TABLE system_events ADD COLUMN item_id TEXT;',
    status: 'ALTER TABLE system_events ADD COLUMN status TEXT;',
    process_name: 'ALTER TABLE system_events ADD COLUMN process_name TEXT;',
    entity_type: 'ALTER TABLE system_events ADD COLUMN entity_type TEXT;',
    entity_id: 'ALTER TABLE system_events ADD COLUMN entity_id TEXT;'
  };
  for (const [column, statement] of Object.entries(eventMigrations)) {
    if (!eventColumns.some((existing) => existing.name === column)) {
      db.exec(statement);
    }
  }

  const assetColumns = db.prepare(`PRAGMA table_info(assets)`).all() as Array<{ name: string }>;
  const assetMigrations: Record<string, string> = {
    thumbnail_path: 'ALTER TABLE assets ADD COLUMN thumbnail_path TEXT;',
    ai_thumbnail_path: 'ALTER TABLE assets ADD COLUMN ai_thumbnail_path TEXT;',
    video_preview_path: 'ALTER TABLE assets ADD COLUMN video_preview_path TEXT;',
    ai_description: 'ALTER TABLE assets ADD COLUMN ai_description TEXT;',
    tags_json: 'ALTER TABLE assets ADD COLUMN tags_json TEXT;',
    title: 'ALTER TABLE assets ADD COLUMN title TEXT;',
    sidecar_path: 'ALTER TABLE assets ADD COLUMN sidecar_path TEXT;',
    is_nsfw: 'ALTER TABLE assets ADD COLUMN is_nsfw INTEGER;',
    nsfw_reason: 'ALTER TABLE assets ADD COLUMN nsfw_reason TEXT;',
    tag_nsfw_scores_json: 'ALTER TABLE assets ADD COLUMN tag_nsfw_scores_json TEXT;',
    described_at: 'ALTER TABLE assets ADD COLUMN described_at TEXT;',
    tagged_at: 'ALTER TABLE assets ADD COLUMN tagged_at TEXT;',
    titled_at: 'ALTER TABLE assets ADD COLUMN titled_at TEXT;',
    faces_processed_at: 'ALTER TABLE assets ADD COLUMN faces_processed_at TEXT;',
    nsfw_processed_at: 'ALTER TABLE assets ADD COLUMN nsfw_processed_at TEXT;'
  };
  for (const [column, statement] of Object.entries(assetMigrations)) {
    if (!assetColumns.some((existing) => existing.name === column)) {
      db.exec(statement);
    }
  }

  const faceTables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('faces', 'persons')`).all() as Array<{ name: string }>;
  const hasFaces = faceTables.some((row) => row.name === 'faces');
  const hasPersons = faceTables.some((row) => row.name === 'persons');
  if (!hasFaces) {
    db.exec(`
      CREATE TABLE faces (
        id TEXT PRIMARY KEY,
        photo_id TEXT NOT NULL,
        person_id TEXT,
        embedding_json TEXT NOT NULL,
        bbox_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (photo_id) REFERENCES assets(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_faces_photo_id ON faces(photo_id);
      CREATE INDEX IF NOT EXISTS idx_faces_person_id ON faces(person_id);
    `);
  }
  if (!hasPersons) {
    db.exec(`
      CREATE TABLE persons (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        name TEXT,
        created_at TEXT NOT NULL
      );
    `);
  }

  console.log(`[SqliteDatabase] Inicializado correctamente en ${dbPath}`);
  return db;
}
