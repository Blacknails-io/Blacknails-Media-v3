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

export function useWorkerCardLogic(workerId: string, token: string | null, initialWorker?: PipelineWorkerDTO) {
  const [worker, setWorker] = useState<PipelineWorkerDTO | null>(initialWorker || null);
  const [isLoading, setIsLoading] = useState(!initialWorker);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const data = await pipelineService.getWorker(token, workerId);
      setWorker(data);
    } catch (err: any) {
      if (!silent) {
        setError(err?.message || 'Error cargando estado.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [workerId, token]);

  const handleAction = useCallback(async (action: 'start' | 'stop' | 'trigger' | 'reset') => {
    if (!token) return;
    setError(null);
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
      setWorker(updated);
    } catch (err: any) {
      setError(err?.message || 'Error al ejecutar la acción.');
    }
  }, [workerId, token]);

  useEffect(() => {
    if (!initialWorker) {
      void refresh();
    }
  }, [refresh, initialWorker]);

  useEffect(() => {
    const isEventForWorker = (eventProcessName: string | undefined, wId: string): boolean => {
      if (!eventProcessName) return false;
      const normEvent = eventProcessName.toUpperCase().trim();
      const normWorker = wId.toUpperCase().trim().replace(/-/g, '_');
      if (normEvent === normWorker) return true;

      const mappings: Record<string, string> = {
        'IMPORT': 'IMPORT_WORKER',
        'INDEX': 'INDEX_WORKER',
        'DESCRIPTION': 'DESCRIPTION_WORKER',
        'TAGS': 'TAGS_WORKER',
        'TITLE': 'TITLE_WORKER',
        'NSFW': 'NSFW_WORKER',
        'FACE_DETECTION': 'FACE_WORKER',
        'FACE_CLUSTERING': 'FACE_CLUSTER_WORKER'
      };

      const mapped = mappings[normEvent];
      return mapped === normWorker || mapped === wId.toUpperCase().trim();
    };

    const unsubscribe = backendEventsController.subscribeEvents(
      () => {
        void refresh(true);
      },
      (event) => {
        return event.type === 'PROCESS' && isEventForWorker((event as any).processName, workerId);
      }
    );
    return () => unsubscribe();
  }, [workerId, refresh]);

  return {
    worker,
    isLoading,
    error,
    refresh,
    handleAction
  };
}
