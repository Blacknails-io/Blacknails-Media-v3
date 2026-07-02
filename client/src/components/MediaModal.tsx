import './MediaModal.css';
import type { MediaAsset } from '../types/MediaAsset.js';

interface MediaModalProps {
  readonly asset: MediaAsset | null;
  readonly onClose: () => void;
}

export const MediaModal = ({ asset, onClose }: MediaModalProps) => {
  if (!asset) return null;

  return (
    <div
      className="prosumer-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="prosumer-modal-container" onClick={(e) => e.stopPropagation()}>
        
        <button className="prosumer-modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="prosumer-modal-visual">
          {asset.type === 'VIDEO' ? (
            <video src={asset.originalUrl} className="prosumer-modal-img" controls autoPlay playsInline />
          ) : (
            <img src={asset.originalUrl} alt={asset.title} className="prosumer-modal-img" />
          )}
        </div>
        
        <div className="prosumer-modal-sidebar">
          <div className="prosumer-modal-header">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-xs font-bold rounded text-zinc-700 dark:text-zinc-300 tracking-wider uppercase">
                {asset.type}
              </span>
              <span className="text-xs text-zinc-500 font-mono">{asset.date}</span>
            </div>
            <h2 className="prosumer-modal-title">{asset.title}</h2>
            <p className="prosumer-modal-description">{asset.description}</p>
          </div>
          
          {asset.tags && asset.tags.length > 0 && (
            <div className="prosumer-modal-tags">
              {asset.tags.map(tag => (
                <span key={tag} className="prosumer-modal-tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="prosumer-metadata-panel">
            <h3 className="prosumer-metadata-section-title">Media Information</h3>
            
            <div className="prosumer-metadata-row">
              <span className="prosumer-metadata-key">File Size</span>
              <span className="prosumer-metadata-val">{asset.metadata.fileSize}</span>
            </div>
            
            {asset.metadata.resolution && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">Resolution</span>
                <span className="prosumer-metadata-val">{asset.metadata.resolution}</span>
              </div>
            )}
            
            {asset.metadata.duration && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">Duration</span>
                <span className="prosumer-metadata-val">{asset.metadata.duration}</span>
              </div>
            )}
            
            <h3 className="prosumer-metadata-section-title mt-6">Extended EXIF / AI</h3>
            
            <div className="prosumer-metadata-row">
              <span className="prosumer-metadata-key">System ID</span>
              <span className="prosumer-metadata-val truncate max-w-[150px]" title={asset.id}>{asset.id}</span>
            </div>

            {asset.metadata.gpsCoords && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">Location (GPS)</span>
                <span className="prosumer-metadata-val">{asset.metadata.gpsCoords}</span>
              </div>
            )}
            
            {asset.metadata.encryption && (
              <div className="prosumer-metadata-row">
                <span className="prosumer-metadata-key">Encryption</span>
                <span className="prosumer-metadata-val flex items-center gap-1">
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
