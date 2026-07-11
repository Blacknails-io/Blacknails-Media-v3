import { useState, useEffect } from 'react';

interface FaceAvatarProps {
  thumbnailUrl: string;
  bbox: { x: number; y: number; width: number; height: number };
  size?: number;
  className?: string;
}

export const FaceAvatar = ({ thumbnailUrl, bbox, size = 64, className = '' }: FaceAvatarProps) => {
  const [styles, setStyles] = useState<React.CSSProperties>({ opacity: 0 });
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    if (!thumbnailUrl || !bbox) {
      setError(true);
      return;
    }
    const img = new Image();
    img.src = thumbnailUrl;
    img.onload = () => {
      const scale = size / Math.max(1, bbox.width);
      setStyles({
        position: 'absolute',
        width: `${img.naturalWidth * scale}px`,
        height: `${img.naturalHeight * scale}px`,
        left: `${-bbox.x * scale}px`,
        top: `${-bbox.y * scale}px`,
        maxWidth: 'none',
        opacity: 1,
        transition: 'opacity 0.2s ease',
      });
    };
    img.onerror = () => {
      setError(true);
    };
  }, [thumbnailUrl, bbox, size]);

  return (
    <div 
      className={`relative rounded-full overflow-hidden bg-surface-panel dark:bg-surface-panel border border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)] flex items-center justify-center ${className}`} 
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, position: 'relative', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}
    >
      {error ? (
        <span className="text-secondary dark:text-secondary font-bold text-xs" style={{ color: 'var(--text-secondary)' }}>?</span>
      ) : (
        <img src={thumbnailUrl} alt="Face Crop" style={styles} />
      )}
    </div>
  );
};
