import React from 'react';
import { PipelineCanvas } from './PipelineCanvas.js';
import { PipelineSidebar } from './PipelineSidebar.js';

import { ReactFlowProvider } from '@xyflow/react';

export const PipelineControlCenter: React.FC = () => {
  return (
    <ReactFlowProvider>
      <div 
        data-testid="pipeline-control-center" 
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <PipelineCanvas />
        <PipelineSidebar />
      </div>
    </ReactFlowProvider>
  );
};
