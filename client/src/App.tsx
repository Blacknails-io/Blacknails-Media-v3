import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Image, Activity, Users, Shield, Terminal } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useGlobalHologram } from './hooks/useGlobalHologram';
import { backendEventsController } from './controllers/BackendEventsController';
import Login from './pages/Login';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';
import { PipelineControlCenter as Pipeline } from './pages/PipelineControlCenter';
import People from './pages/People';
import UsersPage from './pages/Admin/Users';
import Console from './pages/Admin/Console';

function AppContent() {
  const auth = useAuth();
  const { user, isInitializing, isSystemOffline, logout, updateAvatar } = auth;

  const [sseStatus, setSseStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
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

  useGlobalHologram();

  useEffect(() => {
    if (!user) {
      backendEventsController.stop();
      return;
    }
    const unsubscribeStatus = backendEventsController.subscribeStatus((status) => {
      setSseStatus(status);
    });
    backendEventsController.start();

    return () => {
      unsubscribeStatus();
      backendEventsController.stop();
    };
  }, [user]);

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

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface-base text-secondary font-mono" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        INICIALIZANDO SISTEMA...
      </div>
    );
  }

  if (isSystemOffline) {
    return (
      <div className="h-screen w-full flex items-center justify-center font-mono" style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#300', color: '#f00', fontSize: '2rem', fontWeight: 'bold' }}>
        SYSTEM OFFLINE
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header className="app-global-header" style={{ padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-glass)', backdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontWeight: 'bold', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', color: sseStatus === 'CONNECTED' ? 'var(--accent-lime, #4ade80)' : 'var(--accent-ruby, #f87171)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              BLACKNAILS
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{ padding: '0.375rem', borderRadius: '0.5rem', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
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

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'white', cursor: 'pointer', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}
                  title="Cambiar Avatar"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {(user as any).avatarUrl ? (
                    <img src={(user as any).avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.username.substring(0, 2).toUpperCase()
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.username}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role}</span>
                </div>
                <button onClick={logout} style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Cerrar sesión">
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

        <div className="app-container" style={{ flex: 1 }}>
          <nav className="glass-nav">


            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <NavLink to="/" className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`} end>
                <Image size={18} />
                <span>Gallery</span>
              </NavLink>
              
              <NavLink to="/people" className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}>
                <Users size={18} />
                <span>People</span>
              </NavLink>
              
              <div style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Administration
              </div>

              <NavLink to="/admin/console" className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}>
                <Terminal size={18} />
                <span>Live Console</span>
              </NavLink>

              <NavLink to="/admin/pipeline" className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}>
                <Activity size={18} />
                <span>Pipeline Canvas</span>
              </NavLink>

              <NavLink to="/admin/users" className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}>
                <Shield size={18} />
                <span>User Management</span>
              </NavLink>
            </div>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Gallery />} />
              <Route path="/people" element={<People />} />
              <Route path="/admin/console" element={<Console />} />
              <Route path="/admin/pipeline" element={<Pipeline />} />
              <Route path="/admin/jobs" element={<Admin />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
