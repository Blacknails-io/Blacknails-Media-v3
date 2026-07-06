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

import { useState, useEffect, useCallback } from 'react';
import { pipelineService } from '../../../../services/api/index.js';
import type { PipelineWorkerDTO } from '../../../../services/api/interfaces.js';
import { backendEventsController } from '../../../../controllers/BackendEventsController.js';

export type WorkerAction = 'start' | 'stop' | 'trigger' | 'reset';

export interface AdminImportPanelState {
  workers: PipelineWorkerDTO[];
  isLoading: boolean;
  error: string | null;
}

export function useAdminImportPanelLogic(token: string | null) {
  const [state, setState] = useState<AdminImportPanelState>({
    workers: [],
    isLoading: true,
    error: null
  });
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('graph');

  const refresh = useCallback(async (silent = false) => {
    if (!token) {
      setState({ workers: [], isLoading: false, error: null });
      return;
    }
    if (!silent) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    }
    try {
      const workers = await pipelineService.getWorkers(token);
      setState({ workers, error: null, isLoading: false });
    } catch (err: any) {
      if (!silent) {
        setState((prev) => ({
          ...prev,
          error: err?.message || 'No se pudo cargar el pipeline.',
          isLoading: false
        }));
      }
    }
  }, [token]);

  const handleAction = useCallback(async (workerId: string, action: WorkerAction) => {
    if (!token) return;
    try {
      let updated: PipelineWorkerDTO;
      if (action === 'start') {
        updated = await pipelineService.startWorker(token, workerId);
      } else if (action === 'stop') {
        updated = await pipelineService.stopWorker(token, workerId);
      } else if (action === 'reset') {
        updated = await pipelineService.resetWorker(token, workerId);
      } else {
        updated = await pipelineService.triggerWorker(token, workerId);
      }
      setState((prev) => ({
        ...prev,
        workers: prev.workers.map((w) => (w.id === workerId ? updated : w))
      }));
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err?.message || 'Error al ejecutar la acción.' }));
    }
  }, [token]);

  const handleGroupAction = useCallback(async (
    workerIds: string[],
    action: WorkerAction,
    strategy: 'parallel' | 'series' = 'parallel'
  ) => {
    if (!token) return;
    setState((prev) => ({ ...prev, error: null }));

    const uniqueWorkerIds = Array.from(new Set(workerIds)).filter((id) =>
      state.workers.some((w) => w.id === id)
    );
    if (uniqueWorkerIds.length === 0) return;

    const runAction = async (id: string): Promise<PipelineWorkerDTO> => {
      if (action === 'start') return pipelineService.startWorker(token, id);
      if (action === 'stop') return pipelineService.stopWorker(token, id);
      if (action === 'reset') return pipelineService.resetWorker(token, id);
      return pipelineService.triggerWorker(token, id);
    };

    const results: PromiseSettledResult<PipelineWorkerDTO>[] = [];
    try {
      if (strategy === 'series') {
        for (const id of uniqueWorkerIds) {
          try {
            const res = await runAction(id);
            results.push({ status: 'fulfilled', value: res });
          } catch (reason) {
            results.push({ status: 'rejected', reason });
          }
        }
      } else {
        results.push(...await Promise.allSettled(uniqueWorkerIds.map((id) => runAction(id))));
      }

      const updatedWorkers = results
        .filter((r): r is PromiseFulfilledResult<PipelineWorkerDTO> => r.status === 'fulfilled')
        .map((r) => r.value);

      if (updatedWorkers.length > 0) {
        setState((prev) => ({
          ...prev,
          workers: prev.workers.map((w) => updatedWorkers.find((u) => u.id === w.id) ?? w)
        }));
      }

      const failedCount = results.length - updatedWorkers.length;
      if (failedCount > 0) {
        setState((prev) => ({
          ...prev,
          error: `No se pudo ejecutar ${failedCount} worker(s) del grupo.`
        }));
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err?.message || 'Error en acción grupal.' }));
    }
  }, [token, state.workers]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = backendEventsController.subscribeEvents(
      () => {
        void refresh(true);
      },
      (event) => {
        return event.type === 'PROCESS' && ['IMPORT', 'INDEX', 'AI'].includes((event as any).subsystem);
      }
    );
    return () => unsubscribe();
  }, [refresh]);

  return {
    state,
    viewMode,
    setViewMode,
    refresh,
    handleAction,
    handleGroupAction
  };
}
