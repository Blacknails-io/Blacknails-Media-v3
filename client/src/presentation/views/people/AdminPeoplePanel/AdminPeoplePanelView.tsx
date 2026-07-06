/*
 * Copyright (c) 2026 MyCompany LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FaceAvatar } from '../../../../components/FaceAvatar.js';
import { SectionPanel } from '../../../../components/SectionPanel.js';
import type { MediaAsset } from '../../../../types/MediaAsset.js';
import type { PersonDTO } from '../../../../services/api/interfaces.js';
import type { PeopleSortMode } from './useAdminPeopleLogic.js';

interface AdminPeoplePanelViewProps {
  people: PersonDTO[];
  isLoading: boolean;
  error: string | null;
  selectedPerson: PersonDTO | null;
  setSelectedPerson: (person: PersonDTO | null) => void;
  personAssets: MediaAsset[];
  isLoadingAssets: boolean;
  personAssetsError: string | null;
  peopleQuery: string;
  setPeopleQuery: (query: string) => void;
  sortMode: PeopleSortMode;
  setSortMode: (mode: PeopleSortMode) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editingName: string;
  setEditingName: (name: string) => void;
  isSavingName: boolean;
  dismissingId: string | null;
  dropdownIndex: number;
  setDropdownIndex: (index: number | ((prev: number) => number)) => void;
  filteredNames: string[];
  visiblePeople: PersonDTO[];
  namedCount: number;
  totalFaces: number;

  onSelectAsset: (asset: MediaAsset) => void;
  fetchPersonAssets: (person: PersonDTO) => Promise<void>;
  handleSaveName: (personId: string, nameToSave?: string) => Promise<void>;
  handleDismissPerson: (person: PersonDTO) => Promise<void>;
}

export const AdminPeoplePanelView = ({
  people,
  isLoading,
  error,
  selectedPerson,
  setSelectedPerson,
  personAssets,
  isLoadingAssets,
  personAssetsError,
  peopleQuery,
  setPeopleQuery,
  sortMode,
  setSortMode,
  editingId,
  setEditingId,
  editingName,
  setEditingName,
  isSavingName,
  dismissingId,
  dropdownIndex,
  setDropdownIndex,
  filteredNames,
  visiblePeople,
  namedCount,
  totalFaces,
  onSelectAsset,
  fetchPersonAssets,
  handleSaveName,
  handleDismissPerson
}: AdminPeoplePanelViewProps) => {
  const formatResolution = (asset: MediaAsset) => {
    return asset.metadata?.resolution || 'UNKNOWN';
  };

  if (selectedPerson) {
    return (
      <SectionPanel title={`Fotos de ${selectedPerson.name || selectedPerson.label}`} instanceId="admin-person-gallery">
        <div className="flex flex-col gap-4">
          <header className="flex justify-between items-center pb-3 border-b border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)]">
            <button
              onClick={() => {
                setSelectedPerson(null);
              }}
              className="px-4 py-2 bg-surface-panel hover:bg-surface-panel dark:bg-surface-panel dark:hover:bg-surface-panel text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Volver al Directorio
            </button>
            <div className="flex flex-wrap items-center gap-2 text-sm text-secondary">
              <span>{personAssets.length} {personAssets.length === 1 ? 'elemento encontrado' : 'elementos encontrados'}</span>
              <span className="rounded-full bg-surface-panel px-2 py-1 text-xs font-semibold dark:bg-surface-panel">{selectedPerson.faceCount} detecciones</span>
            </div>
          </header>

          {isLoadingAssets ? (
            <div className="py-20 text-center text-secondary">Cargando galería de la persona...</div>
          ) : personAssetsError ? (
            <div className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-accent-ruby">
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
            <div className="py-20 text-center text-secondary">No se encontraron archivos para esta persona.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {personAssets.map(asset => (
                <article
                  key={asset.id}
                  onClick={() => onSelectAsset(asset)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-surface-panel dark:bg-surface-panel border border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)] shadow-sm hover:shadow-md cursor-pointer transition-all duration-300"
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
                    <p className="text-[10px] text-secondary font-mono mt-0.5">{formatResolution(asset)}</p>
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
        <div className="grid gap-3 rounded-lg border border-[rgba(var(--lab-surface-rgb-edge),0.5)] bg-surface-panel p-3 dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:bg-surface-panel/30 md:grid-cols-[1fr_auto]">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">Personas</p>
              <strong className="text-lg text-primary dark:text-primary">{people.length}</strong>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">Identificadas</p>
              <strong className="text-lg text-primary dark:text-primary">{namedCount}</strong>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">Detecciones</p>
              <strong className="text-lg text-primary dark:text-primary">{totalFaces}</strong>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:items-center">
            <input
              type="search"
              value={peopleQuery}
              onChange={(event) => setPeopleQuery(event.target.value)}
              placeholder="Buscar persona..."
              className="min-h-10 rounded-lg border border-[rgba(var(--lab-surface-rgb-edge),0.5)] bg-white px-3 text-sm text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:bg-surface-base dark:text-primary"
              data-instance-id="people-search-input"
            />
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as PeopleSortMode)}
              className="min-h-10 rounded-lg border border-[rgba(var(--lab-surface-rgb-edge),0.5)] bg-white px-3 text-sm text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:bg-surface-base dark:text-primary"
              data-instance-id="people-sort-select"
            >
              <option value="COUNT_DESC">Más apariciones</option>
              <option value="NAME_ASC">Nombre A-Z</option>
              <option value="UNNAMED_FIRST">Sin identificar primero</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-secondary">Cargando directorio de rostros...</div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-accent-ruby text-sm rounded-lg">{error}</div>
        ) : people.length === 0 ? (
          <div className="py-20 text-center text-secondary bg-surface-panel dark:bg-surface-panel/30 rounded-xl border border-dashed border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)]">
            No se han agrupado rostros todavía. Asegúrate de ejecutar los workers <strong>Face Detection</strong> y <strong>Face Clustering</strong>.
          </div>
        ) : visiblePeople.length === 0 ? (
          <div className="py-20 text-center text-secondary bg-surface-panel dark:bg-surface-panel/30 rounded-xl border border-dashed border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)]">
            No hay personas que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {visiblePeople.map(person => (
              <article
                key={person.id}
                className="group relative flex flex-col items-center bg-surface-panel dark:bg-surface-panel/30 border border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)]/80 rounded-2xl p-5 hover:shadow-lg hover:border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:hover:border-[rgba(var(--lab-surface-rgb-edge),0.5)] transition-all duration-300"
                data-instance-id={`person-card-${person.id}`}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDismissPerson(person);
                  }}
                  disabled={dismissingId === person.id}
                  className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(var(--lab-surface-rgb-edge),0.5)] bg-white/90 text-secondary opacity-0 shadow-sm transition-all hover:border-accent-ruby hover:text-accent-ruby group-hover:opacity-100 disabled:cursor-wait disabled:opacity-60 dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:bg-surface-base/90 dark:hover:border-accent-ruby/50"
                  title="Descartar falso positivo"
                  aria-label={'Descartar ' + (person.name || person.label) + ' como falso positivo'}
                  data-instance-id={'person-dismiss-' + person.id}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                </button>

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
                    className="shadow-md border-2 border-white dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)]" 
                  />
                </button>

                {/* Name Editing Area */}
                <div className="mt-4 w-full text-center flex flex-col items-center min-h-[50px] justify-center relative">
                  {editingId === person.id ? (
                    <div id={`editing-container-${person.id}`} className="relative w-full flex flex-col items-center">
                      <div className="flex items-center justify-between gap-1.5 w-full max-w-[150px] bg-surface-panel dark:bg-surface-panel border border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)] rounded-lg px-2.5 py-1.5 text-xs text-left cursor-default">
                        <span className="truncate text-secondary dark:text-secondary font-medium">
                          {person.name || person.label}
                        </span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-secondary">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>

                      {/* Dropdown Menu */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-1 w-[160px] bg-white dark:bg-surface-base border border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)] rounded-xl shadow-xl p-1.5 flex flex-col gap-1.5">
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
                          className="w-full text-xs bg-surface-panel dark:bg-surface-panel border border-[rgba(var(--lab-surface-rgb-edge),0.5)] dark:border-[rgba(var(--lab-surface-rgb-edge),0.5)] focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan rounded px-2.5 py-1 text-center font-medium"
                        />

                        {filteredNames.length > 0 && (
                          <div className="max-h-[140px] overflow-y-auto flex flex-col gap-0.5">
                            {filteredNames.map((name, index) => (
                              <button
                                key={name}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  void handleSaveName(person.id, name);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs text-left truncate rounded-lg transition-colors ${
                                  index === dropdownIndex 
                                    ? 'bg-accent-cyan/10 text-accent-cyan font-semibold' 
                                    : 'text-secondary dark:text-secondary hover:bg-surface-panel dark:hover:bg-surface-panel'
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
                        className="text-sm font-semibold truncate max-w-[130px] cursor-pointer hover:text-accent-cyan transition-colors"
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
                        className="opacity-0 group-hover/name:opacity-100 p-0.5 text-secondary hover:text-accent-cyan transition-all"
                        title="Editar nombre"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <span className="text-xs text-secondary mt-1 font-medium">
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
