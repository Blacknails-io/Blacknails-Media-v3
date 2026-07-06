import type { CSSProperties } from 'react';
import type { LabSpecimen } from '../core/types.js';
import styles from '../core/VisualLab.module.css';

const textTokenSpecs = [
  { key: 'primary', name: 'Primary', token: '--text-primary', sample: 'Archive command ready' },
  { key: 'secondary', name: 'Secondary', token: '--text-secondary', sample: 'Media intelligence synchronized' },
  { key: 'tertiary', name: 'Tertiary', token: '--text-tertiary', sample: 'Last scan 03:17:42' },
  { key: 'disabled', name: 'Disabled', token: '--text-disabled', sample: 'Offline worker channel' }
] as const;

const stateTokenSpecs = [
  { key: 'active', name: 'Active', token: '--accent-cyan', sample: 'Gallery index online' },
  { key: 'error', name: 'Error', token: '--accent-ruby', sample: 'Authentication rejected' },
  { key: 'warning', name: 'Warning', token: '--accent-amber', sample: 'Derivative queue delayed' },
  { key: 'success', name: 'Success', token: '--accent-lime', sample: 'AI metadata complete' }
] as const;

export const calibrationSpecimen: LabSpecimen = {
  id: 'calibration',
  name: 'Calibration',
  variants: [
    { id: 'default', name: 'Default' }
  ],
  getPanelClassName: () => styles.calibrationPreviewPanel,
  Component: () => {
    return (
      <div className={styles.calibrationSpecimen} data-instance-id="visual-lab-calibration">
        <header className={styles.calibrationHeader}>
          <div>
            <p>Lab-only token calibration</p>
            <h1>Archive terminal clarity</h1>
          </div>
          <span>LAB</span>
        </header>

        <section className={styles.calibrationTypeStack} aria-label="Typography tokens">
          {textTokenSpecs.map((item) => (
            <article className={styles.typeTokenRow} key={item.token}>
              <div>
                <span>{item.name}</span>
                <strong data-token={item.token} style={{ color: `var(${item.token})` }}>{item.sample}</strong>
              </div>
              <code>{item.token}</code>
            </article>
          ))}
        </section>

        <section className={styles.calibrationStateGrid} aria-label="State tokens">
          {stateTokenSpecs.map((item) => (
            <article className={styles.stateTokenCard} key={item.token} style={{ '--state-color': `var(${item.token})` } as CSSProperties}>
              <span>{item.name}</span>
              <strong data-token={item.token}>{item.sample}</strong>
              <code>{item.token}</code>
            </article>
          ))}
        </section>

        <section className={styles.calibrationMediaBand} aria-label="Media-neutral sample">
          <div className={styles.mediaSwatchA} />
          <div className={styles.mediaSwatchB} />
          <div className={styles.mediaSwatchC} />
          <p>Media stays color-true while terminal chrome carries status.</p>
        </section>
      </div>
    );
  }
};
