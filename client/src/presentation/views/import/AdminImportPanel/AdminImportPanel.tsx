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

import { useEffect, useMemo, useState } from 'react';
import { SectionPanel } from '../../../../components/SectionPanel.js';
import { useAuth } from '../../../../context/AuthContext.js';
import { pipelineService } from '../../../../services/api/index.js';
import { AdminImportPanelController, type AdminImportPanelState, type WorkerAction } from '../../../../controllers/AdminImportPanelController.js';
import { PipelineGraph } from '../../../../components/PipelineGraph.js';
import '../../../../corporate/ImportPipelinePanel.css';

const EMPTY_STATE: AdminImportPanelState = {
  workers: [],
  isLoading: true,
  error: null
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

const WORKER_GROUPS = [
  { id: 'base', label: 'Base', strategy: 'series' as const, workerIds: ['import-worker', 'index-worker', 'image-preview-worker', 'video-preview-worker', 'image-transcode-worker', 'video-transcode-worker'] },
  { id: 'ai', label: 'IA', strategy: 'series' as const, workerIds: ['description-worker', 'nsfw-worker', 'face-worker'] },
  { id: 'derived', label: 'Derivados', strategy: 'series' as const, workerIds: ['tags-worker', 'title-worker', 'face-cluster-worker'] }
];

export const AdminImportPanel = () => {
  const { token } = useAuth();
  const [state, setState] = useState<AdminImportPanelState>(EMPTY_STATE);
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('graph');
  const controller = useMemo(
    () => new AdminImportPanelController(() => token, pipelineService),
    [token]
  );

  const handleAction = async (workerId: string, action: WorkerAction) => {
    await controller.runAction(workerId, action);
  };

  const handleGroupAction = async (workerIds: string[], action: WorkerAction, strategy: 'parallel' | 'series' = 'parallel') => {
    await controller.runGroupAction(workerIds, action, strategy);
  };

  useEffect(() => {
    const unsubscribe = controller.onState(setState);
    controller.start();
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller]);

  return (
    <SectionPanel title="Workers" instanceId="admin-import-panel">
      <div className="import-panel" data-instance-id="admin-import-panel-root">
        <div className="import-panel-toolbar">
          <p className="import-panel-hint">Control centralizado del pipeline de workers de media.</p>

          <div className="import-panel-toolbar-actions">
            <button
              type="button"
              className={"import-worker-button secondary " + (viewMode === 'graph' ? 'active' : '')}
              onClick={() => setViewMode(viewMode === 'grid' ? 'graph' : 'grid')}
              data-instance-id="pipeline-view-toggle"
            >
              {viewMode === 'grid' ? 'Grafo' : 'Lista'}
            </button>

            {WORKER_GROUPS.map((group) => {
              const groupWorkers = state.workers.filter((worker) => group.workerIds.includes(worker.id));
              return (
                <button
                  key={group.id}
                  type="button"
                  className="import-worker-button secondary"
                  onClick={() => void handleGroupAction(group.workerIds, 'trigger', group.strategy)}
                  disabled={state.isLoading || groupWorkers.length === 0}
                  data-instance-id={"pipeline-group-trigger-" + group.id}
                >
                  {group.label}
                </button>
              );
            })}

            <button
              type="button"
              className="import-worker-button"
              onClick={() => {
                void handleGroupAction(
                  ['import-worker', 'index-worker', 'image-preview-worker', 'video-preview-worker', 'image-transcode-worker', 'video-transcode-worker', 'description-worker', 'nsfw-worker', 'face-worker', 'tags-worker', 'title-worker', 'face-cluster-worker']
                    .filter((workerId) => state.workers.some((worker) => worker.id === workerId && !worker.isRunning)),
                  'start',
                  'parallel'
                );
              }}
              disabled={state.isLoading || state.workers.length === 0 || state.workers.every((worker) => worker.isRunning)}
              data-instance-id="pipeline-start-all"
            >
              Arrancar
            </button>

            <button
              type="button"
              className="import-worker-button danger"
              onClick={() => {
                void handleGroupAction(
                  state.workers.filter((worker) => worker.isRunning).map((worker) => worker.id),
                  'stop',
                  'parallel'
                );
              }}
              disabled={state.isLoading || state.workers.every((worker) => !worker.isRunning)}
              data-instance-id="pipeline-stop-all"
            >
              Parar
            </button>
          </div>
        </div>

        {state.error && <div className="import-panel-error">{state.error}</div>}

        {state.isLoading ? (
          <div className="import-panel-empty">Cargando estado del pipeline...</div>
        ) : viewMode === 'graph' ? (
          <PipelineGraph
            workers={state.workers}
            onAction={handleAction}
          />
        ) : (
          <div className="import-worker-grid" data-instance-id="admin-import-workers">
            {state.workers.map((worker) => (
              <article className="import-worker-card" key={worker.id} data-instance-id={`import-worker-${worker.id}`}>
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
                      onClick={() => void handleAction(worker.id, 'stop')}
                      data-instance-id={`import-worker-stop-${worker.id}`}
                    >
                      Parar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="import-worker-button"
                      onClick={() => void handleAction(worker.id, 'start')}
                      data-instance-id={`import-worker-start-${worker.id}`}
                    >
                      Arrancar
                    </button>
                  )}
                  <button
                    type="button"
                    className="import-worker-button secondary"
                    onClick={() => void handleAction(worker.id, 'trigger')}
                    data-instance-id={`import-worker-trigger-${worker.id}`}
                  >
                    Ejecutar
                  </button>
                  {RESETTABLE_WORKERS.has(worker.id) && (
                    <button
                      type="button"
                      className="import-worker-button danger"
                      onClick={() => void handleAction(worker.id, 'reset')}
                      data-instance-id={`import-worker-reset-${worker.id}`}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </SectionPanel>
  );
};
