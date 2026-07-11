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
  const [fullAsset, setFullAsset] = useState<MediaAsset | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

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
    setFullAsset(null);
    if (asset?.id) {
      setIsLoadingFull(true);
      fetch(`/api/assets/${asset.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Error fetching asset details');
          return res.json();
        })
        .then(data => {
          setFullAsset(data);
        })
        .catch(err => console.error('Failed to load full asset details:', err))
        .finally(() => setIsLoadingFull(false));
    }
  }, [asset?.id]);

  if (!asset) return null;

  const handleCopyOriginalUrl = async () => {
    const targetUrl = fullAsset?.originalUrl || asset.originalUrl;
    if (!targetUrl) return;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopyState('copied');
    } catch (error) {
      console.error('Error copying original URL:', error);
      setCopyState('failed');
    }
  };

  const copyLabel = copyState === 'copied' ? 'Copiado' : copyState === 'failed' ? 'No copiado' : 'Copiar ruta';
  const originalUrl = fullAsset?.originalUrl || asset.originalUrl || asset.imageUrl;

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
            <video src={originalUrl} className="prosumer-modal-img" controls autoPlay playsInline />
          ) : (
            <img src={originalUrl} alt={asset.title} className="prosumer-modal-img" />
          )}
        </div>

        <div className="prosumer-modal-sidebar">
          <div className="prosumer-modal-header">
            <div className="prosumer-modal-eyebrow">
              <span>{asset.type}</span>
              <span>{asset.date}</span>
            </div>
            <h2 className="prosumer-modal-title" id="media-modal-title">{asset.title}</h2>
            <p className="prosumer-modal-description">
              {isLoadingFull ? 'Cargando detalles...' : (fullAsset?.description || 'Sin descripción IA disponible.')}
            </p>
            {currentIndex >= 0 && (
              <p className="prosumer-modal-position">{currentIndex + 1} de {assets.length}</p>
            )}
          </div>

          <div className="prosumer-modal-actions">
            <a className="prosumer-modal-action primary" href={originalUrl} target="_blank" rel="noreferrer">
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
            {(fullAsset?.tags || asset.tags || []).length > 0 ? (
              (fullAsset?.tags || asset.tags || []).map(tag => (
                <span key={tag} className="prosumer-modal-tag">{tag}</span>
              ))
            ) : (
              <span className="prosumer-modal-tag muted">
                {isLoadingFull ? 'Cargando etiquetas...' : 'Sin tags'}
              </span>
            )}
          </div>

          <div className="prosumer-metadata-panel">
            {(fullAsset?.isNsfw || asset.isNsfw) && (
              <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  Contenido Sensible (NSFW)
                </div>
                {(fullAsset?.nsfwReason || asset.nsfwReason) && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {fullAsset?.nsfwReason || asset.nsfwReason}
                  </div>
                )}
              </div>
            )}

            {(fullAsset?.people && fullAsset.people.length > 0) && (
              <>
                <h3 className="prosumer-metadata-section-title">Personas Identificadas</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {fullAsset.people.map(person => (
                    <span key={person.id} style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.85rem', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                      {person.name || person.label || 'Desconocido'}
                    </span>
                  ))}
                </div>
              </>
            )}

            <h3 className="prosumer-metadata-section-title">Media</h3>

            <div className="prosumer-metadata-row">
              <span className="prosumer-metadata-key">Tamaño</span>
              <span className="prosumer-metadata-val">{fullAsset?.metadata?.fileSize || asset.metadata?.fileSize || 'UNKNOWN'}</span>
            </div>

            {(fullAsset?.metadata?.resolution || asset.metadata?.resolution) && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">Resolución</span>
                <span className="prosumer-metadata-val">{fullAsset?.metadata?.resolution || asset.metadata?.resolution}</span>
              </div>
            )}

            {(fullAsset?.metadata?.duration || asset.metadata?.duration) && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">Duración</span>
                <span className="prosumer-metadata-val">{fullAsset?.metadata?.duration || asset.metadata?.duration}</span>
              </div>
            )}

            {(fullAsset?.metadata?.gpsCoords || asset.metadata?.gpsCoords) && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">GPS</span>
                <span className="prosumer-metadata-val">{fullAsset?.metadata?.gpsCoords || asset.metadata?.gpsCoords}</span>
              </div>
            )}

            <div className="prosumer-metadata-row">
              <span className="prosumer-metadata-key">Cifrado</span>
              <span className="prosumer-metadata-val with-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                {fullAsset?.metadata?.encryption || asset.metadata?.encryption || 'AES-256'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
