export interface PipelineWorkerDTO {
  id: string;
  label: string;
  isRunning: boolean;
  isExecuting?: boolean;
  currentAssetType?: 'PHOTO' | 'VIDEO';
  intervalMs: number;
  pendingItems: number;
  lastRunAt?: string;
  lastTriggeredAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  provides: string[];
  requires: string[];
}
