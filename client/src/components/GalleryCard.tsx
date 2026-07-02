import Atropos from 'atropos/react';
import 'atropos/atropos.css';
import './GalleryCard.css';
import type { MediaAsset } from '../types/MediaAsset.js';
import type { MouseEvent } from 'react';

interface GalleryCardProps {
  readonly asset: MediaAsset;
  readonly isSelected?: boolean;
  readonly onToggleSelect?: (id: string, e: MouseEvent) => void;
  readonly onClick?: (asset: MediaAsset) => void;
}

export const GalleryCard = ({
  asset,
  isSelected = false,
  onToggleSelect,
  onClick
}: GalleryCardProps) => {
  const isPlayable = asset.type === 'VIDEO';
  const openAsset = (event?: MouseEvent) => {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('.prosumer-card-checkbox')) {
      return;
    }
    if (onClick) onClick(asset);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlayable) {
      const video = e.currentTarget.querySelector('video');
      if (video) {
        video.play().catch(() => {});
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlayable) {
      const video = e.currentTarget.querySelector('video');
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }
  };

  return (
    <div className="prosumer-card-click-zone" onClick={openAsset}>
      <Atropos 
        className="prosumer-card-atropos-wrapper"
        activeOffset={20}
        shadow={true}
        highlight={true}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className={`prosumer-card-wrapper group ${isSelected ? 'selected' : ''}`} 
          data-instance-id={`${asset.id}-gallery-card`}
        >
          {/* Fondo de Imagen */}
          {isPlayable ? (
            <video
              src={asset.videoPreviewUrl || asset.imageUrl}
              poster={asset.imageUrl}
              className="prosumer-card-image"
              data-atropos-offset="-2"
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <img 
              src={asset.imageUrl} 
              alt={asset.title} 
              className="prosumer-card-image" 
              data-atropos-offset="-2" 
            />
          )}

          {/* Gradiente Oscuro en la parte inferior */}
          <div className="prosumer-card-gradient" data-atropos-offset="0"></div>

          {/* Checkbox de Selección */}
          {onToggleSelect && (
            <div 
              className={`prosumer-card-checkbox ${isSelected ? 'checked' : ''}`}
              data-atropos-offset="6"
              onClick={(e) => onToggleSelect(asset.id, e)}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          )}

          {/* Tipo de Media / Badge */}
          <span className="prosumer-card-badge" data-atropos-offset="3">
            {asset.type}
          </span>

          {/* Overlay Holográfico de Play para Vídeos */}
          {isPlayable && (
            <div className="prosumer-card-play-overlay" data-atropos-offset="8">
              <div className="prosumer-play-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
            </div>
          )}

          {/* Información y Metadatos Inferiores */}
          <div className="prosumer-card-content">
            <h3 className="prosumer-card-title" data-atropos-offset="4">{asset.title}</h3>
            <div className="prosumer-card-meta" data-atropos-offset="2">
              <span>{asset.metadata.resolution || asset.metadata.fileSize || 'Unknown Size'}</span>
              <span>•</span>
              <span>{asset.date}</span>
            </div>
          </div>

        </div>
      </Atropos>
    </div>
  );
};
