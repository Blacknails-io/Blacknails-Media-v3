import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { PipelineNodeVisual } from './PipelineNodeVisual.js';
import styles from './PipelineNode.module.css';

export type NodeStatus = 'off' | 'idle' | 'running' | 'completed' | 'error' | 'source-active';

export type PipelineNodeData = {
  title: string;
  status: NodeStatus;
  isActive: boolean;
  isCore?: boolean;
  onToggle?: (id: string, active: boolean) => void;
};

export const PipelineNode: React.FC<any> = ({ id, data, isConnectable, selected }) => {
  const { title, status, isActive, isCore = false, onToggle } = data as PipelineNodeData;

  return (
    <div data-testid={`pipeline-node-${id}`}>
      <PipelineNodeVisual
        title={title}
        instanceId={`${id.replace(/^(core-|mod-)/, '')}-task-card`}
        status={status}
        isActive={isActive}
        isCore={isCore}
        showExecutionData={true}
        selected={selected}
        onToggle={() => onToggle && onToggle(id, status === 'running')}
      >
        <Handle 
          type="target" 
          position={Position.Left} 
          isConnectable={isConnectable}
          className={`${styles.port} ${styles.portIn}`}
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          isConnectable={isConnectable}
          className={`${styles.port} ${styles.portOut}`}
        />
      </PipelineNodeVisual>
    </div>
  );
};
