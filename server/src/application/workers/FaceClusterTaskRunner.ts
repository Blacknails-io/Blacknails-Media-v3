import { Person } from '../../domain/entities/Face.js';
import { IFaceRepository } from '../ports/out/IFaceRepository.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { DaemonWorker } from '../services/DaemonWorker.js';
import { FaceDomainEvent } from '../events/SystemEvents.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';

function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  const distance = Math.sqrt(sum);
  return Math.max(0, 1 - distance / 0.45);
}

export class FaceClusterTaskRunner extends DaemonWorker {
  public readonly id = 'face-cluster-worker';
  public readonly label = 'Face Clustering';
  public readonly provides = ['face_clusters'];
  public readonly requires = ['faces'];
  public readonly intervalMs: number;
  public readonly subsystem = 'AI';
  protected timer?: NodeJS.Timeout;
  private isCatchingUp = false;

  constructor(
    eventBus: IEventBus,
    uow: IUnitOfWork,
    private readonly faceRepository: IFaceRepository,
    intervalMs: number,
    private readonly similarityThreshold: number
  ) {
    super(eventBus, uow.workerExecutions);
    this.intervalMs = intervalMs;
  }

  protected async catchUp(): Promise<void> {
    if (this.isCatchingUp) return;
    this.isCatchingUp = true;
    try {
      const unclusteredCount = await this.faceRepository.getUnclusteredFacesCount();
      if (unclusteredCount === 0) {
        return;
      }

      const rows = await this.faceRepository.getAllEmbeddings();
      // Si no hay caras en absoluto, no hacemos nada
      if (rows.length === 0) {
        return;
      }
      await this.faceRepository.resetClustering();

      const clusters: Array<{ person: Person; centroid: number[]; faceIds: string[] }> = [];
      for (const row of rows) {
        let selected = -1;
        let bestScore = -1;
        for (let i = 0; i < clusters.length; i += 1) {
          const score = cosineSimilarity(row.embedding, clusters[i].centroid);
          if (score > bestScore) {
            bestScore = score;
            selected = i;
          }
        }

        if (selected >= 0 && bestScore >= this.similarityThreshold) {
          clusters[selected].faceIds.push(row.faceId);
          // Update centroid to running average of the cluster
          const count = clusters[selected].faceIds.length;
          const len = Math.min(row.embedding.length, clusters[selected].centroid.length);
          for (let k = 0; k < len; k += 1) {
            clusters[selected].centroid[k] = (clusters[selected].centroid[k] * (count - 1) + row.embedding[k]) / count;
          }
        } else {
          clusters.push({
            person: new Person({ label: `person_${clusters.length + 1}` }),
            centroid: row.embedding,
            faceIds: [row.faceId]
          });
        }
      }

      const total = clusters.length;
      if (total > 0) {
        await this.startExecution(total);
        await this.publishLifecycleEvent('STARTED', `[FACE-CLUSTER] Revisando ${total} agrupaciones para fusionar...`);
      }

      let processed = 0;
      let failed = 0;
      for (const cluster of clusters) {
        try {
          await this.faceRepository.savePerson(cluster.person);
          for (const faceId of cluster.faceIds) {
            await this.faceRepository.updatePersonId(faceId, cluster.person.id);
            
            // Publicamos evento de dominio de rostro agrupado
            await this.eventBus.publish(new FaceDomainEvent(
              faceId,
              'GROUPED',
              this.id,
              `Rostro '${faceId}' agrupado bajo la persona '${cluster.person.label}'.`
            ));
          }
          await this.publishLifecycleEvent('SUCCESS', `[FACE-CLUSTER] elemento ${cluster.person.id} procesado.`, { workerName: this.id, itemId: cluster.person.id, status: 'PROCESSED' });
          processed++;
          await this.updateExecution(processed, failed);
        } catch (error) {
          failed++;
          await this.updateExecution(processed, failed);
          this.markError(error);
        }
      }

      this.markRun();
      if (total > 0) {
        await this.finishExecution('COMPLETED');
        await this.publishLifecycleEvent('COMPLETED', `[FACE-CLUSTER] ${total} clusters generados.`);
      }
    } catch (error) {
      this.markError(error);
      if (this.currentExecutionId) {
        await this.finishExecution('FAILED');
      }
      console.error(`[FACE-CLUSTER] Error in worker execution:`, error);
      await this.publishLifecycleEvent('ERROR', `[FACE-CLUSTER] ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isCatchingUp = false;
    }
  }

  protected subscribeToEvents(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      void this.catchUp();
    }, this.intervalMs);
  }

  protected unsubscribeFromEvents(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  protected async getPendingItems(): Promise<number> {
    const rows = await this.faceRepository.getAllEmbeddings();
    return rows.length;
  }
}

