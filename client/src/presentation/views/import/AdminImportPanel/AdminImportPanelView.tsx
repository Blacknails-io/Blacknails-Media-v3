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

import { SectionPanel } from '../../../../components/SectionPanel.js';
import { PipelineGraph } from '../../../../components/PipelineGraph.js';
import { WorkerCard } from './WorkerCard.js';
import type { AdminImportPanelState, WorkerAction } from './useAdminImportPanelLogic.js';
import '../../../../corporate/ImportPipelinePanel.css';

interface AdminImportPanelViewProps {
  state: AdminImportPanelState;
  viewMode: 'grid' | 'graph';
  setViewMode: React.Dispatch<React.SetStateAction<'grid' | 'graph'>>;
  handleAction: (workerId: string, action: WorkerAction) => Promise<void>;
  handleGroupAction: (workerIds: string[], action: WorkerAction, strategy?: 'parallel' | 'series') => Promise<void>;
}

const WORKER_GROUPS = [
  { id: 'base', label: 'Base', strategy: 'series' as const, workerIds: ['import-worker', 'index-worker', 'image-preview-worker', 'video-preview-worker', 'image-transcode-worker', 'video-transcode-worker'] },
  { id: 'ai', label: 'IA', strategy: 'series' as const, workerIds: ['description-worker', 'nsfw-worker', 'face-worker'] },
  { id: 'derived', label: 'Derivados', strategy: 'series' as const, workerIds: ['tags-worker', 'title-worker', 'face-cluster-worker'] }
];

export const AdminImportPanelView = ({
  state,
  viewMode,
  setViewMode,
  handleAction,
  handleGroupAction
}: AdminImportPanelViewProps) => {
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

        {state.isLoading && state.workers.length === 0 ? (
          <div className="import-panel-empty">Cargando estado del pipeline...</div>
        ) : viewMode === 'graph' ? (
          <PipelineGraph
            workers={state.workers}
            onAction={handleAction}
          />
        ) : (
          <div className="import-worker-grid" data-instance-id="admin-import-workers">
            {state.workers.map((worker) => (
              <WorkerCard key={worker.id} workerId={worker.id} initialWorker={worker} />
            ))}
          </div>
        )}
      </div>
    </SectionPanel>
  );
};
