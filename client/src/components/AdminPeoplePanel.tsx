import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { FaceAvatar } from './FaceAvatar.js';
import { SectionPanel } from './SectionPanel.js';
import type { MediaAsset } from '../types/MediaAsset.js';

interface PersonData {
  id: string;
  label: string;
  name?: string;
  faceCount: number;
  bbox: { x: number; y: number; width: number; height: number };
  thumbnailUrl: string;
}

type PeopleSortMode = 'COUNT_DESC' | 'NAME_ASC' | 'UNNAMED_FIRST';

interface AdminPeoplePanelProps {
  onSelectAsset: (asset: MediaAsset) => void;
}

export const AdminPeoplePanel = ({ onSelectAsset }: AdminPeoplePanelProps) => {
  const { token } = useAuth();
  const [people, setPeople] = useState<PersonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-gallery states
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [personAssets, setPersonAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [personAssetsError, setPersonAssetsError] = useState<string | null>(null);

  // Inline editing state
  const [peopleQuery, setPeopleQuery] = useState('');
  const [sortMode, setSortMode] = useState<PeopleSortMode>('COUNT_DESC');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
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

  const fetchPeople = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/people', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo cargar la lista de personas.`);
      }
      const data = (await res.json()) as PersonData[];
      setPeople(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchPersonAssets = useCallback(async (person: PersonData) => {
    setSelectedPerson(person);
    setIsLoadingAssets(true);
    setPersonAssets([]);
    setPersonAssetsError(null);
    try {
      const res = await fetch(`/api/people/${person.id}/assets`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudieron cargar los archivos.`);
      }
      const data = (await res.json()) as MediaAsset[];
      setPersonAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPersonAssetsError(err instanceof Error ? err.message : 'No se pudieron cargar los archivos.');
    } finally {
      setIsLoadingAssets(false);
    }
  }, [token]);

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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: valueToSave })
      });
      if (!res.ok) {
        throw new Error('No se pudo guardar el nombre.');
      }
      // Update local state
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
  }, [editingName, selectedPerson, token]);

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

  // Gallery render helpers
  const formatResolution = (asset: MediaAsset) => {
    return asset.metadata?.resolution || 'UNKNOWN';
  };

  if (selectedPerson) {
    return (
      <SectionPanel title={`Fotos de ${selectedPerson.name || selectedPerson.label}`} instanceId="admin-person-gallery">
        <div className="flex flex-col gap-4">
          <header className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                setSelectedPerson(null);
                setPersonAssetsError(null);
              }}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Volver al Directorio
            </button>
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <span>{personAssets.length} {personAssets.length === 1 ? 'elemento encontrado' : 'elementos encontrados'}</span>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold dark:bg-zinc-900">{selectedPerson.faceCount} detecciones</span>
            </div>
          </header>

          {isLoadingAssets ? (
            <div className="py-20 text-center text-zinc-500">Cargando galería de la persona...</div>
          ) : personAssetsError ? (
            <div className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
              <span>{personAssetsError}</span>
              <button
                type="button"
                onClick={() => void fetchPersonAssets(selectedPerson)}
                className="self-start rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/10"
                data-instance-id="person-assets-retry"
              >
                Reintentar
              </button>
            </div>
          ) : personAssets.length === 0 ? (
            <div className="py-20 text-center text-zinc-500">No se encontraron archivos para esta persona.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {personAssets.map(asset => (
                <article
                  key={asset.id}
                  onClick={() => onSelectAsset(asset)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300"
                >
                  <img
                    src={asset.imageUrl}
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {asset.type === 'VIDEO' && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm p-1.5 rounded-full text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                    <p className="text-xs text-white font-medium truncate">{asset.title}</p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{formatResolution(asset)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title="Personas Detectadas" instanceId="admin-people-panel">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30 md:grid-cols-[1fr_auto]">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Personas</p>
              <strong className="text-lg text-zinc-900 dark:text-zinc-100">{people.length}</strong>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Identificadas</p>
              <strong className="text-lg text-zinc-900 dark:text-zinc-100">{namedCount}</strong>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Detecciones</p>
              <strong className="text-lg text-zinc-900 dark:text-zinc-100">{totalFaces}</strong>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:items-center">
            <input
              type="search"
              value={peopleQuery}
              onChange={(event) => setPeopleQuery(event.target.value)}
              placeholder="Buscar persona..."
              className="min-h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              data-instance-id="people-search-input"
            />
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as PeopleSortMode)}
              className="min-h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              data-instance-id="people-sort-select"
            >
              <option value="COUNT_DESC">Más apariciones</option>
              <option value="NAME_ASC">Nombre A-Z</option>
              <option value="UNNAMED_FIRST">Sin identificar primero</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-zinc-500">Cargando directorio de rostros...</div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">{error}</div>
        ) : people.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            No se han agrupado rostros todavía. Asegúrate de ejecutar los workers <strong>Face Detection</strong> y <strong>Face Clustering</strong>.
          </div>
        ) : visiblePeople.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            No hay personas que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {visiblePeople.map(person => (
              <article
                key={person.id}
                className="group flex flex-col items-center bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
                data-instance-id={`person-card-${person.id}`}
              >
                {/* Face Crop Circular Avatar */}
                <button
                  type="button"
                  onClick={() => void fetchPersonAssets(person)}
                  className="cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  aria-label={`Abrir ${person.name || person.label}`}
                >
                  <FaceAvatar 
                    thumbnailUrl={person.thumbnailUrl} 
                    bbox={person.bbox} 
                    size={110} 
                    className="shadow-md border-2 border-white dark:border-zinc-950" 
                  />
                </button>

                {/* Name Editing Area */}
                <div className="mt-4 w-full text-center flex flex-col items-center min-h-[50px] justify-center relative">
                  {editingId === person.id ? (
                    <div id={`editing-container-${person.id}`} className="relative w-full flex flex-col items-center">
                      {/* Trigger: a styled select box showing current name */}
                      <div className="flex items-center justify-between gap-1.5 w-full max-w-[150px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-left cursor-default">
                        <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">
                          {person.name || person.label}
                        </span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-500">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>

                      {/* Dropdown Menu */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-1 w-[160px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-1.5">
                        {/* Position 1: Input to type custom/new name */}
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
                          className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2.5 py-1 text-center font-medium"
                        />

                        {/* Position 2+: Existing names list (max 5 visible, scrollable) */}
                        {filteredNames.length > 0 && (
                          <div className="max-h-[140px] overflow-y-auto flex flex-col gap-0.5">
                            {filteredNames.map((name, index) => (
                              <button
                                key={name}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevents input blur
                                  void handleSaveName(person.id, name);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs text-left truncate rounded-lg transition-colors ${
                                  index === dropdownIndex 
                                    ? 'bg-indigo-500/10 text-indigo-400 font-semibold' 
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                                }`}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-center w-full group/name">
                      <button
                        type="button"
                        onClick={() => void fetchPersonAssets(person)}
                        className="text-sm font-semibold truncate max-w-[130px] cursor-pointer hover:text-indigo-400 transition-colors"
                        title={person.name || person.label}
                      >
                        {person.name || person.label}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(person.id);
                          setEditingName(person.name || '');
                          setDropdownIndex(-1);
                        }}
                        className="opacity-0 group-hover/name:opacity-100 p-0.5 text-zinc-400 hover:text-indigo-400 transition-all"
                        title="Editar nombre"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <span className="text-xs text-zinc-500 mt-1 font-medium">
                    {person.faceCount} {person.faceCount === 1 ? 'foto' : 'fotos'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </SectionPanel>
  );
};
