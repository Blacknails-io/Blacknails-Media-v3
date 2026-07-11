import React, { useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PipelineNode } from './PipelineNode.js';
import { DataSourceNode } from './DataSourceNode.js';
import { usePipelineOrchestrator } from '../hooks/usePipelineOrchestrator.js';

const nodeTypes = {
  core: PipelineNode,
  mod: PipelineNode,
  dataSource: DataSourceNode,
};

export const PipelineCanvas: React.FC = () => {
  const { screenToFlowPosition } = useReactFlow();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes } = usePipelineOrchestrator();

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      setNodes((nds) => {
        // Only keep nodes that are NOT (selected AND deletable)
        const newNodes = nds.filter(n => !(n.selected && n.deletable !== false));
        return newNodes;
      });
    }
  }, [setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const title = event.dataTransfer.getData('application/reactflow/title');
      const baseId = event.dataTransfer.getData('application/reactflow/id') || Date.now().toString();

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `mod-${baseId}`,
        type,
        position,
        data: { 
          title: title, 
          status: 'idle', 
          errorCount: 0, 
          isCore: false, 
          isActive: false 
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  return (
    <div 
      data-testid="pipeline-canvas"
      style={{ flex: 1, position: 'relative', height: '100%', backgroundColor: 'var(--bg-base)' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onKeyDown={onKeyDown}
        nodeTypes={nodeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
      >
        <Background gap={20} size={1} color="rgba(0, 255, 255, 0.1)" />
        <Controls style={{ backgroundColor: 'var(--color-glass-panel)', fill: 'var(--color-neon-cyan)' }} />
        <MiniMap 
          nodeColor={(n) => {
            if (n.data.status === 'running') return '#00ffff';
            if (n.data.status === 'completed') return '#22c55e';
            if (n.data.status === 'error') return '#ef4444';
            return '#1a202c';
          }}
          maskColor="rgba(10, 20, 30, 0.8)"
          style={{ backgroundColor: 'var(--color-glass-panel)', border: '1px solid var(--border-color)' }}
        />
      </ReactFlow>
    </div>
  );
};
