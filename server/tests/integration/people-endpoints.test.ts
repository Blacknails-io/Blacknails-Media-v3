import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'path';
import { createPipelineTestEnvironment } from '../helpers/test-environment.js';
import { SqliteFaceRepository } from '../../src/adapters/out/database/SqliteFaceRepository.js';
import { Face, Person } from '../../src/domain/entities/Face.js';
import { Photo as MediaPhoto } from '../../src/domain/entities/Asset.js';
import { PeopleUseCase } from '../../src/application/use_cases/PeopleUseCase.js';
import { GetAssetsUseCase } from '../../src/application/use_cases/GetAssetsUseCase.js';
import { SqliteMediaFileRepository } from '../../src/adapters/out/database/SqliteMediaFileRepository.js';

describe('People and Face Clustering Endpoints', () => {
  it('should successfully save persons, query stats, rename them, and fetch assets', async () => {
    const env = await createPipelineTestEnvironment();
    try {
      const faceRepo = new SqliteFaceRepository(env.db);
      const mediaRepo = new SqliteMediaFileRepository(env.db);
      const getAssetsUseCase = new GetAssetsUseCase(env.assetRepo, mediaRepo, env.originalsDir, env.storageDir);
      const peopleUseCase = new PeopleUseCase(faceRepo, env.assetRepo, getAssetsUseCase);

      // 1. Create a dummy photo asset
      const asset = new MediaPhoto({
        id: 'asset-1',
        dateTaken: new Date().toISOString(),
        timezoneOffset: '+00:00'
      });
      const dummyThumb = path.join(env.storageDir, 'ai-thumb-1.jpg');
      asset.thumbnailPath = dummyThumb;
      asset.aiThumbnailPath = dummyThumb;
      await env.assetRepo.save(asset);

      // 2. Create person and faces
      const person = new Person({
        id: 'person-1',
        label: 'Person A',
        name: 'Initial Name'
      });
      await faceRepo.savePerson(person);

      const face = new Face({
        id: 'face-1',
        photoId: 'asset-1',
        personId: 'person-1',
        embedding: Array(48).fill(0.125),
        bbox: { x: 10, y: 20, width: 30, height: 40 }
      });
      await faceRepo.saveFace(face);

      // 3. Test use case getPeople
      const people = await peopleUseCase.getPeople();
      assert.equal(people.length, 1);
      assert.equal(people[0].id, 'person-1');
      assert.equal(people[0].name, 'Initial Name');
      assert.equal(people[0].faceCount, 1);
      assert.equal(people[0].thumbnailUrl, '/api/media/storage/ai-thumb-1.jpg');

      // 4. Test rename
      await peopleUseCase.renamePerson('person-1', 'Renamed Name');
      const updatedPerson = await faceRepo.getPersonById('person-1');
      assert.equal(updatedPerson?.name, 'Renamed Name');

      // 5. Test get assets for person
      const assets = await peopleUseCase.getPersonAssets('person-1');
      assert.equal(assets.length, 1);
      assert.equal(assets[0].id, 'asset-1');
    } finally {
      await env.cleanup();
    }
  });

  it('should successfully merge two persons when renaming to an existing name', async () => {
    const env = await createPipelineTestEnvironment();
    try {
      const faceRepo = new SqliteFaceRepository(env.db);
      const mediaRepo = new SqliteMediaFileRepository(env.db);
      const getAssetsUseCase = new GetAssetsUseCase(env.assetRepo, mediaRepo, env.originalsDir, env.storageDir);
      const peopleUseCase = new PeopleUseCase(faceRepo, env.assetRepo, getAssetsUseCase);

      const asset = new MediaPhoto({
        id: 'asset-1',
        dateTaken: new Date().toISOString(),
        timezoneOffset: '+00:00'
      });
      await env.assetRepo.save(asset);

      const person1 = new Person({
        id: 'person-1',
        label: 'Person A',
        name: 'Alex'
      });
      await faceRepo.savePerson(person1);

      const person2 = new Person({
        id: 'person-2',
        label: 'Person B',
        name: 'Bob'
      });
      await faceRepo.savePerson(person2);

      const face = new Face({
        id: 'face-1',
        photoId: 'asset-1',
        personId: 'person-1',
        embedding: Array(48).fill(0.125),
        bbox: { x: 10, y: 20, width: 30, height: 40 }
      });
      await faceRepo.saveFace(face);

      // Rename Person 1 to "bob" (case-insensitive and trimmed)
      await peopleUseCase.renamePerson('person-1', '  bob  ');

      // Verify Person 1 is deleted
      const deletedPerson = await faceRepo.getPersonById('person-1');
      assert.equal(deletedPerson, null);

      // Verify Face is reassigned to Person 2
      const faces = await faceRepo.getFacesForPhoto('asset-1');
      assert.equal(faces.length, 1);
      assert.equal(faces[0].personId, 'person-2');
    } finally {
      await env.cleanup();
    }
  });

  it('dismisses a false-positive person by deleting its faces and person row', async () => {
    const env = await createPipelineTestEnvironment();
    try {
      const faceRepo = new SqliteFaceRepository(env.db);
      const mediaRepo = new SqliteMediaFileRepository(env.db);
      const getAssetsUseCase = new GetAssetsUseCase(env.assetRepo, mediaRepo, env.originalsDir, env.storageDir);
      const peopleUseCase = new PeopleUseCase(faceRepo, env.assetRepo, getAssetsUseCase);

      const asset = new MediaPhoto({
        id: 'latex-jock-false-positive',
        dateTaken: new Date().toISOString(),
        timezoneOffset: '+00:00'
      });
      await env.assetRepo.save(asset);

      await faceRepo.savePerson(new Person({
        id: 'person-false-positive',
        label: 'False Positive'
      }));
      await faceRepo.saveFace(new Face({
        id: 'face-false-positive-1',
        photoId: asset.id,
        personId: 'person-false-positive',
        embedding: Array(48).fill(0.2),
        bbox: { x: 217, y: 120, width: 215, height: 215 }
      }));
      await faceRepo.saveFace(new Face({
        id: 'face-false-positive-2',
        photoId: asset.id,
        personId: 'person-false-positive',
        embedding: Array(48).fill(0.25),
        bbox: { x: 205, y: 114, width: 233, height: 233 }
      }));

      const deletedFaces = await peopleUseCase.dismissPerson('person-false-positive');

      assert.equal(deletedFaces, 2);
      assert.equal(await faceRepo.getPersonById('person-false-positive'), null);
      assert.deepEqual(await faceRepo.getFacesForPhoto(asset.id), []);
    } finally {
      await env.cleanup();
    }
  });

  it('should successfully delete orphan persons (persons without any faces)', async () => {
    const env = await createPipelineTestEnvironment();
    try {
      const faceRepo = new SqliteFaceRepository(env.db);
      const mediaRepo = new SqliteMediaFileRepository(env.db);
      const getAssetsUseCase = new GetAssetsUseCase(env.assetRepo, mediaRepo, env.originalsDir, env.storageDir);
      const peopleUseCase = new PeopleUseCase(faceRepo, env.assetRepo, getAssetsUseCase);

      // 1. Create a person with a face associated
      const personWithFace = new Person({
        id: 'person-active',
        label: 'Active Person',
        name: 'Active'
      });
      await faceRepo.savePerson(personWithFace);

      const asset = new MediaPhoto({
        id: 'asset-1',
        dateTaken: new Date().toISOString(),
        timezoneOffset: '+00:00'
      });
      await env.assetRepo.save(asset);

      const face = new Face({
        id: 'face-1',
        photoId: 'asset-1',
        personId: 'person-active',
        embedding: Array(48).fill(0.125),
        bbox: { x: 10, y: 20, width: 30, height: 40 }
      });
      await faceRepo.saveFace(face);

      // 2. Create a person without any faces associated (orphan)
      const orphanPerson = new Person({
        id: 'person-orphan',
        label: 'Orphan Person',
        name: 'Orphan'
      });
      await faceRepo.savePerson(orphanPerson);

      // Verify both exist before cleanup
      const beforePerson1 = await faceRepo.getPersonById('person-active');
      const beforePerson2 = await faceRepo.getPersonById('person-orphan');
      assert.ok(beforePerson1);
      assert.ok(beforePerson2);

      // 3. Execute deleteOrphanPersons
      const deletedCount = await peopleUseCase.deleteOrphanPersons();
      assert.equal(deletedCount, 1);

      // 4. Verify orphan is deleted, active remains
      const afterPerson1 = await faceRepo.getPersonById('person-active');
      const afterPerson2 = await faceRepo.getPersonById('person-orphan');
      assert.ok(afterPerson1);
      assert.equal(afterPerson2, null);
    } finally {
      await env.cleanup();
    }
  });
});

