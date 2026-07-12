import { useState, useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { Search, X } from 'lucide-react';
import { GalleryCard } from '../components/GalleryCard.js';
import { MediaModal } from '../components/MediaModal.js';
import type { MediaAsset } from '../types/MediaAsset.js';
import { backendEventsController } from '../controllers/BackendEventsController';

type GallerySort = 'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TYPE_ASC';

export default function Gallery() {
  // Fetching state
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [assetLoadError, setAssetLoadError] = useState<string | null>(null);

  // Gallery Interactive States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');
  const [gallerySort, setGallerySort] = useState<GallerySort>('NEWEST');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [bulkActionFeedback, setBulkActionFeedback] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    setIsLoadingAssets(true);
    setAssetLoadError(null);
    try {
      const res = await fetch('/api/assets');
      if (!res.ok) {
        let errorMsg = 'No pudimos conectar con el servidor. Por favor, inténtalo de nuevo más tarde.';
        try {
          const errorData = await res.json();
          if (errorData.error) errorMsg = errorData.error;
        } catch (_) {}
        
        if (res.status >= 500) {
          errorMsg = 'Nuestros servidores están teniendo un momento de debilidad. Estamos trabajando en ello.';
        } else if (res.status === 401 || res.status === 403) {
          errorMsg = 'Tu sesión parece haber expirado. Por favor, vuelve a iniciar sesión.';
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      const loadedAssets = Array.isArray(data) ? data : (data.items || []);
      
      const mapped: MediaAsset[] = loadedAssets.map((photo: any) => ({
        ...photo,
        id: photo.id,
        type: (photo.type === 'PHOTO' || photo.type === 'IMAGE' || !photo.videoPreviewUrl) ? 'PHOTO' : 'VIDEO',
        imageUrl: photo.imageUrl || `/api/media/originals/${photo.id}`,
        originalUrl: photo.originalUrl || `/api/media/originals/${photo.id}`,
        videoPreviewUrl: photo.videoPreviewUrl ? `/api/media/originals/${photo.videoPreviewUrl}` : undefined,
        title: photo.title || photo.id,
        description: photo.description || '',
        date: photo.date || '2026-07-11',
        tags: photo.tags || [],
      }));

      setAssets(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar la biblioteca.';
      console.error('Error fetching assets:', err);
      setAssetLoadError(message);
      setAssets([]);
    } finally {
      setIsLoadingAssets(false);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    const unsubscribe = backendEventsController.subscribeEvents((event) => {
      const e = event as any;
      if (e.type === 'DOMAIN:Asset:CREATED') {
        const payload = e.payload;
        setAssets(prev => {
          // Prevent duplicates if already loaded
          if (prev.some(a => a.id === payload.id)) return prev;
          
          const newAsset: MediaAsset = {
            ...payload,
            id: payload.id,
            type: (payload.type === 'PHOTO' || payload.type === 'IMAGE' || !payload.videoPreviewUrl) ? 'PHOTO' : 'VIDEO',
            imageUrl: payload.imageUrl || `/api/media/originals/${payload.id}`,
            originalUrl: payload.originalUrl || `/api/media/originals/${payload.id}`,
            videoPreviewUrl: payload.videoPreviewUrl ? `/api/media/originals/${payload.videoPreviewUrl}` : undefined,
            title: payload.title || payload.id,
            description: payload.description || '',
            date: payload.date || new Date().toISOString().split('T')[0],
            tags: payload.tags || [],
          };
          return [newAsset, ...prev];
        });
      } else if (e.type === 'DOMAIN:Asset:UPDATED') {
        setAssets(prev => prev.map(a => a.id === e.payload.id ? { ...a, ...e.payload } : a));
      } else if (e.type === 'PROCESS' && e.payload?.status === 'PROCESSED') {
        const assetId = e.payload.itemId;
        if (assetId) {
          // Fetch the updated asset
          fetch(`/api/assets/${assetId}`)
            .then(res => res.json())
            .then(updatedAsset => {
              setAssets(prev => prev.map(a => a.id === assetId ? {
                ...a,
                ...updatedAsset,
                id: updatedAsset.id,
                type: (updatedAsset.type === 'PHOTO' || updatedAsset.type === 'IMAGE' || !updatedAsset.videoPreviewUrl) ? 'PHOTO' : 'VIDEO',
                imageUrl: updatedAsset.imageUrl || `/api/media/originals/${updatedAsset.id}`,
                originalUrl: updatedAsset.originalUrl || `/api/media/originals/${updatedAsset.id}`,
                videoPreviewUrl: updatedAsset.videoPreviewUrl ? `/api/media/originals/${updatedAsset.videoPreviewUrl}` : undefined,
                title: updatedAsset.title || updatedAsset.id,
                description: updatedAsset.description || '',
                date: updatedAsset.date || new Date().toISOString().split('T')[0],
                tags: updatedAsset.tags || [],
              } : a));
            })
            .catch(err => console.error('Failed to fetch updated asset', err));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Selection logic
  const toggleAssetSelection = useCallback((id: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelect = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setBulkActionFeedback(null);
    toggleAssetSelection(id);
  };

  useEffect(() => {
    if (selectedAssets.size === 0) {
      setBulkActionFeedback(null);
    }
  }, [selectedAssets.size]);

  // Filtering local
  const filteredAssets = assets.filter(a => {
    // If the type mapping returned PHOTO but it was stored as IMAGE, we handle both.
    const isPhoto = a.type === 'PHOTO' || (a.type as any) === 'IMAGE';
    if (activeFilter === 'PHOTO' && !isPhoto) return false;
    if (activeFilter === 'VIDEO' && a.type !== 'VIDEO') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = a.title?.toLowerCase().includes(q);
      if (!titleMatch) return false;
    }
    return true;
  }).sort((a, b) => {
    if (gallerySort === 'TITLE_ASC') {
      return (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' });
    }
    if (gallerySort === 'TYPE_ASC') {
      const typeCompare = (a.type || '').localeCompare(b.type || '', 'es', { sensitivity: 'base' });
      return typeCompare || (b.date || '').localeCompare(a.date || '') || (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' });
    }
    return gallerySort === 'OLDEST' ? (a.date || '').localeCompare(b.date || '') : (b.date || '').localeCompare(a.date || '');
  });

  const photoCount = assets.filter(asset => asset.type === 'PHOTO' || (asset.type as any) === 'IMAGE').length;
  const videoCount = assets.filter(asset => asset.type === 'VIDEO').length;
  const hasActiveFilters = activeFilter !== 'ALL' || searchQuery.trim().length > 0;
  
  const clearGalleryFilters = () => {
    setSearchQuery('');
    setActiveFilter('ALL');
  };

  const selectedAssetList = filteredAssets.filter(asset => selectedAssets.has(asset.id));
  const selectedCountLabel = selectedAssetList.length === 1 ? '1 seleccionado' : `${selectedAssetList.length} seleccionados`;

  const handleOpenFirstSelected = () => {
    if (selectedAssetList[0]) {
      setPreviewAsset(selectedAssetList[0]);
    }
  };

  const handleClearSelection = () => {
    setSelectedAssets(new Set());
    setBulkActionFeedback(null);
  };

  const copyBulkText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setBulkActionFeedback(`${label} copiados`);
    } catch (error) {
      console.error('Error copying bulk selection:', error);
      setBulkActionFeedback('No se pudo copiar');
    }
  };

  const handleCopySelectedIds = () => {
    void copyBulkText('IDs', selectedAssetList.map(asset => asset.id).join('\n'));
  };

  const handleCopySelectedOriginalUrls = () => {
    void copyBulkText('Rutas', selectedAssetList.map(asset => asset.originalUrl).join('\n'));
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      {/* Top Bar with Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Timeline</h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem', borderRadius: '12px' }}>
            {([
              { value: 'ALL', label: 'Todo', count: assets.length },
              { value: 'PHOTO', label: 'Fotos', count: photoCount },
              { value: 'VIDEO', label: 'Vídeos', count: videoCount }
            ] as const).map(filter => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: activeFilter === filter.value ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  border: 'none',
                  color: activeFilter === filter.value ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '0.5rem',
                  fontWeight: activeFilter === filter.value ? '600' : '400',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{filter.label}</span>
                <strong style={{ opacity: 0.7 }}>{filter.count}</strong>
              </button>
            ))}
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', width: '300px', borderRadius: '12px' }}>
            <Search size={18} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder="Buscar por título, tags..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ 
                background: 'transparent', border: 'none', color: 'white', 
                outline: 'none', width: '100%', fontSize: '0.9rem' 
              }}
            />
            {searchQuery && (
              <X 
                size={18} 
                color="var(--text-secondary)" 
                style={{ marginLeft: '0.5rem', cursor: 'pointer', transition: 'color 0.2s' }} 
                onClick={() => setSearchQuery('')}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              />
            )}
          </div>

          <select
            className="glass-panel"
            value={gallerySort}
            onChange={(e) => setGallerySort(e.target.value as GallerySort)}
            style={{ 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1rem', 
              borderRadius: '12px',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none'
            }}
          >
            <option value="NEWEST" style={{ color: 'black' }}>Recientes</option>
            <option value="OLDEST" style={{ color: 'black' }}>Antiguos</option>
            <option value="TITLE_ASC" style={{ color: 'black' }}>Título A-Z</option>
            <option value="TYPE_ASC" style={{ color: 'black' }}>Tipo</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedAssetList.length > 0 && (
        <div className="glass-panel" style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', marginBottom: '2rem', borderRadius: '12px', alignItems: 'center' }}>
          <div style={{ marginRight: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <strong style={{ color: 'white', fontSize: '1.1rem' }}>{selectedCountLabel}</strong>
            <span style={{ color: 'var(--text-secondary)' }}>{selectedAssetList[0]?.title}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={handleOpenFirstSelected} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>Abrir primero</button>
            <button type="button" onClick={handleCopySelectedIds} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>Copiar IDs</button>
            <button type="button" onClick={handleCopySelectedOriginalUrls} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>Copiar rutas</button>
            <button type="button" onClick={handleClearSelection} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Limpiar</button>
          </div>
          {bulkActionFeedback && <span style={{ color: '#4ade80', marginLeft: '1rem', fontWeight: 500 }}>{bulkActionFeedback}</span>}
        </div>
      )}

      {/* Grid */}
      <div className="photo-grid">
        {isLoadingAssets ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', padding: '2rem 0' }}>Loading your life...</div>
        ) : assetLoadError ? (
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <strong style={{ color: '#f87171', display: 'block', marginBottom: '0.5rem' }}>No se pudo cargar la biblioteca</strong>
            <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '1.5rem' }}>{assetLoadError}</span>
            <button type="button" onClick={() => void loadAssets()} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Reintentar</button>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', borderRadius: '12px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <strong style={{ color: 'white', fontSize: '1.2rem', display: 'block', marginBottom: '0.5rem' }}>{assets.length === 0 ? 'Biblioteca sin media indexada' : 'No hay resultados para este filtro'}</strong>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{assets.length === 0 ? 'Cuando el pipeline importe e indexe archivos aparecerán aquí.' : 'Ajusta búsqueda o tipo de media para ampliar la vista.'}</div>
            {hasActiveFilters && (
              <button type="button" onClick={clearGalleryFilters} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Limpiar filtros</button>
            )}
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <GalleryCard 
              key={asset.id}
              asset={asset}
              isSelected={selectedAssets.has(asset.id)}
              onToggleSelect={(id, e) => handleToggleSelect(id, e)}
              onClick={() => setPreviewAsset(asset)}
            />
          ))
        )}
      </div>

      {previewAsset && (
        <MediaModal 
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
        />
      )}
    </div>
  );
}
