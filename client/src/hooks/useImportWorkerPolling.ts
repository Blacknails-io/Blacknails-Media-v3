import { useEffect } from 'react';
import { pipelineService } from '../services/api/index.js';
import type { PipelineWorkerDTO } from '../services/api/interfaces.js';

export const useImportWorkerPolling = (
  token: string | null,
  setWorkers: React.Dispatch<React.SetStateAction<PipelineWorkerDTO[]>>
) => {
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      pipelineService.getWorker(token, 'import-worker')
        .then((updatedWorker) => {
          setWorkers((prevWorkers) => 
            prevWorkers.map(w => w.id === 'import-worker' ? updatedWorker : w)
          );
        })
        .catch((err) => {
          console.error('Error polling import worker:', err);
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [token, setWorkers]);
};
