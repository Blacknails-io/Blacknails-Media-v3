import React, { useEffect, useRef, useState } from 'react';
import { LiquidGlass } from '@ybouane/liquidglass';
import styles from './LoginScreen.module.css';
import { BrandLogo } from './BrandLogo.js';
import { useAuth } from '../context/AuthContext.js';

const loginGlassConfig = JSON.stringify({
  floating: false,
  blurAmount: 0,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0,
  fresnel: 1,
  distortion: 0,
  cornerRadius: 40,
  zRadius: 40,
  opacity: 1,
  saturation: 0,
  brightness: 0,
  shadowOpacity: 0.3,
  shadowSpread: 10,
  bevelMode: 0
});

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const liquidGlassRootRef = useRef<HTMLDivElement>(null);
  const liquidGlassPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = liquidGlassRootRef.current;
    const panel = liquidGlassPanelRef.current;
    if (!root || !panel) {
      return;
    }

    let disposed = false;
    let instance: Awaited<ReturnType<typeof LiquidGlass.init>> | null = null;

    LiquidGlass.init({
      root,
      glassElements: [panel]
    })
      .then((glassInstance) => {
        if (disposed) {
          glassInstance.destroy();
          return;
        }
        instance = glassInstance;
      })
      .catch((error) => {
        console.warn('LiquidGlass login effect failed to initialize.', error);
      });

    return () => {
      disposed = true;
      instance?.destroy();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setHasError(true);
      setErrorMessage('Introduce usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    setHasError(false);
    try {
      await login(username, password, rememberMe);
    } catch (err: any) {
      setErrorMessage(err.message || 'Credenciales incorrectas.');
      setIsLoading(false);
      setHasError(true);
    }
  };

  return (
    <div ref={liquidGlassRootRef} className={styles.loginWrapper} data-instance-id="login-viewport" data-glass-stage="calibration">
      <img className={styles.loginBackdrop} src="/demo/liquidglass-background.png" alt="" aria-hidden="true" />
      <svg className={styles.liquidSvgFilters} aria-hidden="true" focusable="false">
        <filter id="login-liquid-distortion" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.017" numOctaves="2" seed="11" result="noise">
            <animate attributeName="baseFrequency" dur="14s" values="0.009 0.017;0.014 0.011;0.009 0.017" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div
        ref={liquidGlassPanelRef}
        className={`${styles.loginCardWrapper} ${hasError ? styles.cardHasError : ""}`}
        data-config={loginGlassConfig}
      >
        
        {/* Glowing Corner Brackets */}
        <div className={`${styles.cornerBracket} ${styles.topLeft}`} />
        <div className={`${styles.cornerBracket} ${styles.topRight}`} />
        <div className={`${styles.cornerBracket} ${styles.bottomLeft}`} />
        <div className={`${styles.cornerBracket} ${styles.bottomRight}`} />

        {/* Central glassmorphic card */}
        <div className={`${styles.loginCard} ${hasError ? styles.cardError : ''}`} data-instance-id="login-card">
          <span className={styles.playgroundGlassLabel}>Glass</span>
          <div className={styles.loginLiquidVolume} aria-hidden="true" />
          {/* Custom vector Brand Logo */}
          <BrandLogo size={38} variant={hasError ? 'red' : 'cyan'} />

          {/* Subtitle */}
          <div className={styles.loginHeader}>
            <h1 className={styles.loginTitle}>INICIAR SESIÓN</h1>
            <p className={styles.loginSubtitle}>Acceso a la red global</p>
          </div>

          {/* Error warning banner */}
          <div className={`${styles.loginErrorSlot} ${hasError ? styles.visible : ''}`} aria-live="polite">
            <div className={styles.loginErrorBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{hasError ? errorMessage : ' '}</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            
            {/* Username Input */}
            <div className={styles.loginInputGroup}>
              <label className={styles.loginInputLabel} htmlFor="username-input">
                USUARIO / CORREO ELECTRÓNICO
              </label>
              <div className={styles.loginInputWrapper}>
                <input
                  id="username-input"
                  data-instance-id="username-input"
                  className={styles.loginInput}
                  type="text"
                  placeholder="Escribe tu usuario o correo..."
                  value={username}
                  autoComplete="username"
                  aria-invalid={hasError}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (hasError) setHasError(false);
                  }}
                  disabled={isLoading}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.loginInputIcon}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>

            {/* Password Input */}
            <div className={styles.loginInputGroup}>
              <label className={styles.loginInputLabel} htmlFor="password-input">
                CONTRASEÑA
              </label>
              <div className={styles.loginInputWrapper}>
                <input
                  id="password-input"
                  data-instance-id="password-input"
                  className={styles.loginInput}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Escribe tu contraseña..."
                  value={password}
                  autoComplete="current-password"
                  aria-invalid={hasError}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (hasError) setHasError(false);
                  }}
                  disabled={isLoading}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.loginInputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <button
                  type="button"
                  className={styles.loginInputToggleBtn}
                  data-instance-id="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.loginSubmitBtn}
              data-instance-id="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Autenticando...' : 'ACCEDER A LA RED'}
            </button>

            {/* Remember me & forgot password row */}
            <div className={styles.loginOptionsRow}>
              <label className={styles.loginCheckboxLabel}>
                <input
                  type="checkbox"
                  className={styles.loginCheckbox}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>RECUÉRDAME</span>
              </label>
              <a
                href="#"
                className={styles.loginOptionsLink}
                onClick={(e) => {
                  e.preventDefault();
                  alert('Recuperación deshabilitada temporalmente.');
                }}
              >
                Recuperar contraseña
              </a>
            </div>
          </form>

          {/* Footer links */}
          <div className={styles.loginFooter}>
            <a
              href="#"
              className={styles.loginFooterLink}
              data-instance-id="register-link"
              onClick={(e) => {
                e.preventDefault();
                alert('Registro deshabilitado temporalmente.');
              }}
            >
              Registrarse en la red
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
export default LoginScreen;
