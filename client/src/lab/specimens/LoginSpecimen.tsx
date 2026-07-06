import type { LabSpecimen } from '../core/types.js';
import styles from './LoginSpecimen.module.css';

export const loginSpecimen: LabSpecimen = {
  id: 'login',
  name: 'Login',
  variants: [
    { id: 'default', name: 'Default' }
  ],
  getPanelClassName: () => styles.loginPreviewPanel,
  getContentClassName: () => styles.loginPreviewContent,
  Component: () => {
    return (
      <div className={styles.previewLoginCard}>
        <span className={styles.previewLogo}>BN</span>
        <h1>INICIAR SESIÓN</h1>
        <p>Acceso seguro a Blacknails Media</p>
        <div className={styles.previewInput}>USUARIO / CORREO ELECTRÓNICO</div>
        <div className={styles.previewInput}>CONTRASEÑA</div>
        <div className={styles.previewButton}>ACCEDER A LA RED</div>
      </div>
    );
  }
};
