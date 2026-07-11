import React from 'react';
import styles from './PipelineNode.module.css';
import type { NodeStatus } from './PipelineNode.js';

export type PipelineNodeVisualProps = {
  title: string;
  instanceId?: string;
  status?: NodeStatus;
  isActive?: boolean;
  isCore?: boolean;
  errorCount?: number;
  showExecutionData?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  customBody?: React.ReactNode;
  children?: React.ReactNode;
};

export const PipelineNodeVisual: React.FC<PipelineNodeVisualProps> = ({
  title,
  instanceId,
  status = 'idle',
  isActive = true,
  isCore = false,
  errorCount = 0,
  showExecutionData = true,
  selected = false,
  onToggle,
  customBody,
  children
}) => {

  const getStatusClass = () => {
    switch (status) {
      case 'running': return styles.statusRunning;
      case 'completed': return styles.statusCompleted;
      case 'error': return styles.statusError;
      case 'source-active': return styles.statusSourceActive;
      case 'off': return styles.statusOff;
      case 'idle':
      default: return styles.statusIdle;
    }
  };

  const containerClasses = [
    styles.nodeContainer,
    isActive ? getStatusClass() : styles.inactive,
    !showExecutionData ? styles.isTemplate : '',
    selected ? styles.isSelected : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} data-instance-id={instanceId}>
      <div className={styles.isometricCard}>
        {/* 4 Corner Brackets for Cyber-noir vibe */}
        <div className={`${styles.bracket} ${styles.bracketTopLeft}`} />
        <div className={`${styles.bracket} ${styles.bracketTopRight}`} />
        <div className={`${styles.bracket} ${styles.bracketBottomLeft}`} />
        <div className={`${styles.bracket} ${styles.bracketBottomRight}`} />

        {/* This will render Handles (input/output) if they are passed as children */}
        {children}

        <div className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
          </div>
          
          {showExecutionData ? (
            <>

              {/* Main Info */}
              {customBody ? (
                customBody
              ) : (
                <div className={styles.body}>
                  <div className={styles.statGroup}>
                    <span className={styles.statLabel}>STATUS</span>
                    <span className={styles.statStatus}>{status.toUpperCase()}</span>
                  </div>
                  {errorCount > 0 && (
                    <div className={styles.statGroup}>
                      <span className={styles.statLabel}>ERRORS</span>
                      <span className={styles.statError}>{errorCount} detected</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Power Switch for Core nodes */}
              <div className={styles.footer}>
                <div className={styles.coreBadge}>
                  {isCore ? 'CORE SYSTEM' : 'PIPELINE MOD'}
                </div>
                {onToggle && (
                  <div 
                    className={styles.toggleWrapper} 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onToggle(); 
                    }}
                  >
                    <span className={styles.toggleLabel}>PWR</span>
                    <div className={`${styles.toggleTrack} ${status === 'running' ? styles.checked : ''}`}>
                      <div className={styles.toggleThumb} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.statsGrid} style={{ opacity: 0.5 }}>
               <div className={styles.statGroup}>
                  <span className={styles.statLabel}>TYPE</span>
                  <span className={styles.statValue}>{isCore ? 'SYSTEM CORE' : 'OPTIONAL MOD'}</span>
                </div>
                <div className={styles.statGroup}>
                  <span className={styles.statLabel}>DRAG TO CANVAS</span>
                  <span className={styles.statStatus}>AVAILABLE</span>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
