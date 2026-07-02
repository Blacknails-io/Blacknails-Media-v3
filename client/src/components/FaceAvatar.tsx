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
      // Calculate crop scale based on container size and face bounding box width
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
  }, [thumbnailUrl, bbox?.x, bbox?.y, bbox?.width, bbox?.height, size]);

  return (
    <div 
      className={`relative rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 flex items-center justify-center ${className}`} 
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0 }}
    >
      {error ? (
        <span className="text-zinc-400 dark:text-zinc-500 font-bold text-xs">?</span>
      ) : (
        <img src={thumbnailUrl} alt="Face Crop" style={styles} />
      )}
    </div>
  );
};
