/*
 * Copyright (c) 2026 MyCompany LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { PipelineWorkerDTO } from '../../types/Pipeline.js';

interface WorkerCardViewProps {
  worker: PipelineWorkerDTO | null;
  isLoading: boolean;
  error: string | null;
  onAction: (action: 'start' | 'stop' | 'trigger' | 'reset') => void;
}

export const WorkerCardView = ({ worker, isLoading, error, onAction }: WorkerCardViewProps) => {
  if (isLoading && !worker) {
    return <div className="import-panel-empty">Cargando worker...</div>;
  }

  if (!worker) return null;

  const isResettable = [
    'index-worker',
    'image-preview-worker', 'video-preview-worker', 'image-transcode-worker', 'video-transcode-worker',
    'description-worker',
    'tags-worker',
    'title-worker',
    'nsfw-worker',
    'face-worker',
    'face-cluster-worker'
  ].includes(worker.id);

  return (
    <article className="import-worker-card" data-instance-id={`import-worker-${worker.id}`}>
      <header className="import-worker-header">
        <div>
          <div className="import-worker-title">{worker.label}</div>
          <div className="import-worker-subtitle">{worker.id}</div>
        </div>
        <span className={`import-worker-status ${(() => {
          if (worker.isExecuting) return 'running';
          if (worker.isRunning) return 'idle';
          return 'stopped';
        })()}`}>
          {(() => {
            if (worker.isExecuting) return 'ACTIVO';
            if (worker.isRunning) return 'IDLE';
            return 'PARADO';
          })()}
        </span>
      </header>

      {error && <p style={{ fontSize: '0.75rem', color: 'var(--accent-ruby)', marginTop: '0.25rem' }}>{error}</p>}

      <dl className="import-worker-stats">
        <div>
          <dt>Intervalo</dt>
          <dd>{worker.intervalMs > 0 ? `${Math.round(worker.intervalMs / 1000)}s` : 'manual'}</dd>
        </div>

        <div>
          <dt>Última ejecución</dt>
          <dd>{worker.lastRunAt ? new Date(worker.lastRunAt).toLocaleString() : '—'}</dd>
        </div>
      </dl>

      <div
        className={`import-worker-pending-chip ${worker.pendingItems > 0 ? 'has-pending' : 'clear'}`}
        data-instance-id={`import-worker-pending-${worker.id}`}
      >
        Pendientes ahora: <strong>{worker.pendingItems}</strong>
      </div>

      <div className="import-worker-actions">
        {worker.isRunning ? (
          <button
            type="button"
            className="import-worker-button"
            onClick={() => onAction('stop')}
            data-instance-id={`import-worker-stop-${worker.id}`}
          >
            Parar
          </button>
        ) : (
          <button
            type="button"
            className="import-worker-button"
            onClick={() => onAction('start')}
            data-instance-id={`import-worker-start-${worker.id}`}
          >
            Arrancar
          </button>
        )}
        <button
          type="button"
          className="import-worker-button secondary"
          onClick={() => onAction('trigger')}
          data-instance-id={`import-worker-trigger-${worker.id}`}
        >
          Ejecutar
        </button>
        {isResettable && (
          <button
            type="button"
            className="import-worker-button danger"
            onClick={() => onAction('reset')}
            data-instance-id={`import-worker-reset-${worker.id}`}
          >
            Reset
          </button>
        )}
      </div>
    </article>
  );
};
