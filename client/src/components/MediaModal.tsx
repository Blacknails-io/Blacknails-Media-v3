import { useEffect, useMemo, useState } from 'react';
import './MediaModal.css';
import type { MediaAsset } from '../types/MediaAsset.js';

interface MediaModalProps {
  readonly asset: MediaAsset | null;
  readonly assets?: readonly MediaAsset[];
  readonly isSelected?: boolean;
  readonly onClose: () => void;
  readonly onNavigate?: (asset: MediaAsset) => void;
  readonly onToggleSelected?: (assetId: string) => void;
}

export const MediaModal = ({
  asset,
  assets = [],
  isSelected = false,
  onClose,
  onNavigate,
  onToggleSelected
}: MediaModalProps) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const currentIndex = useMemo(() => {
    if (!asset) return -1;
    return assets.findIndex((candidate) => candidate.id === asset.id);
  }, [asset, assets]);

  const canNavigate = currentIndex >= 0 && assets.length > 1;
  const previousAsset = canNavigate ? assets[(currentIndex - 1 + assets.length) % assets.length] : null;
  const nextAsset = canNavigate ? assets[(currentIndex + 1) % assets.length] : null;

  useEffect(() => {
    if (!asset) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'ArrowLeft' && previousAsset && onNavigate) {
        event.preventDefault();
        onNavigate(previousAsset);
      }

      if (event.key === 'ArrowRight' && nextAsset && onNavigate) {
        event.preventDefault();
        onNavigate(nextAsset);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asset, nextAsset, onClose, onNavigate, previousAsset]);

  useEffect(() => {
    setCopyState('idle');
  }, [asset?.id]);

  if (!asset) return null;

  const handleCopyOriginalUrl = async () => {
    try {
      await navigator.clipboard.writeText(asset.originalUrl);
      setCopyState('copied');
    } catch (error) {
      console.error('Error copying original URL:', error);
      setCopyState('failed');
    }
  };

  const copyLabel = copyState === 'copied' ? 'Copiado' : copyState === 'failed' ? 'No copiado' : 'Copiar ruta';

  return (
    <div
      className="prosumer-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="prosumer-modal-container" onClick={(event) => event.stopPropagation()}>
        <button className="prosumer-modal-close" onClick={onClose} aria-label="Cerrar visor">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {previousAsset && onNavigate && (
          <button className="prosumer-modal-nav previous" onClick={() => onNavigate(previousAsset)} aria-label="Asset anterior">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {nextAsset && onNavigate && (
          <button className="prosumer-modal-nav next" onClick={() => onNavigate(nextAsset)} aria-label="Asset siguiente">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        <div className="prosumer-modal-visual">
          {asset.type === 'VIDEO' ? (
            <video src={asset.originalUrl} className="prosumer-modal-img" controls autoPlay playsInline />
          ) : (
            <img src={asset.originalUrl} alt={asset.title} className="prosumer-modal-img" />
          )}
        </div>

        <div className="prosumer-modal-sidebar">
          <div className="prosumer-modal-header">
            <div className="prosumer-modal-eyebrow">
              <span>{asset.type}</span>
              <span>{asset.date}</span>
            </div>
            <h2 className="prosumer-modal-title" id="media-modal-title">{asset.title}</h2>
            <p className="prosumer-modal-description">{asset.description || 'Sin descripción IA disponible.'}</p>
            {currentIndex >= 0 && (
              <p className="prosumer-modal-position">{currentIndex + 1} de {assets.length}</p>
            )}
          </div>

          <div className="prosumer-modal-actions">
            <a className="prosumer-modal-action primary" href={asset.originalUrl} target="_blank" rel="noreferrer">
              Abrir original
            </a>
            <button type="button" className="prosumer-modal-action" onClick={handleCopyOriginalUrl}>
              {copyLabel}
            </button>
            {onToggleSelected && (
              <button
                type="button"
                className={`prosumer-modal-action ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleSelected(asset.id)}
              >
                {isSelected ? 'Seleccionado' : 'Seleccionar'}
              </button>
            )}
          </div>

          <div className="prosumer-modal-tags">
            {asset.tags && asset.tags.length > 0 ? (
              asset.tags.map(tag => (
                <span key={tag} className="prosumer-modal-tag">{tag}</span>
              ))
            ) : (
              <span className="prosumer-modal-tag muted">Sin tags</span>
            )}
          </div>

          <div className="prosumer-metadata-panel">
            <h3 className="prosumer-metadata-section-title">Media</h3>

            <div className="prosumer-metadata-row">
              <span className="prosumer-metadata-key">Tamaño</span>
              <span className="prosumer-metadata-val">{asset.metadata.fileSize}</span>
            </div>

            {asset.metadata.resolution && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">Resolución</span>
                <span className="prosumer-metadata-val">{asset.metadata.resolution}</span>
              </div>
            )}

            {asset.metadata.duration && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">Duración</span>
                <span className="prosumer-metadata-val">{asset.metadata.duration}</span>
              </div>
            )}

            <div className="prosumer-metadata-row">
              <span className="prosumer-metadata-key">Clearance</span>
              <span className="prosumer-metadata-val">{asset.clearance}</span>
            </div>

            <h3 className="prosumer-metadata-section-title">EXIF / AI</h3>

            <div className="prosumer-metadata-row">
              <span className="prosumer-metadata-key">ID</span>
              <span className="prosumer-metadata-val" title={asset.id}>{asset.id}</span>
            </div>

            {asset.metadata.gpsCoords && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">GPS</span>
                <span className="prosumer-metadata-val">{asset.metadata.gpsCoords}</span>
              </div>
            )}

            {asset.metadata.encryption && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">Cifrado</span>
                <span className="prosumer-metadata-val with-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  {asset.metadata.encryption}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
