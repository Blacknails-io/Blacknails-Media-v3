import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authService } from '../services/api/index.js';

interface AuthContextValue {
  token: string | null;
  user: { username: string; role: 'ADMIN' | 'STANDARD' | 'VIEWER'; isActive: boolean; avatarUrl?: string } | null;
  isLoggedIn: boolean;
  login: (username: string, passwordRaw: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  updateAvatar: (file: File) => Promise<void>;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Generate a random client ID to identify this browser tab session
const generateClientId = () => {
  return 'cli-' + Math.random().toString(36).substring(2, 10);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; role: 'ADMIN' | 'STANDARD' | 'VIEWER'; isActive: boolean; avatarUrl?: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const clientIdRef = useRef<string>(generateClientId());

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bn_session_token');
    sessionStorage.removeItem('bn_session_token');
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('bn_session_token') || sessionStorage.getItem('bn_session_token');
    if (storedToken) {
      authService.getProfile(storedToken)
        .then((profile) => {
          setToken(storedToken);
          setUser({ username: profile.username, role: profile.role, isActive: profile.isActive, avatarUrl: profile.avatarUrl });
        })
        .catch(() => {
          clearSession();
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const validateSession = async () => {
      try {
        const profile = await authService.getProfile(token);
        if (cancelled) return;
        setUser({ username: profile.username, role: profile.role, isActive: profile.isActive, avatarUrl: profile.avatarUrl });
      } catch (err) {
        if (!cancelled) {
          clearSession();
        }
      }
    };

    validateSession();
    const intervalId = window.setInterval(validateSession, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [token, clearSession]);

  const login = async (username: string, passwordRaw: string, rememberMe: boolean) => {
    try {
      const response = await authService.login(username, passwordRaw, clientIdRef.current);
      
      setToken(response.token);
      setUser({ username: response.username, role: response.role, isActive: response.isActive, avatarUrl: response.avatarUrl });

      if (rememberMe) {
        localStorage.setItem('bn_session_token', response.token);
      } else {
        sessionStorage.setItem('bn_session_token', response.token);
      }
      
    } catch (err: any) {
      console.error('Error durante el login:', err);
      throw err;
    }
  };

  const logout = () => {
    const currentToken = token;
    clearSession();
    if (currentToken) {
      void authService.logout(currentToken);
    }
  };

  const updateAvatar = async (file: File) => {
    if (!token) return;
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch('/api/auth/me/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (!res.ok) throw new Error('Error al subir el avatar');
    const data = await res.json();
    setUser({ username: data.username, role: data.role, isActive: data.isActive, avatarUrl: data.avatarUrl });
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn: token !== null, login, logout, updateAvatar, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
