import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitializing: boolean;
  isSystemOffline: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isInitializing: true,
  isSystemOffline: false,
  login: () => {},
  logout: () => {},
  updateAvatar: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSystemOffline, setIsSystemOffline] = useState(false);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/health', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        setIsSystemOffline(true);
      } else {
        setIsSystemOffline(false);
      }
    } catch (error) {
      setIsSystemOffline(true);
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      await Promise.allSettled([
        fetch('/api/auth/me')
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Not logged in');
          })
          .then(data => {
            setUser(data);
            setLoading(false);
          })
          .catch(() => {
            setUser(null);
            setLoading(false);
          }),
        checkHealth()
      ]);
      setIsInitializing(false);
    };

    void initApp();

    const healthIntervalId = setInterval(() => {
      void checkHealth();
    }, 5000);

    return () => clearInterval(healthIntervalId);
  }, [checkHealth]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const validateSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (cancelled) return;
        
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          clearSession();
        }
      } catch (err) {
        if (!cancelled) {
          clearSession();
        }
      }
    };

    const intervalId = window.setInterval(validateSession, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user, clearSession]);

  const login = (user: User) => setUser(user);
  
  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      setUser(null);
    });
  };

  const updateAvatar = async (file: File) => {
    if (!user) return;
    const formData = new FormData();
    formData.append('avatar', file);
    // Since we rely on cookies, no need to manually append tokens
    const res = await fetch('/api/auth/me/avatar', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Error al subir el avatar');
    const data = await res.json();
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isInitializing, isSystemOffline, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
