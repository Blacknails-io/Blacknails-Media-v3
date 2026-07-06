import type { LabSpecimen } from '../core/types.js';
import styles from './LogoSpecimen.module.css';

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const logoSpecimen: LabSpecimen = {
  id: 'logo',
  name: 'Logo',
  variants: [
    { id: 'lockup', name: 'Lockup' },
    { id: 'badge', name: 'Badge' },
    { id: 'monogram', name: 'Monogram' }
  ],
  getPanelClassName: (variantId) => {
    return joinClassNames(
      variantId !== 'monogram' && styles.logoPreviewPanel,
      variantId === 'badge' && styles.logoBadgePanel,
      variantId === 'monogram' && styles.logoMonogramPanel
    );
  },
  Component: () => {
    return null;
  }
};
