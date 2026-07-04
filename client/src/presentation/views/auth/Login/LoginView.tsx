import { BrandLogo } from '../../../../components/BrandLogo.js';
import { LiquidGlassSurface, surfacePresets } from '../../../ui/surfaces/LiquidGlassSurface/index.js';
import styles from './Login.module.css';
import type { LoginLogic } from './useLoginLogic.js';

interface LoginViewProps {
  logic: LoginLogic;
}

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export function LoginView({ logic }: LoginViewProps) {
  return (
    <LiquidGlassSurface
      className={styles.loginViewport}
      backgroundClassName={styles.loginBackdrop}
      panelClassName={joinClassNames(styles.loginPanel, logic.hasError && styles.panelError)}
      contentClassName={styles.loginPanelContent}
      config={surfacePresets.loginPanel}
      rootInstanceId="login-viewport"
      panelInstanceId="login-card"
      background={(
        <>
          <img className={styles.backdropImage} src="/demo/liquidglass-background.png" alt="" />
          <div className={styles.backdropLightField} />
        </>
      )}
    >
      <span className={joinClassNames(styles.corner, styles.cornerTopLeft)} aria-hidden="true" />
      <span className={joinClassNames(styles.corner, styles.cornerTopRight)} aria-hidden="true" />
      <span className={joinClassNames(styles.corner, styles.cornerBottomLeft)} aria-hidden="true" />
      <span className={joinClassNames(styles.corner, styles.cornerBottomRight)} aria-hidden="true" />

      <BrandLogo size={38} variant={logic.hasError ? 'red' : 'cyan'} />

      <header className={styles.loginHeader}>
        <h1 className={styles.loginTitle}>INICIAR SESIÓN</h1>
        <p className={styles.loginSubtitle}>Acceso seguro a Blacknails Media</p>
      </header>

      <div className={joinClassNames(styles.errorSlot, logic.hasError && styles.errorSlotVisible)} aria-live="polite">
        <div className={styles.errorBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{logic.hasError ? logic.errorMessage : ' '}</span>
        </div>
      </div>

      <form onSubmit={logic.handleSubmit} className={styles.loginForm}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="username-input">
            USUARIO / CORREO ELECTRÓNICO
          </label>
          <div className={styles.inputShell}>
            <input
              id="username-input"
              data-instance-id="username-input"
              className={styles.loginInput}
              type="text"
              placeholder="Escribe tu usuario o correo..."
              value={logic.username}
              autoComplete="username"
              aria-invalid={logic.hasError}
              onChange={(event) => {
                logic.setUsername(event.target.value);
                if (logic.hasError) logic.clearError();
              }}
              disabled={logic.isLoading}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.inputIcon} aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="password-input">
            CONTRASEÑA
          </label>
          <div className={styles.inputShell}>
            <input
              id="password-input"
              data-instance-id="password-input"
              className={styles.loginInput}
              type={logic.showPassword ? 'text' : 'password'}
              placeholder="Escribe tu contraseña..."
              value={logic.password}
              autoComplete="current-password"
              aria-invalid={logic.hasError}
              onChange={(event) => {
                logic.setPassword(event.target.value);
                if (logic.hasError) logic.clearError();
              }}
              disabled={logic.isLoading}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.inputIcon} aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <button
              type="button"
              className={styles.passwordToggle}
              data-instance-id="password-toggle-btn"
              onClick={logic.togglePasswordVisibility}
              disabled={logic.isLoading}
              aria-label={logic.showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {logic.showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" className={styles.submitButton} data-instance-id="login-submit-btn" disabled={logic.isLoading}>
          {logic.isLoading ? 'Autenticando...' : 'ACCEDER A LA RED'}
        </button>

        <div className={styles.optionsRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={logic.rememberMe}
              onChange={(event) => logic.setRememberMe(event.target.checked)}
              disabled={logic.isLoading}
            />
            <span>RECUÉRDAME</span>
          </label>
          <a
            href="#"
            className={styles.textLink}
            onClick={(event) => {
              event.preventDefault();
              alert('Recuperación deshabilitada temporalmente.');
            }}
          >
            Recuperar contraseña
          </a>
        </div>
      </form>

      <footer className={styles.loginFooter}>
        <a
          href="#"
          className={styles.textLink}
          data-instance-id="register-link"
          onClick={(event) => {
            event.preventDefault();
            alert('Registro deshabilitado temporalmente.');
          }}
        >
          Registrarse en la red
        </a>
      </footer>
    </LiquidGlassSurface>
  );
}
