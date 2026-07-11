import React from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './DataSourceNode.module.css';
import { PipelineNodeVisual } from './PipelineNodeVisual.js';

export const DataSourceNode: React.FC<any> = ({ data, isConnectable }) => {
  // Pure visual component. Logic is injected via data.
  const hasData = data?.hasData || false;
  const pendingFiles = data?.pendingFiles || 0;

  const bodyContent = (
    <div className={styles.sourceContent}>
       <div className={styles.info}>
         <div className={styles.label}>PENDING FILES: <span className={styles.value}>{pendingFiles}</span></div>
       </div>
       <div className={`${styles.miniAtom} ${hasData ? styles.active : styles.idle}`}>
          <div className={styles.nucleus}></div>
          <div className={`${styles.orbit} ${styles.orbit1}`}><div className={styles.electron}></div></div>
          <div className={`${styles.orbit} ${styles.orbit2}`}><div className={styles.electron}></div></div>
          <div className={`${styles.orbit} ${styles.orbit3}`}><div className={styles.electron}></div></div>
       </div>
    </div>
  );

  return (
    <PipelineNodeVisual 
      title="📡 RAW DATA SOURCE"
      instanceId="raw-data-source-card"
      status={hasData ? 'source-active' as any : 'idle'} 
      isActive={hasData}
      showExecutionData={true}
      customBody={bodyContent}
    >
      <Handle 
        type="source" 
        position={Position.Right} 
        isConnectable={isConnectable}
        className={styles.port}
      />
    </PipelineNodeVisual>
  );
};
