import React from 'react';
import { PipelineNodeVisual } from './PipelineNodeVisual.js';
import { useNodes } from '@xyflow/react';

const MOD_NODES = [
  { id: 'ai-tag', title: '🤖 Etiquetado IA', type: 'mod' },
  { id: 'transcribe', title: '🎙️ Transcripción', type: 'mod' },
  { id: 'semantic', title: '🔍 Búsqueda Semántica', type: 'mod' },
  { id: 'dedup', title: '👯 Deduplicación', type: 'mod' },
  { id: 'face-rec', title: '😊 Reconocimiento Facial', type: 'mod' },
];

export const PipelineSidebar: React.FC = () => {
  const canvasNodes = useNodes();

  // Filter out nodes that are already placed on the canvas
  const availableMods = MOD_NODES.filter(
    (mod) => !canvasNodes.some((cn) => cn.data?.title === mod.title)
  );

  console.log('PipelineSidebar render:', { canvasNodes: canvasNodes.map(n => n.id), availableMods: availableMods.map(m => m.id) });

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeTitle: string, nodeId: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/title', nodeTitle);
    event.dataTransfer.setData('application/reactflow/id', nodeId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const renderNodeList = (nodes: typeof MOD_NODES) => {
    if (nodes.length === 0) {
      return (
        <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem', padding: '1rem' }}>
          Todos los módulos están en uso.
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
        {nodes.map((node) => (
          <div 
            key={node.id}
            style={{ 
              height: '95px',
              transition: 'height 0.2s ease',
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <div
              style={{ 
                cursor: 'grab', 
                width: '280px', 
                transform: 'scale(0.6)', 
                transformOrigin: 'top center',
                transition: 'opacity 0.2s ease'
              }}
              onDragStart={(event) => onDragStart(event, node.type, node.title, node.id)}
              draggable
            >
              <PipelineNodeVisual 
                title={node.title}
                instanceId={`${node.id}-task-card`}
                status="idle"
                isActive={true}
                isCore={node.type === 'core'}
                showExecutionData={false}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <aside 
      data-testid="pipeline-sidebar"
      style={{
        width: '280px',
        borderLeft: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '1.2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        zIndex: 5,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      <section>
        <h3 style={{ color: 'var(--color-neon-purple)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', textAlign: 'center' }}>
          Módulos Opcionales
        </h3>
        {renderNodeList(availableMods)}
      </section>
    </aside>
  );
};
