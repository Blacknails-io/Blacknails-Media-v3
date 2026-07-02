import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PipelineCoordinatorService } from '../src/application/services/PipelineCoordinatorService.js';
import { DaemonWorker } from '../src/application/services/DaemonWorker.js';

// Mock classes for testing
class MockWorker extends DaemonWorker {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly provides: string[],
    public readonly requires: string[]
  ) {
    super({} as any, {} as any);
  }
  public readonly intervalMs = 1000;
  public readonly subsystem = 'AI';
  public async start() {}
  public stop() {}
  public async trigger() {}
}

describe('PipelineCoordinatorService - DAG Resolution', () => {
  it('should correctly resolve downstream workers (DAG)', () => {
    const coordinator = new PipelineCoordinatorService({} as any, {} as any, {} as any, '');

    const indexWorker = new MockWorker('index-worker', 'Index', ['assets'], ['original_files']);
    const thumbnailWorker = new MockWorker('thumbnail-worker', 'Thumb', ['thumbnails'], ['assets']);
    const descriptionWorker = new MockWorker('description-worker', 'Desc', ['descriptions'], ['thumbnails']);
    const tagsWorker = new MockWorker('tags-worker', 'Tags', ['tags'], ['descriptions']);
    const titleWorker = new MockWorker('title-worker', 'Title', ['titles'], ['descriptions']);
    const faceWorker = new MockWorker('face-worker', 'Face', ['faces'], ['thumbnails']);
    const clusterWorker = new MockWorker('face-cluster-worker', 'Cluster', ['face_clusters'], ['faces']);

    coordinator.register(indexWorker);
    coordinator.register(thumbnailWorker);
    coordinator.register(descriptionWorker);
    coordinator.register(tagsWorker);
    coordinator.register(titleWorker);
    coordinator.register(faceWorker);
    coordinator.register(clusterWorker);

    // Test 1: Reset Description should affect tags and titles
    // Using any since getDownstreamWorkers is private
    const descDownstream = (coordinator as any).getDownstreamWorkers('description-worker');
    assert.deepStrictEqual(descDownstream.sort(), ['description-worker', 'tags-worker', 'title-worker'].sort());

    // Test 2: Reset Face should affect clusters
    const faceDownstream = (coordinator as any).getDownstreamWorkers('face-worker');
    assert.deepStrictEqual(faceDownstream.sort(), ['face-worker', 'face-cluster-worker'].sort());

    // Test 3: Reset Thumbnail should affect everything except index
    const thumbDownstream = (coordinator as any).getDownstreamWorkers('thumbnail-worker');
    assert.deepStrictEqual(thumbDownstream.sort(), [
      'thumbnail-worker',
      'description-worker',
      'tags-worker',
      'title-worker',
      'face-worker',
      'face-cluster-worker'
    ].sort());

    // Test 4: Reset Index should affect EVERYTHING
    const indexDownstream = (coordinator as any).getDownstreamWorkers('index-worker');
    assert.deepStrictEqual(indexDownstream.sort(), [
      'index-worker',
      'thumbnail-worker',
      'description-worker',
      'tags-worker',
      'title-worker',
      'face-worker',
      'face-cluster-worker'
    ].sort());
  });
});
