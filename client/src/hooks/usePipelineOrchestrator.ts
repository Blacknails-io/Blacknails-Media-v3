import { useCallback, useEffect, useMemo } from 'react';
import { backendEventsController } from '../controllers/BackendEventsController.js';
import {
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';

const Y_SPACING = 150;
const X_SPACING = 300;

export const usePipelineOrchestrator = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const onNodeToggle = useCallback(async (nodeId: string, currentIsRunning: boolean) => {
    try {
      const action = currentIsRunning ? 'stop' : 'start';
      await fetch(`/api/admin/pipeline/workers/${nodeId}/${action}`, { method: 'POST' });
      // UI will update on next polling cycle
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch('/api/admin/pipeline/workers');
        if (!res.ok) return;
        const data = await res.json();
        
        // Build nodes
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        // Simple hardcoded layout for now based on index
        data.forEach((worker: any, index: number) => {
          const row = Math.floor(index / 4);
          const col = index % 4;
          
          newNodes.push({
            id: worker.id,
            type: 'core',
            position: { x: col * X_SPACING, y: row * Y_SPACING },
            data: {
              title: worker.label,
              status: worker.isRunning ? 'running' : 'off',
              isActive: worker.isRunning,
              pendingItems: worker.pendingItems || 0,
              currentlyProcessing: worker.currentlyProcessing || 0,
              isCore: true
            }
          });

          // Draw edges based on requires -> provides. 
          worker.requires.forEach((reqStr: string) => {
            const providerNode = data.find((w: any) => w.provides.includes(reqStr));
            if (providerNode) {
              newEdges.push({
                id: `e-${providerNode.id}-${worker.id}`,
                source: providerNode.id,
                target: worker.id,
                animated: worker.isRunning && providerNode.isRunning,
                type: 'smoothstep',
                style: { stroke: worker.isRunning ? '#00ffff' : 'rgba(255, 255, 255, 0.2)', strokeWidth: 2 }
              });
            }
          });
        });

        setNodes(newNodes);
        setEdges(newEdges);
      } catch (err) {
        console.error(err);
      }
    };

    fetchWorkers();
    
    let fetchTimeout: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = backendEventsController.subscribeEvents(() => {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
      fetchTimeout = setTimeout(() => {
        fetchWorkers();
      }, 500);
    });

    return () => {
      unsubscribe();
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
    };
  }, [setNodes, setEdges]);

  const nodesWithToggle = useMemo(() => nodes.map(n => ({
    ...n,
    data: { 
      ...n.data, 
      onToggle: () => onNodeToggle(n.id, n.data.isActive as boolean) 
    }
  })), [nodes, onNodeToggle]);

  return {
    nodes: nodesWithToggle,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges
  };
};
