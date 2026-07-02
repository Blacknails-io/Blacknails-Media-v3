import Database from 'better-sqlite3';
import { IFaceRepository, FaceEmbeddingRow } from '../../../application/ports/out/IFaceRepository.js';
import { Face, Person, FaceBoundingBox } from '../../../domain/entities/Face.js';

export class SqliteFaceRepository implements IFaceRepository {
  constructor(private readonly db: Database.Database) {}

  public async saveFace(face: Face): Promise<void> {
    this.db.prepare(`
      INSERT INTO faces (id, photo_id, person_id, embedding_json, bbox_json, created_at, clustered_at)
      VALUES (@id, @photo_id, @person_id, @embedding_json, @bbox_json, @created_at, @clustered_at)
      ON CONFLICT(id) DO UPDATE SET
        photo_id=excluded.photo_id,
        person_id=excluded.person_id,
        embedding_json=excluded.embedding_json,
        bbox_json=excluded.bbox_json,
        created_at=excluded.created_at,
        clustered_at=excluded.clustered_at
    `).run({
      id: face.id,
      photo_id: face.photoId,
      person_id: face.personId ?? null,
      embedding_json: JSON.stringify(face.embedding),
      bbox_json: JSON.stringify(face.bbox),
      created_at: face.createdAt,
      clustered_at: face.clusteredAt ?? null
    });
  }

  public async getFacesForPhoto(photoId: string): Promise<Face[]> {
    const rows = this.db.prepare('SELECT * FROM faces WHERE photo_id = ?').all(photoId) as any[];
    return rows.map((row) => new Face({
      id: row.id,
      photoId: row.photo_id,
      personId: row.person_id || undefined,
      embedding: JSON.parse(row.embedding_json),
      bbox: JSON.parse(row.bbox_json),
      createdAt: row.created_at,
      clusteredAt: row.clustered_at
    }));
  }

  public async deleteFacesForPhoto(photoId: string): Promise<void> {
    this.db.prepare('DELETE FROM faces WHERE photo_id = ?').run(photoId);
  }

  public async getAllEmbeddings(): Promise<FaceEmbeddingRow[]> {
    const rows = this.db.prepare(`
      SELECT f.id as face_id, f.photo_id, f.embedding_json, p.name as assigned_name
      FROM faces f
      LEFT JOIN persons p ON f.person_id = p.id
    `).all() as any[];
    return rows.map((row) => ({
      faceId: row.face_id,
      photoId: row.photo_id,
      embedding: JSON.parse(row.embedding_json),
      assignedName: row.assigned_name || null
    }));
  }

  public async savePerson(person: Person): Promise<void> {
    this.db.prepare(`
      INSERT INTO persons (id, label, name, created_at)
      VALUES (@id, @label, @name, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        label=excluded.label,
        name=excluded.name,
        created_at=excluded.created_at
    `).run({
      id: person.id,
      label: person.label,
      name: person.name ?? null,
      created_at: person.createdAt
    });
  }

  public async getUnclusteredFacesCount(): Promise<number> {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM faces WHERE clustered_at IS NULL').get() as { count: number };
    return row ? row.count : 0;
  }

  public async resetClustering(): Promise<void> {
    this.db.prepare('UPDATE faces SET person_id = NULL, clustered_at = NULL').run();
    this.db.prepare('DELETE FROM persons').run();
  }

  public async updatePersonId(faceId: string, personId: string): Promise<void> {
    this.db.prepare('UPDATE faces SET person_id = ?, clustered_at = ? WHERE id = ?').run(personId, new Date().toISOString(), faceId);
  }

  public async getAllPersonsWithStats(): Promise<Array<{
    id: string;
    label: string;
    name?: string;
    faceCount: number;
    bbox: FaceBoundingBox;
    thumbnailUrl: string;
  }>> {
    const rows = this.db.prepare(`
      SELECT p.id, p.label, p.name, COUNT(f.id) as face_count
      FROM persons p
      JOIN faces f ON f.person_id = p.id
      GROUP BY p.id
      ORDER BY face_count DESC, p.created_at DESC
    `).all() as any[];

    const result = [];
    for (const r of rows) {
      const faceRow = this.db.prepare(`
        SELECT f.bbox_json, a.thumbnail_path, a.ai_thumbnail_path
        FROM faces f
        JOIN assets a ON f.photo_id = a.id
        WHERE f.person_id = ?
        LIMIT 1
      `).get(r.id) as any;

      if (faceRow) {
        const path = faceRow.ai_thumbnail_path || faceRow.thumbnail_path || '';
        result.push({
          id: r.id,
          label: r.label,
          name: r.name || undefined,
          faceCount: r.face_count,
          bbox: JSON.parse(faceRow.bbox_json),
          thumbnailUrl: path
        });
      }
    }
    return result;
  }

  public async updatePersonName(personId: string, name: string): Promise<void> {
    this.db.prepare('UPDATE persons SET name = ? WHERE id = ?').run(name, personId);
  }

  public async getPersonById(personId: string): Promise<Person | null> {
    const row = this.db.prepare('SELECT * FROM persons WHERE id = ?').get(personId) as any;
    if (!row) return null;
    return new Person({
      id: row.id,
      label: row.label,
      name: row.name || undefined,
      createdAt: row.created_at
    });
  }

  public async getPersonByName(name: string): Promise<Person | null> {
    const row = this.db.prepare('SELECT * FROM persons WHERE LOWER(name) = LOWER(?)').get(name) as any;
    if (!row) return null;
    return new Person({
      id: row.id,
      label: row.label,
      name: row.name || undefined,
      createdAt: row.created_at
    });
  }

  public async mergePersons(sourcePersonId: string, targetPersonId: string): Promise<void> {
    const transaction = this.db.transaction(() => {
      this.db.prepare('UPDATE faces SET person_id = ? WHERE person_id = ?').run(targetPersonId, sourcePersonId);
      this.db.prepare('DELETE FROM persons WHERE id = ?').run(sourcePersonId);
    });
    transaction();
  }

  public async deletePersonAndFaces(personId: string): Promise<number> {
    const transaction = this.db.transaction(() => {
      const info = this.db.prepare('DELETE FROM faces WHERE person_id = ?').run(personId);
      this.db.prepare('DELETE FROM persons WHERE id = ?').run(personId);
      return info.changes;
    });
    return transaction();
  }

  public async deleteOrphanPersons(): Promise<number> {
    const info = this.db.prepare(`
      DELETE FROM persons
      WHERE id NOT IN (
        SELECT DISTINCT person_id
        FROM faces
        WHERE person_id IS NOT NULL
      )
    `).run();
    return info.changes;
  }
}

