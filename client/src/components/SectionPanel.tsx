import React from 'react';

interface SectionPanelProps {
  readonly title?: string;
  readonly instanceId: string;
  readonly children: React.ReactNode;
}

export const SectionPanel = ({ title, instanceId, children }: SectionPanelProps) => {
  return (
    <section className="section-panel" data-instance-id={instanceId} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
      {title && (
        <header className="panel-header" data-instance-id={`${instanceId}-header`} style={{ marginBottom: '1.5rem' }}>
          <h2 className="panel-title" data-instance-id={`${instanceId}-title`} style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <span className="logo-highlight" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>//</span> {title}
          </h2>
        </header>
      )}
      <div className="panel-body" data-instance-id={`${instanceId}-body`}>
        {children}
      </div>
    </section>
  );
};
