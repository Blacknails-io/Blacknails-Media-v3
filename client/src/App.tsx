import { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryCard } from './components/GalleryCard.js';
import { useGlobalHologram } from './hooks/useGlobalHologram.js';
import type { AppEvent } from '@blacknails/shared';
import { useAuth } from './context/AuthContext.js';
import { LoginScreen } from './components/LoginScreen.js';
import { AdminUsersPanel } from './components/AdminUsersPanel.js';
import { AdminImportPanel } from './components/AdminImportPanel.js';
import { AdminPeoplePanel } from './components/AdminPeoplePanel.js';
import { backendEventsController } from './controllers/BackendEventsController.js';

import './App.css';

import type { MediaAsset } from './types/MediaAsset.js';
import { MediaModal } from './components/MediaModal.js';
import type { MouseEvent } from 'react';

export default function App() {
  const { token, isLoggedIn, user, isInitializing, logout, updateAvatar } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'gallery' | 'console' | 'users' | 'pipeline' | 'people'>('gallery');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [logs, setLogs] = useState<AppEvent[]>([]);
  const [sseStatus, setSseStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const previousSseStatusRef = useRef<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const galleryRefreshTimeoutRef = useRef<number | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isConsolePaused, setIsConsolePaused] = useState(false);
  const [consoleFilter, setConsoleFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const queuedLogsRef = useRef<AppEvent[]>([]);
  const isConsolePausedRef = useRef(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleConsolePause = useCallback(() => {
    const newState = !isConsolePaused;
    setIsConsolePaused(newState);
    isConsolePausedRef.current = newState;
    if (!newState && queuedLogsRef.current.length > 0) {
      setLogs(prev => [...queuedLogsRef.current.reverse(), ...prev].slice(0, 500));
      queuedLogsRef.current = [];
    }
  }, [isConsolePaused]);

  useEffect(() => {
    if (activeTab === 'console' && consoleRef.current && !isConsolePaused) {
      consoleRef.current.scrollTop = 0;
    }
  }, [logs, activeTab]);

  // Fetch from API
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [assetLoadError, setAssetLoadError] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    setIsLoadingAssets(true);
    setAssetLoadError(null);
    try {
      const res = await fetch('/api/assets', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status} al cargar la biblioteca.`);
      }
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar la biblioteca.';
      console.error('Error fetching assets:', err);
      setAssetLoadError(message);
      setAssets([]);
    } finally {
      setIsLoadingAssets(false);
    }
  }, [token]);

  const scheduleGalleryRefresh = useCallback(() => {
    if (galleryRefreshTimeoutRef.current !== null) {
      window.clearTimeout(galleryRefreshTimeoutRef.current);
    }
    galleryRefreshTimeoutRef.current = window.setTimeout(() => {
      void loadAssets();
    }, 250);
  }, [loadAssets]);

  useEffect(() => {
    if (!isLoggedIn) {
      setAssets([]);
      setAssetLoadError(null);
      setIsLoadingAssets(false);
      return;
    }
    void loadAssets();
  }, [isLoggedIn, loadAssets]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (activeTab !== 'gallery') return;
    void loadAssets();
  }, [activeTab, isLoggedIn, loadAssets]);

  // Gallery Interactive States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    if (!isAdmin && (activeTab === 'users' || activeTab === 'pipeline')) {
      setActiveTab('gallery');
    }
  }, [activeTab, isAdmin]);

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
    toggleAssetSelection(id);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await updateAvatar(file);
      } catch (err) {
        console.error('Error uploading avatar:', err);
        alert('Error al subir el avatar.');
      }
    }
  };

  // Inicializar holograma global
  useGlobalHologram();

  // Conexión reactiva por controlador central de eventos del backend
  useEffect(() => {
    if (!isLoggedIn) {
      backendEventsController.stop();
      return;
    }
    const unsubscribeStatus = backendEventsController.subscribeStatus((status) => {
      const previous = previousSseStatusRef.current;
      setSseStatus(status);

      if (previous === 'DISCONNECTED' && status === 'CONNECTED') {
        void loadAssets();
      }

      previousSseStatusRef.current = status;
    });
    const unsubscribeEvents = backendEventsController.subscribeEvents((event) => {
      if (isConsolePausedRef.current) {
        queuedLogsRef.current.push(event);
      } else {
        setLogs((prevLogs) => [event, ...prevLogs].slice(0, 500));
      }

      // El BaseEvent tiene subsystem y action como opcionales en Typescript si lo forzamos a un custom event
      const ev = event as any;
      if (ev.subsystem === 'INDEX' && ev.source === 'IndexMediaUseCase' && ev.action === 'SUCCESS') {
        scheduleGalleryRefresh();
      }
    });
    backendEventsController.start();

    return () => {
      unsubscribeStatus();
      unsubscribeEvents();
      if (galleryRefreshTimeoutRef.current !== null) {
        window.clearTimeout(galleryRefreshTimeoutRef.current);
        galleryRefreshTimeoutRef.current = null;
      }
      backendEventsController.stop();
    };
  }, [isLoggedIn, loadAssets, scheduleGalleryRefresh]);



  // -- RENDER CONDICIONAL (Auth) --
  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono">
        INICIALIZANDO SISTEMA...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // -- FILTRADO LOCAL --
  const filteredAssets = assets.filter(a => {
    if (activeFilter === 'PHOTO' && a.type !== 'PHOTO') return false;
    if (activeFilter === 'VIDEO' && a.type !== 'VIDEO') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tagsMatch = a.tags?.some(t => t.toLowerCase().includes(q));
      const descMatch = a.description?.toLowerCase().includes(q);
      const titleMatch = a.title?.toLowerCase().includes(q);
      if (!tagsMatch && !descMatch && !titleMatch) return false;
    }
    return true;
  });

  const selectedAssetList = filteredAssets.filter(asset => selectedAssets.has(asset.id));
  const inspectorAsset = selectedAssetList[0] ?? filteredAssets[0] ?? null;
  const photoCount = assets.filter(asset => asset.type === 'PHOTO').length;
  const videoCount = assets.filter(asset => asset.type === 'VIDEO').length;
  const hasActiveFilters = activeFilter !== 'ALL' || searchQuery.trim().length > 0;


  return (
    <div className="app-layout">
      {/* ── HEADER GLOBAL ── */}
      <header className="app-global-header">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className={`font-bold tracking-wide flex items-center gap-2 transition-colors duration-300 animate-pulse ${sseStatus === 'CONNECTED' ? 'text-emerald-500' : 'text-rose-500'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            BLACKNAILS
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          {/* Perfil Usuario */}
          {user && (
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer overflow-hidden border border-zinc-700 hover:border-zinc-400 transition-colors"
                title="Cambiar Avatar"
                onClick={() => avatarInputRef.current?.click()}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.username.substring(0, 2).toUpperCase()
                )}
              </div>
              <input 
                type="file" 
                accept="image/*,video/*"
                className="hidden"
                ref={avatarInputRef}
                onChange={handleAvatarChange}
                onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
              />
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="text-sm font-semibold">{user.username}</span>
                <span className="text-xs text-zinc-500">{user.role}</span>
              </div>
              <button onClick={logout} className="ml-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200" title="Cerrar sesión">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="app-window">
        {/* ── BARRA LATERAL (Sidebar) ── */}
        <aside className={`app-sidebar ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
          {/* Navegación */}
        <nav className="app-sidebar-nav">
          <button 
            className={`app-menu-item ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="2"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            {!isSidebarCollapsed && <span>Galería</span>}
          </button>

          <button 
            className={`app-menu-item ${activeTab === 'people' ? 'active' : ''}`}
            onClick={() => setActiveTab('people')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {!isSidebarCollapsed && <span>Personas</span>}
          </button>
          
          {isAdmin && (
            <>
              {!isSidebarCollapsed && (
                <div className="mt-6 mb-2 px-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                  Administración
                </div>
              )}
              <button 
                className={`app-menu-item ${activeTab === 'console' ? 'active' : ''}`}
                onClick={() => setActiveTab('console')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5"></polyline>
                  <line x1="12" y1="19" x2="20" y2="19"></line>
                </svg>
                {!isSidebarCollapsed && <span>Event Logs</span>}
              </button>
              <button 
                className={`app-menu-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
                data-instance-id="users-menu-item"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="11" cy="7" r="4"></circle>
                  <path d="M20 8v6"></path>
                  <path d="M23 11h-6"></path>
                </svg>
                {!isSidebarCollapsed && <span>Usuarios</span>}
              </button>
              <button 
                className={`app-menu-item ${activeTab === 'pipeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('pipeline')}
                data-instance-id="pipeline-menu-item"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6"></path>
                  <path d="M12 16v6"></path>
                  <path d="M4.93 4.93l4.24 4.24"></path>
                  <path d="M14.83 14.83l4.24 4.24"></path>
                  <path d="M2 12h6"></path>
                  <path d="M16 12h6"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                {!isSidebarCollapsed && <span>Workers</span>}
              </button>
            </>
          )}
        </nav>

        </aside>

      {/* ── AREA PRINCIPAL ── */}
      <main className="app-main">
        
        {/* Topbar Contextual */}
        <header className="app-topbar">
          {activeTab === 'gallery' ? (
            <>
              <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                {([
                  { value: 'ALL', label: 'Todo', count: assets.length },
                  { value: 'PHOTO', label: 'Fotos', count: photoCount },
                  { value: 'VIDEO', label: 'Vídeos', count: videoCount }
                ] as const).map(filter => (
                  <button
                    key={filter.value}
                    className={`app-filter-pill ${activeFilter === filter.value ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    <span>{filter.label}</span>
                    <strong>{filter.count}</strong>
                  </button>
                ))}
              </div>
              <div className="flex-1">
                 <input 
                    type="text" 
                    className="w-full max-w-md bg-zinc-100 dark:bg-zinc-900 border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                    placeholder="Buscar por título, tags o descripción..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
            </>
          ) : activeTab === 'console' ? (
            <div className="flex items-center gap-2 flex-wrap w-full">
              <select
                className="bg-zinc-100 dark:bg-zinc-900 border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="SYSTEM">Sistema</option>
                <option value="PROCESS">Proceso</option>
                <option value="DOMAIN">Dominio</option>
              </select>

              <select
                className="bg-zinc-100 dark:bg-zinc-900 border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">Todas las Categorías</option>
                <option value="APPLICATION">Aplicación (SYSTEM)</option>
                <option value="DATABASE">Base de Datos (SYSTEM)</option>
                <option value="KAFKA">Kafka (SYSTEM)</option>
                <option value="AUTH">Autenticación (SYSTEM)</option>
                <option value="IMPORT">Importación (PROCESS)</option>
                <option value="INDEX">Indexación (PROCESS)</option>
                <option value="AI">IA (PROCESS)</option>
                <option value="Asset">Asset (DOMAIN)</option>
                <option value="Face">Face (DOMAIN)</option>
                <option value="MediaFile">MediaFile (DOMAIN)</option>
                <option value="Session">Session (DOMAIN)</option>
                <option value="User">User (DOMAIN)</option>
              </select>

              <select
                className="bg-zinc-100 dark:bg-zinc-900 border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="ALL">Todas las Acciones</option>
                <option value="STARTED">STARTED</option>
                <option value="COMPLETED">COMPLETED / FINISHED</option>
                <option value="FAILED">FAILED / ERROR</option>
                <option value="SUCCESS">SUCCESS / PROCESSED</option>
                <option value="DUPLICATED">DUPLICATED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="CREATED">CREATED</option>
                <option value="DELETED">DELETED</option>
                <option value="DETECTED">DETECTED</option>
                <option value="GROUPED">GROUPED</option>
              </select>


              <input
                type="text"
                className="w-full max-w-xs bg-zinc-100 dark:bg-zinc-900 border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                placeholder="Filtrar texto..."
                value={consoleFilter}
                onChange={(e) => setConsoleFilter(e.target.value)}
              />
              <button
                onClick={toggleConsolePause}
                className={`px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2 ${isConsolePaused ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
              >
                {isConsolePaused ? '▶ Reanudar' : '⏸ Pausar'}
                {isConsolePaused && queuedLogsRef.current.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-1.5 rounded-full">{queuedLogsRef.current.length}</span>
                )}
              </button>
            </div>
          ) : (
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {activeTab === 'users' && 'Gestión de Usuarios'}
              {activeTab === 'pipeline' && 'Gestión de Workers'}
            </h1>
          )}
        </header>

        {/* Contenido */}
        <div className="app-content">
          {activeTab === 'gallery' && (
            <div className="app-gallery-shell">
              <section className="app-gallery-stage">
                <div className="app-gallery-heading">
                  <div>
                    <p className="app-kicker">Library // {filteredAssets.length.toLocaleString()} visibles de {assets.length.toLocaleString()} // Local DB</p>
                    <h1>Cinematic Media Vault</h1>
                  </div>
                  <div className="app-gallery-status-strip">
                    <span>Fotos <strong>{photoCount}</strong></span>
                    <span>Vídeos <strong>{videoCount}</strong></span>
                    <span>Pipeline: {sseStatus === 'CONNECTED' ? 'Idle' : 'Offline'}</span>
                    <span>{selectedAssets.size} selected</span>
                  </div>
                </div>

                <div className="app-gallery-grid">
                  {isLoadingAssets ? (
                    Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="app-gallery-skeleton" />
                    ))
                  ) : assetLoadError ? (
                    <div className="app-empty-state app-empty-state-rich">
                      <strong>No se pudo cargar la biblioteca</strong>
                      <span>{assetLoadError}</span>
                      <button type="button" onClick={() => void loadAssets()}>Reintentar</button>
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="app-empty-state app-empty-state-rich">
                      <strong>{assets.length === 0 ? 'Biblioteca sin media indexada' : 'No hay resultados para este filtro'}</strong>
                      <span>{assets.length === 0 ? 'Cuando el pipeline importe e indexe archivos aparecerán aquí.' : 'Ajusta búsqueda o tipo de media para ampliar la vista.'}</span>
                      {hasActiveFilters && (
                        <button type="button" onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); }}>Limpiar filtros</button>
                      )}
                    </div>
                  ) : (
                    filteredAssets.map((asset) => (
                      <GalleryCard
                        key={asset.id}
                        asset={asset}
                        isSelected={selectedAssets.has(asset.id)}
                        onToggleSelect={handleToggleSelect}
                        onClick={(a) => setPreviewAsset(a)}
                      />
                    ))
                  )}
                </div>
              </section>

              <aside className="app-inspector-panel">
                <div className="app-inspector-title">Inspector de Archivos</div>
                {inspectorAsset ? (
                  <>
                    <button className="app-inspector-preview" onClick={() => setPreviewAsset(inspectorAsset)}>
                      {inspectorAsset.type === 'VIDEO' ? (
                        <video src={inspectorAsset.videoPreviewUrl || inspectorAsset.imageUrl} poster={inspectorAsset.imageUrl} muted playsInline />
                      ) : (
                        <img src={inspectorAsset.imageUrl} alt={inspectorAsset.title} />
                      )}
                      <span>{inspectorAsset.type}</span>
                    </button>
                    <button type="button" className="app-inspector-open" onClick={() => setPreviewAsset(inspectorAsset)}>Abrir en visor</button>
                    <div className="app-inspector-block">
                      <p>Metadata / File</p>
                      <strong>{inspectorAsset.title}</strong>
                      <span>ID: {inspectorAsset.id.slice(0, 12)}</span>
                      <span>{inspectorAsset.metadata.resolution || 'Resolución pendiente'}</span>
                      <span>{inspectorAsset.metadata.fileSize || 'Tamaño pendiente'}</span>
                      {inspectorAsset.metadata.duration && <span>Duración: {inspectorAsset.metadata.duration}</span>}
                      <span>{inspectorAsset.date}</span>
                    </div>
                    <div className="app-inspector-block">
                      <p>Local AI / Sidecars</p>
                      {inspectorAsset.description && <span className="app-inspector-description">{inspectorAsset.description}</span>}
                      <div className="app-chip-row">
                        {inspectorAsset.tags.length > 0 ? (
                          inspectorAsset.tags.slice(0, 6).map(tag => (
                            <span key={tag} className="app-neon-chip">{tag}</span>
                          ))
                        ) : (
                          <span className="app-neon-chip">Sin tags</span>
                        )}
                      </div>
                    </div>
                    <div className="app-inspector-block">
                      <p>People / Review</p>
                      <div className="app-chip-row">
                        <span className="app-neon-chip magenta">Personas</span>
                        <span className="app-neon-chip red">NSFW</span>
                        <span className="app-neon-chip green">{inspectorAsset.clearance}</span>
                      </div>
                    </div>
                    <div className="app-pipeline-meter"><span /></div>
                  </>
                ) : (
                  <div className="app-empty-state compact">Selecciona un asset para inspeccionarlo.</div>
                )}
              </aside>
            </div>
          )}

          {activeTab === 'console' && (
             <div className="app-console-panel" ref={consoleRef}>
                {logs.length === 0 ? (
                  <div className="text-zinc-500">Esperando eventos del sistema...</div>
                ) : (
                  logs.filter(log => {
                    // 1. Event Type filter
                    if (eventTypeFilter !== 'ALL' && log.type !== eventTypeFilter) {
                      return false;
                    }

                    // 2. Category (subsystem/processName/entityType) filter
                    if (categoryFilter !== 'ALL') {
                      let logCategory = '';
                      if (log.type === 'SYSTEM') {
                        logCategory = (log as any).subsystem || '';
                      } else if (log.type === 'DOMAIN') {
                        logCategory = (log as any).entityType || '';
                      } else if (log.type === 'PROCESS') {
                        logCategory = (log as any).processName || '';
                      }
                      if (logCategory.toUpperCase() !== categoryFilter.toUpperCase()) {
                        return false;
                      }
                    }

                    // 3. Action filter
                    if (actionFilter !== 'ALL') {
                      const logAction = String((log as any).action || '').toUpperCase();
                      if (logAction !== actionFilter.toUpperCase()) {
                        if (actionFilter === 'COMPLETED' && logAction === 'FINISHED') {
                          // allow
                        } else if (actionFilter === 'SUCCESS' && logAction === 'PROCESSED') {
                          // allow
                        } else if (actionFilter === 'FAILED' && logAction === 'ERROR') {
                          // allow
                        } else {
                          return false;
                        }
                      }
                    }

                    // 4. Free text search filter
                    if (!consoleFilter) return true;
                    const term = consoleFilter.toLowerCase();
                    const msg = String(log?.message || '').toLowerCase();
                    const src = String((log as any)?.source || (log as any)?.subsystem || (log as any)?.processName || '').toLowerCase();
                    return msg.includes(term) || src.includes(term);
                  })
                  .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
                  .map((log) => {
                    const typeTag = `[${log.type}]`;
                    let subTag = '';
                    if (log.type === 'SYSTEM') {
                      subTag = ` [${String((log as any).subsystem || '').toUpperCase()}]`;
                    } else if (log.type === 'DOMAIN') {
                      subTag = ` [${String((log as any).entityType || '').toUpperCase()}]`;
                    } else if (log.type === 'PROCESS') {
                      subTag = ` [${String((log as any).processName || '').toUpperCase()}]`;
                    }
                    const actionTag = ` [${String((log as any).action || '').toUpperCase()}]`;

                    const action = String((log as any)?.action || '').toLowerCase();
                    const status = String((log as any)?.status || '').toLowerCase();
                    const lowerMsg = String(log?.message || '').toLowerCase();

                    // Prefix tags color (determined by event type)
                    let tagColorClass = 'text-zinc-400 dark:text-zinc-500';
                    if (log.type === 'SYSTEM') {
                      tagColorClass = 'text-purple-500 dark:text-purple-400 font-semibold';
                    } else if (log.type === 'PROCESS') {
                      tagColorClass = 'text-blue-500 dark:text-blue-400 font-semibold';
                    } else if (log.type === 'DOMAIN') {
                      tagColorClass = 'text-teal-500 dark:text-teal-400 font-semibold';
                    }

                    // Message text color (determined by action outcome/status/content success or failure)
                    let msgColorClass = 'text-zinc-850 dark:text-zinc-300';
                    if (action === 'error' || status === 'error' || lowerMsg.includes('error') || lowerMsg.includes('falló')) {
                      msgColorClass = 'text-red-500 dark:text-red-400';
                    } else if (
                      action === 'success' ||
                      status === 'processed' ||
                      action === 'completed' ||
                      status === 'completed' ||
                      action === 'connected' ||
                      action === 'login' ||
                      action === 'detected' ||
                      action === 'grouped' ||
                      action === 'created'
                    ) {
                      msgColorClass = 'text-emerald-500 dark:text-emerald-400';
                    } else if (action === 'started' || action === 'startup' || status === 'running') {
                      msgColorClass = 'text-blue-500 dark:text-blue-400';
                    } else if (
                      action === 'duplicated' ||
                      action === 'rejected' ||
                      lowerMsg.includes('duplicado') ||
                      lowerMsg.includes('saltado') ||
                      lowerMsg.includes('rechazado')
                    ) {
                      msgColorClass = 'text-amber-500 dark:text-amber-400';
                    }

                    return (
                      <div key={log.id} className="flex items-start gap-2 mb-1 text-zinc-700 dark:text-zinc-300">
                        <span className="text-zinc-500 whitespace-nowrap flex-shrink-0 text-xs select-none">
                          [{new Date(log.occurredAt).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                        </span>
                        <span className={`${tagColorClass} font-mono flex-shrink-0 select-none text-xs`}>
                          {typeTag}{subTag}{actionTag} |
                        </span>
                        <span className={`break-words flex-1 text-xs font-mono ${msgColorClass}`}>
                          {String(log?.message || '').replace(/^\[.*?\]\s*/, '')}
                        </span>
                      </div>
                    );
                  })
                )}
             </div>
          )}

          {activeTab === 'users' && isAdmin && <AdminUsersPanel />}
          {activeTab === 'pipeline' && isAdmin && <AdminImportPanel />}
          {activeTab === 'people' && <AdminPeoplePanel onSelectAsset={setPreviewAsset} />}
        </div>
      </main>

      </div> {/* fin app-window */}

      {/* Modal / Sidebar derecho de imagen */}
      <MediaModal
        asset={previewAsset}
        assets={filteredAssets}
        isSelected={previewAsset ? selectedAssets.has(previewAsset.id) : false}
        onClose={() => setPreviewAsset(null)}
        onNavigate={setPreviewAsset}
        onToggleSelected={toggleAssetSelection}
      />
    </div>
  );
}
