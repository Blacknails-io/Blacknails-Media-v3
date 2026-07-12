import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { backendEventsController } from '../controllers/BackendEventsController';
import { FaceAvatar } from '../components/FaceAvatar';
import { SectionPanel } from '../components/SectionPanel';
import { MediaModal } from '../components/MediaModal';
import type { MediaAsset } from '../types/MediaAsset';

export interface PersonDTO {
  id: string;
  label: string;
  name?: string;
  faceCount: number;
  bbox: { x: number; y: number; width: number; height: number };
  thumbnailUrl: string;
}

type PeopleSortMode = 'COUNT_DESC' | 'NAME_ASC' | 'UNNAMED_FIRST';

export default function People() {
  const [people, setPeople] = useState<PersonDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-gallery states
  const [selectedPerson, setSelectedPerson] = useState<PersonDTO | null>(null);
  const [personAssets, setPersonAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [personAssetsError, setPersonAssetsError] = useState<string | null>(null);
  
  // Media Modal
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  // Inline editing state
  const [peopleQuery, setPeopleQuery] = useState('');
  const [sortMode, setSortMode] = useState<PeopleSortMode>('COUNT_DESC');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState(-1);
  const editingIdRef = useRef<string | null>(null);
  editingIdRef.current = editingId;

  const existingNames = useMemo(() => {
    return Array.from(
      new Set(
        people
          .map((p) => p.name || '')
          .map((name) => name.trim())
          .filter((name) => name.length > 0)
      )
    ).sort();
  }, [people]);

  const filteredNames = useMemo(() => {
    const query = editingName.trim().toLowerCase();
    if (!query) return existingNames;
    return existingNames.filter((name) => name.toLowerCase().includes(query));
  }, [existingNames, editingName]);

  const visiblePeople = useMemo(() => {
    const query = peopleQuery.trim().toLowerCase();
    const matches = query
      ? people.filter((person) => `${person.name || ''} ${person.label}`.toLowerCase().includes(query))
      : people;

    return [...matches].sort((a, b) => {
      if (sortMode === 'NAME_ASC') {
        return (a.name || a.label).localeCompare(b.name || b.label, undefined, { sensitivity: 'base' });
      }
      if (sortMode === 'UNNAMED_FIRST') {
        const unnamedDelta = (a.name ? 1 : 0) - (b.name ? 1 : 0);
        if (unnamedDelta !== 0) return unnamedDelta;
      }
      return b.faceCount - a.faceCount;
    });
  }, [people, peopleQuery, sortMode]);

  const namedCount = people.filter((person) => Boolean(person.name)).length;
  const totalFaces = people.reduce((sum, person) => sum + person.faceCount, 0);

  const fetchPeople = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const res = await fetch('/api/people');
      if (!res.ok) {
        throw new Error('Error al cargar la lista de personas.');
      }
      const data = await res.json();
      setPeople(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Error desconocido.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchPersonAssets = useCallback(async (person: PersonDTO) => {
    setSelectedPerson(person);
    setIsLoadingAssets(true);
    setPersonAssets([]);
    setPersonAssetsError(null);
    try {
      const res = await fetch(`/api/people/${person.id}/assets`);
      if (!res.ok) {
        throw new Error('Error al cargar los archivos de la persona.');
      }
      const data = await res.json();
      const mapped = Array.isArray(data) ? data.map((photo: any) => ({
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
      })) : [];
      setPersonAssets(mapped);
    } catch (err) {
      console.error(err);
      setPersonAssetsError(err instanceof Error ? err.message : 'No se pudieron cargar los archivos.');
    } finally {
      setIsLoadingAssets(false);
    }
  }, []);

  const handleSaveName = useCallback(async (personId: string, nameToSave?: string) => {
    if (editingIdRef.current !== personId) return;

    const valueToSave = (nameToSave !== undefined ? nameToSave : editingName).trim();
    if (!valueToSave) {
      setEditingId(null);
      return;
    }
    setIsSavingName(true);
    try {
      const res = await fetch(`/api/people/${personId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: valueToSave })
      });
      if (!res.ok) throw new Error('No se pudo guardar el nombre.');
      
      setPeople(prev => prev.map(p => p.id === personId ? { ...p, name: valueToSave } : p));
      if (selectedPerson && selectedPerson.id === personId) {
        setSelectedPerson(prev => prev ? { ...prev, name: valueToSave } : null);
      }
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error guardando el nombre.');
    } finally {
      setIsSavingName(false);
    }
  }, [editingName, selectedPerson]);

  const handleDismissPerson = useCallback(async (person: PersonDTO) => {
    const label = person.name || person.label;
    if (!window.confirm('¿Descartar ' + label + ' como falso positivo? Se borrarán sus detecciones de rostro.')) {
      return;
    }

    setDismissingId(person.id);
    try {
      const res = await fetch(`/api/people/${person.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('No se pudo descartar la persona.');
      
      setPeople(prev => prev.filter(p => p.id !== person.id));
      if (selectedPerson?.id === person.id) {
        setSelectedPerson(null);
        setPersonAssets([]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error descartando la persona.');
    } finally {
      setDismissingId(null);
    }
  }, [selectedPerson]);

  // @ts-ignore
  const handleCleanOrphans = useCallback(async () => {
    if (!confirm('¿Limpiar caras huérfanas (sin fotos asociadas)?')) return;
    try {
      const res = await fetch('/api/people/orphans', { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al limpiar huérfanas.');
      alert('Caras huérfanas limpiadas.');
      void fetchPeople();
    } catch (err) {
      console.error(err);
      alert('Error al limpiar caras huérfanas.');
    }
  }, [fetchPeople]);

  const editingNameRef = useRef(editingName);
  editingNameRef.current = editingName;

  useEffect(() => {
    if (editingId === null) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const container = document.getElementById(`editing-container-${editingId}`);
      if (container && !container.contains(e.target as Node)) {
        void handleSaveName(editingId, editingNameRef.current);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [editingId, handleSaveName]);

  useEffect(() => {
    void fetchPeople();
  }, [fetchPeople]);

  useEffect(() => {
    const unsubscribe = backendEventsController.subscribeEvents(
      () => {
        if (editingIdRef.current !== null) {
          console.log('[SSE] Ignorando refresco silencioso debido a edición de nombre activa.');
          return;
        }
        void fetchPeople(true);
      },
      (event) => {
        if (event.type === 'DOMAIN' && (event as any).entityType === 'Face') {
          return true;
        }
        if (
          event.type === 'PROCESS' &&
          event.action === 'COMPLETED' &&
          ['face-worker', 'face-cluster-worker'].includes((event as any).processName)
        ) {
          return true;
        }
        return false;
      }
    );
    return () => unsubscribe();
  }, [fetchPeople]);

  const formatResolution = (asset: MediaAsset) => {
    return asset.metadata?.resolution || 'UNKNOWN';
  };

  if (selectedPerson) {
    return (
      <div className="animate-fade-in" style={{ padding: '2rem' }}>
        <SectionPanel title={`Fotos de ${selectedPerson.name || selectedPerson.label}`} instanceId="admin-person-gallery">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => {
                  setSelectedPerson(null);
                }}
                className="btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Volver al Directorio
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                <span>{personAssets.length} {personAssets.length === 1 ? 'elemento encontrado' : 'elementos encontrados'}</span>
                <span className="glass-panel" style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{selectedPerson.faceCount} detecciones</span>
              </div>
            </header>

            {isLoadingAssets ? (
              <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando galería de la persona...</div>
            ) : personAssetsError ? (
              <div style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span>{personAssetsError}</span>
                <button
                  type="button"
                  onClick={() => void fetchPersonAssets(selectedPerson)}
                  className="btn-ghost"
                  data-instance-id="person-assets-retry"
                  style={{ alignSelf: 'flex-start', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.3)' }}
                >
                  Reintentar
                </button>
              </div>
            ) : personAssets.length === 0 ? (
              <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron archivos para esta persona.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {personAssets.map(asset => (
                  <article
                    key={asset.id}
                    onClick={() => setPreviewAsset(asset)}
                    className="glass-panel"
                    style={{ aspectRatio: '1/1', position: 'relative', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', padding: 0 }}
                  >
                    <img
                      src={asset.imageUrl}
                      alt={asset.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    {asset.type === 'VIDEO' && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: '50%', color: 'white' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                      <p style={{ color: 'white', margin: 0, fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.title}</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', margin: 0, fontFamily: 'monospace', marginTop: '2px' }}>{formatResolution(asset)}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </SectionPanel>
        
        {previewAsset && (
          <MediaModal 
            asset={previewAsset}
            onClose={() => setPreviewAsset(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', margin: '0 0 2rem 0' }}>Directorio de Personas</h1>
      <SectionPanel instanceId="admin-people-panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0, fontWeight: 'bold' }}>Personas</p>
                <strong style={{ fontSize: '1.25rem', color: 'white' }}>{people.length}</strong>
              </div>
              <div>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0, fontWeight: 'bold' }}>Identificadas</p>
                <strong style={{ fontSize: '1.25rem', color: 'white' }}>{namedCount}</strong>
              </div>
              <div>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0, fontWeight: 'bold' }}>Detecciones</p>
                <strong style={{ fontSize: '1.25rem', color: 'white' }}>{totalFaces}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="search"
                value={peopleQuery}
                onChange={(event) => setPeopleQuery(event.target.value)}
                placeholder="Buscar persona..."
                data-instance-id="people-search-input"
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', outline: 'none' }}
              />
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as PeopleSortMode)}
                data-instance-id="people-sort-select"
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', outline: 'none' }}
              >
                <option value="COUNT_DESC" style={{ color: 'black' }}>Más apariciones</option>
                <option value="NAME_ASC" style={{ color: 'black' }}>Nombre A-Z</option>
                <option value="UNNAMED_FIRST" style={{ color: 'black' }}>Sin identificar primero</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando directorio de rostros...</div>
          ) : error ? (
            <div style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '1rem', borderRadius: '8px' }}>{error}</div>
          ) : people.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)', borderStyle: 'dashed' }}>
              No se han agrupado rostros todavía. Asegúrate de ejecutar los workers <strong>Face Detection</strong> y <strong>Face Clustering</strong>.
            </div>
          ) : visiblePeople.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)', borderStyle: 'dashed' }}>
              No hay personas que coincidan con la búsqueda.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.5rem' }}>
              {visiblePeople.map(person => (
                <article
                  key={person.id}
                  className="glass-panel"
                  data-instance-id={`person-card-${person.id}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', borderRadius: '16px', position: 'relative' }}
                >
                  <button
                    type="button"
                    onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                      event.stopPropagation();
                      void handleDismissPerson(person);
                    }}
                    disabled={dismissingId === person.id}
                    title="Descartar falso positivo"
                    aria-label={'Descartar ' + (person.name || person.label) + ' como falso positivo'}
                    data-instance-id={'person-dismiss-' + person.id}
                    style={{ position: 'absolute', top: 8, right: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', zIndex: 10 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-ruby)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => void fetchPersonAssets(person)}
                    aria-label={`Abrir ${person.name || person.label}`}
                    style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', transition: 'transform 0.3s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <FaceAvatar 
                      thumbnailUrl={person.thumbnailUrl} 
                      bbox={person.bbox} 
                      size={100} 
                    />
                  </button>

                  <div style={{ marginTop: '1rem', width: '100%', textAlign: 'center', minHeight: '50px' }}>
                    {editingId === person.id ? (
                      <div id={`editing-container-${person.id}`} style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 14px)', display: 'inline-block', color: 'var(--text-secondary)' }}>
                            {person.name || person.label}
                          </span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-secondary)' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>

                        <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 50, padding: '8px', width: '160px', marginTop: '4px' }}>
                          <input
                            type="text"
                            value={editingName}
                            placeholder="Escribir nombre..."
                            onChange={(e) => {
                              setEditingName(e.target.value);
                              setDropdownIndex(-1);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (dropdownIndex >= 0 && dropdownIndex < filteredNames.length) {
                                  void handleSaveName(person.id, filteredNames[dropdownIndex]);
                                } else {
                                  void handleSaveName(person.id);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setDropdownIndex(prev => (prev < filteredNames.length - 1 ? prev + 1 : prev));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setDropdownIndex(prev => (prev > -1 ? prev - 1 : -1));
                              }
                            }}
                            autoFocus
                            disabled={isSavingName}
                            style={{ width: '100%', padding: '4px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', outline: 'none', textAlign: 'center', fontSize: '12px' }}
                          />

                          {filteredNames.length > 0 && (
                            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', marginTop: '4px' }}>
                              {filteredNames.map((name, index) => (
                                <button
                                  key={name}
                                  type="button"
                                  onMouseDown={(e: ReactMouseEvent<HTMLButtonElement>) => {
                                    e.preventDefault();
                                    void handleSaveName(person.id, name);
                                  }}
                                  style={{ padding: '4px 8px', textAlign: 'left', border: 'none', background: index === dropdownIndex ? 'rgba(6, 182, 212, 0.2)' : 'transparent', color: index === dropdownIndex ? 'var(--accent-cyan)' : 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => void fetchPersonAssets(person)}
                          title={person.name || person.label}
                          style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.875rem', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-cyan)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                        >
                          {person.name || person.label}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(person.id);
                            setEditingName(person.name || '');
                            setDropdownIndex(-1);
                          }}
                          title="Editar nombre"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 4px', display: 'flex' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-cyan)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {person.faceCount} {person.faceCount === 1 ? 'foto' : 'fotos'}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
