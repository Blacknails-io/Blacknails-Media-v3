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
  public triggerCount = 0;
  public async start() {}
  public stop() {}
  public async trigger() { this.triggerCount++; }
}

describe('PipelineCoordinatorService - DAG Resolution', () => {
  it('should correctly resolve downstream workers (DAG)', () => {
    const coordinator = new PipelineCoordinatorService({} as any, {} as any, {} as any, '');

    const indexWorker = new MockWorker('index-worker', 'Index', ['assets'], ['original_files']);
    const imagePreviewWorker = new MockWorker('image-preview-worker', 'Image Preview', ['image_previews'], ['assets']);
    const videoPreviewWorker = new MockWorker('video-preview-worker', 'Video Preview', ['video_previews'], ['assets']);
    const imageTranscodeWorker = new MockWorker('image-transcode-worker', 'Image Transcode', ['image_transcodes'], ['image_previews']);
    const videoTranscodeWorker = new MockWorker('video-transcode-worker', 'Video Transcode', ['video_transcodes'], ['video_previews']);
    const descriptionWorker = new MockWorker('description-worker', 'Desc', ['descriptions'], ['image_transcodes', 'video_transcodes']);
    const tagsWorker = new MockWorker('tags-worker', 'Tags', ['tags'], ['descriptions']);
    const titleWorker = new MockWorker('title-worker', 'Title', ['titles'], ['descriptions']);
    const faceWorker = new MockWorker('face-worker', 'Face', ['faces'], ['image_transcodes', 'video_transcodes']);
    const clusterWorker = new MockWorker('face-cluster-worker', 'Cluster', ['face_clusters'], ['faces']);

    coordinator.register(indexWorker);
    coordinator.register(imagePreviewWorker);
    coordinator.register(videoPreviewWorker);
    coordinator.register(imageTranscodeWorker);
    coordinator.register(videoTranscodeWorker);
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

    // Test 3: Reset Image Preview should affect the image branch and shared AI derivatives
    const imagePreviewDownstream = (coordinator as any).getDownstreamWorkers('image-preview-worker');
    assert.deepStrictEqual(imagePreviewDownstream.sort(), [
      'image-preview-worker',
      'image-transcode-worker',
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
      'image-preview-worker',
      'video-preview-worker',
      'image-transcode-worker',
      'video-transcode-worker',
      'description-worker',
      'tags-worker',
      'title-worker',
      'face-worker',
      'face-cluster-worker'
    ].sort());
  });

  it('triggers downstream workers when a new media derivative worker completes', async () => {
    const coordinator = new PipelineCoordinatorService({} as any, {} as any, {} as any, '');

    const imagePreviewWorker = new MockWorker('image-preview-worker', 'Image Preview', ['image_previews'], ['assets']);
    const imageTranscodeWorker = new MockWorker('image-transcode-worker', 'Image Transcode', ['image_transcodes'], ['image_previews']);
    imageTranscodeWorker.isRunning = true;

    coordinator.register(imagePreviewWorker);
    coordinator.register(imageTranscodeWorker);

    await (coordinator as any).handleWorkerCompleted('image-preview-worker');
    await new Promise((resolve) => setTimeout(resolve, 150));

    assert.equal(imageTranscodeWorker.triggerCount, 1);
  });
});
