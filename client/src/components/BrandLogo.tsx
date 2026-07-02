import React from 'react';
import styles from './BrandLogo.module.css';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'cyan' | 'purple' | 'red';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 46,
  showText = true,
  className = '',
  variant = 'cyan'
}) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'purple':
        return { start: '#a855f7', end: '#d8b4fe' };
      case 'red':
        return { start: '#ff2a2a', end: '#fca5a5' };
      case 'cyan':
      default:
        return { start: '#00f0ff', end: '#a855f7' };
    }
  };

  const colors = getGradientColors();

  return (
    <div className={`${styles.loginLogoContainer} ${className}`} style={{ gap: showText ? '12px' : '0' }}>
      {/* Premium Cyber-noir SVG Isotype B (with tech circuit/node styling) */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: `drop-shadow(0 0 4px ${colors.start}50)` }}
      >
        {/* Left vertical circuit trace bar */}
        <rect x="20" y="15" width="6" height="70" rx="3" fill={`url(#logo-grad-${variant})`} />
        <circle cx="23" cy="15" r="4.5" fill={variant === 'red' ? '#ff2a2a' : '#00ffff'} />
        <circle cx="23" cy="50" r="4.5" fill={variant === 'red' ? '#ff2a2a' : '#a855f7'} />
        <circle cx="23" cy="85" r="4.5" fill={variant === 'red' ? '#ff2a2a' : '#00ffff'} />
        
        {/* Right upper B loop arc */}
        <path 
          d="M34 22H56C64 22 70 28 70 35C70 42 64 48 56 48H34" 
          stroke={`url(#logo-grad-${variant})`} 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path d="M42 35H56" stroke={variant === 'red' ? '#ff2a2a' : '#00ffff'} strokeWidth="4" strokeLinecap="round" />
        
        {/* Right lower B loop arc */}
        <path 
          d="M34 48H58C66 48 72 54 72 62C72 70 66 76 58 76H34" 
          stroke={`url(#logo-grad-${variant})`} 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path d="M42 62H58" stroke={variant === 'red' ? '#ff2a2a' : '#a855f7'} strokeWidth="4" strokeLinecap="round" />

        {/* Horizontal connect link traces */}
        <line x1="30" y1="35" x2="42" y2="35" stroke={`url(#logo-grad-${variant})`} strokeWidth="4" />
        <line x1="30" y1="62" x2="42" y2="62" stroke={`url(#logo-grad-${variant})`} strokeWidth="4" />
        
        <defs>
          <linearGradient id={`logo-grad-${variant}`} x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor={colors.start} />
            <stop offset="1" stopColor={colors.end} />
          </linearGradient>
        </defs>
      </svg>
      
      {showText && (
        <div className={styles.loginLogoText}>
          <span className={styles.logoTextBrand}>Blacknails</span>
          <span 
            className={styles.logoTextSub} 
            style={{ 
              color: variant === 'red' ? 'var(--color-neon-red)' : (variant === 'purple' ? 'var(--color-neon-purple)' : 'var(--color-brand-cyan)'),
              textShadow: variant === 'red' ? '0 0 12px rgba(255, 42, 42, 0.3)' : (variant === 'purple' ? '0 0 12px rgba(168, 85, 247, 0.3)' : '0 0 12px rgba(0, 255, 204, 0.3)')
            }}
          >
            Media
          </span>
        </div>
      )}
    </div>
  );
};
