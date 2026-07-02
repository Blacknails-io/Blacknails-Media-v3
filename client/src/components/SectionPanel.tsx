import React from 'react';

interface SectionPanelProps {
  readonly title?: string;
  readonly instanceId: string;
  readonly children: React.ReactNode;
}

export const SectionPanel = ({ title, instanceId, children }: SectionPanelProps) => {
  return (
    <section className="section-panel" data-instance-id={instanceId}>
      {title && (
        <header className="panel-header" data-instance-id={`${instanceId}-header`}>
          <h2 className="panel-title" data-instance-id={`${instanceId}-title`}>
            <span className="logo-highlight">//</span> {title}
          </h2>
        </header>
      )}
      <div className="panel-body" data-instance-id={`${instanceId}-body`}>
        {children}
      </div>
    </section>
  );
};
