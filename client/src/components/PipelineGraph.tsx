import { useCallback, useEffect, useRef, useState } from 'react';
import type { PipelineWorkerDTO } from '../types/Pipeline.js';
import './PipelineGraph.css';

interface PipelineGraphProps {
  workers: PipelineWorkerDTO[];
  onAction: (workerId: string, action: 'start' | 'stop' | 'trigger' | 'reset') => Promise<void>;
}

const OLLAMA_TEXT_WORKERS = new Set(['tags-worker', 'title-worker']);
const OLLAMA_VISION_WORKERS = new Set(['description-worker', 'nsfw-worker', 'face-worker']);
const OLLAMA_CONCURRENCY_PER_KIND = 2;

const getOllamaKind = (workerId: string): 'text' | 'vision' | null => {
  if (OLLAMA_TEXT_WORKERS.has(workerId)) return 'text';
  if (OLLAMA_VISION_WORKERS.has(workerId)) return 'vision';
  return null;
};

const RESETTABLE_WORKERS = new Set([
  'index-worker',
  'image-preview-worker', 'video-preview-worker', 'image-transcode-worker', 'video-transcode-worker',
  'description-worker',
  'tags-worker',
  'title-worker',
  'nsfw-worker',
  'face-worker',
  'face-cluster-worker'
]);

const getWorkerIo = (worker: PipelineWorkerDTO) => ({
  requires: Array.isArray(worker.requires) ? worker.requires : [],
  provides: Array.isArray(worker.provides) ? worker.provides : []
});

const getActiveAssetLabel = (worker: PipelineWorkerDTO): 'Image' | 'Video' | null => {
  if (!worker.isExecuting) return null;
  if (worker.currentAssetType === 'PHOTO') return 'Image';
  if (worker.currentAssetType === 'VIDEO') return 'Video';
  return null;
};

const VISUAL_WORKER_LABELS: Record<string, string> = {
  'import-worker': 'Importar',
  'index-worker': 'Catalogar',
  'image-preview-worker': 'Miniatura foto',
  'video-preview-worker': 'Poster vídeo',
  'image-transcode-worker': 'Imagen para IA',
  'video-transcode-worker': 'Clip preview',
  'nsfw-worker': 'NSFW',
  'description-worker': 'Describir',
  'face-worker': 'Detectar caras',
  'tags-worker': 'Tags',
  'title-worker': 'Título',
  'face-cluster-worker': 'Agrupar personas'
};

const getWorkerLabel = (worker: PipelineWorkerDTO): string => VISUAL_WORKER_LABELS[worker.id] ?? worker.label;

const getWorkerStatusLabel = (worker: PipelineWorkerDTO): string => {
  if (worker.isExecuting) return 'PROCESANDO';
  if (worker.pendingItems > 0 && !worker.isRunning) return 'COLA PARADA';
  if (worker.pendingItems > 0) return 'PENDIENTE';
  if (worker.isRunning) return 'LISTO';
  return 'PARADO';
};

const MEDIA_LANE_LABELS: Record<string, 'Foto' | 'Vídeo'> = {
  'image-preview-worker': 'Foto',
  'image-transcode-worker': 'Foto',
  'video-preview-worker': 'Vídeo',
  'video-transcode-worker': 'Vídeo'
};

export const PipelineGraph = ({ workers, onAction }: PipelineGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ from: string; to: string; path: string }[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const activeOllamaKinds = workers
    .filter((worker) => worker.isExecuting)
    .map((worker) => getOllamaKind(worker.id))
    .filter((kind): kind is 'text' | 'vision' => Boolean(kind));
  const activeOllamaKind = activeOllamaKinds[0] ?? null;
  const activeOllamaCount = activeOllamaKind
    ? activeOllamaKinds.filter((kind) => kind === activeOllamaKind).length
    : 0;

  // Define processing stages for horizontal layout columns
  const stages = [
    {
      title: 'Ingesta',
      subtitle: 'Captura de archivos',
      workerIds: ['import-worker']
    },
    {
      title: 'Catálogo',
      subtitle: 'Asset en biblioteca',
      workerIds: ['index-worker']
    },
    {
      title: 'Preview',
      subtitle: 'Foto y vídeo',
      workerIds: ['image-preview-worker', 'video-preview-worker']
    },
    {
      title: 'Preparar IA',
      subtitle: 'Derivados ligeros',
      workerIds: ['image-transcode-worker', 'video-transcode-worker']
    },
    {
      title: 'IA y caras',
      subtitle: 'Análisis local',
      workerIds: ['nsfw-worker', 'description-worker', 'face-worker']
    },
    {
      title: 'Metadata',
      subtitle: 'Tags, títulos, personas',
      workerIds: ['tags-worker', 'title-worker', 'face-cluster-worker']
    }
  ];

  const computePaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const newConns: { from: string; to: string; path: string }[] = [];
    const containerRect = container.getBoundingClientRect();

    workers.forEach((src) => {
      const srcIo = getWorkerIo(src);

      workers.forEach((dst) => {
        if (src.id === dst.id) return;
        const dstIo = getWorkerIo(dst);
        const isDependent = dstIo.requires.some((req) => srcIo.provides.includes(req));
        if (isDependent) {
          const srcEl = container.querySelector(`#node-${src.id}`);
          const dstEl = container.querySelector(`#node-${dst.id}`);
          if (srcEl && dstEl) {
            const srcRect = srcEl.getBoundingClientRect();
            const dstRect = dstEl.getBoundingClientRect();

            // Right side of source card
            const x1 = srcRect.right - containerRect.left;
            const y1 = srcRect.top + srcRect.height / 2 - containerRect.top;

            // Left side of destination card
            const x2 = dstRect.left - containerRect.left;
            const y2 = dstRect.top + dstRect.height / 2 - containerRect.top;

            const dx = Math.abs(x2 - x1) * 0.45;
            const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            newConns.push({
              from: src.id,
              to: dst.id,
              path
            });
          }
        }
      });
    });

    setConnections(newConns);
  }, [workers]);

  useEffect(() => {
    computePaths();
    window.addEventListener('resize', computePaths);
    
    // Recalculate slightly later to make sure Atropos and animations have fully mounted/positioned
    const timer = setTimeout(computePaths, 250);

    return () => {
      window.removeEventListener('resize', computePaths);
      clearTimeout(timer);
    };
  }, [computePaths]);

  return (
    <div className="pipeline-graph-wrapper" ref={containerRef}>
      {/* SVG connections canvas overlay */}
      <svg className="pipeline-graph-svg">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 8 5 L 0 8 z" fill="currentColor" />
          </marker>
        </defs>

        {connections.map((conn, idx) => {
          const isRelated = hoveredNode === conn.from || hoveredNode === conn.to;
          let pathClass = 'graph-connection-line';
          if (hoveredNode) {
            pathClass += isRelated ? ' active' : ' fade';
          }
          return (
            <path
              key={idx}
              d={conn.path}
              className={pathClass}
              markerEnd="url(#arrow)"
            />
          );
        })}
      </svg>

      {/* Stage columns layout grid */}
      <div className="pipeline-graph-columns">
        {stages.map((stage, sIdx) => (
          <section className="pipeline-graph-column" key={sIdx}>
            <header className="pipeline-column-header">
              <h3 className="pipeline-column-title">{stage.title}</h3>
              <p className="pipeline-column-subtitle">{stage.subtitle}</p>
            </header>

            <div className="pipeline-column-nodes">
              {stage.workerIds.map((wId) => {
                const worker = workers.find((w) => w.id === wId);
                if (!worker) return null;

                const isHovered = hoveredNode === worker.id;
                const workerIo = getWorkerIo(worker);
                const activeAssetLabel = getActiveAssetLabel(worker);
                const mediaLaneLabel = MEDIA_LANE_LABELS[worker.id];
                const statusClass = worker.isExecuting
                  ? 'running'
                  : worker.isRunning
                  ? 'idle'
                  : 'stopped';
                const ollamaKind = getOllamaKind(worker.id);
                const ollamaState = !ollamaKind
                  ? null
                  : worker.isExecuting
                  ? 'active'
                  : activeOllamaKind && activeOllamaKind !== ollamaKind
                  ? 'blocked'
                  : activeOllamaCount >= OLLAMA_CONCURRENCY_PER_KIND
                  ? 'blocked'
                  : 'ready';

                return (
                  <article
                    id={`node-${worker.id}`}
                    key={worker.id}
                    className={`pipeline-node-card ${statusClass} ${isHovered ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredNode(worker.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <header className="pipeline-node-header">
                      <div className="pipeline-node-badge-container">
                        <span className={`pipeline-node-status-dot ${statusClass}`} />
                        <span className={`pipeline-node-badge ${statusClass}`}>
                          {getWorkerStatusLabel(worker)}
                        </span>
                        {mediaLaneLabel && (
                          <span className={"pipeline-node-lane " + (mediaLaneLabel === 'Foto' ? 'photo' : 'video')}>
                            {mediaLaneLabel}
                          </span>
                        )}
                        {ollamaState && (
                          <span
                            className={"pipeline-node-resource ollama " + ollamaState + " " + ollamaKind}
                            title={ollamaKind === "vision" ? "Modelo visual de Ollama" : "Modelo de texto de Ollama"}
                            aria-label={(ollamaKind === "vision" ? "Ollama vision" : "Ollama texto") + " " + ollamaState}
                          >
                          </span>
                        )}
                        {activeAssetLabel && (
                          <span
                            className={"pipeline-node-media-kind " + activeAssetLabel.toLowerCase()}
                            title={"Procesando " + activeAssetLabel}
                            aria-label={"Procesando " + activeAssetLabel}
                          >
                            <span className="pipeline-node-media-kind-icon" aria-hidden="true" />
                            <span>{activeAssetLabel}</span>
                          </span>
                        )}
                      </div>
                      <h4 className="pipeline-node-label">{getWorkerLabel(worker)}</h4>
                      <code className="pipeline-node-id">{worker.id}</code>
                    </header>

                    <div className="pipeline-node-details">
                      <div className="pipeline-node-pending">
                        Pendientes: <strong style={worker.pendingItems > 0 ? { color: '#fbbf24', fontWeight: 'bold' } : {}}>{worker.pendingItems}</strong>
                      </div>
                      <div className="pipeline-node-io">
                        <div className="pipeline-io-group">
                          <span className="io-label">Entrada:</span>
                          <span className="io-chips">
                            {workerIo.requires.length > 0 ? (
                              workerIo.requires.map((req) => <code key={req}>{req}</code>)
                            ) : (
                              <code className="none">—</code>
                            )}
                          </span>
                        </div>
                        <div className="pipeline-io-group">
                          <span className="io-label">Salida:</span>
                          <span className="io-chips">
                            {workerIo.provides.map((prov) => (
                              <code key={prov} className="provides-chip">
                                {prov}
                              </code>
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <footer className="pipeline-node-actions">
                      <button
                        type="button"
                        className={"pipeline-btn primary " + (worker.isRunning ? 'stop' : 'trigger')}
                        onClick={() => void onAction(worker.id, worker.isRunning ? 'stop' : 'trigger')}
                      >
                        {worker.isRunning ? 'Parar' : 'Ejecutar'}
                      </button>
                      {RESETTABLE_WORKERS.has(worker.id) && (
                        <button
                          type="button"
                          className="pipeline-btn reset"
                          onClick={() => void onAction(worker.id, 'reset')}
                        >
                          Reset
                        </button>
                      )}
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
