import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export type UserRole = 'ADMIN' | 'STANDARD' | 'VIEWER';

export interface AdminUserDTO {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

const ROLE_OPTIONS: UserRole[] = ['ADMIN', 'STANDARD', 'VIEWER'];

export default function Users() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingRoleUserId, setSavingRoleUserId] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});
  const [activeDrafts, setActiveDrafts] = useState<Record<string, boolean>>({});

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data);
      setRoleDrafts(
        data.reduce((acc: Record<string, UserRole>, currentUser: AdminUserDTO) => {
          acc[currentUser.id] = currentUser.role;
          return acc;
        }, {})
      );
      setActiveDrafts(
        data.reduce((acc: Record<string, boolean>, currentUser: AdminUserDTO) => {
          acc[currentUser.id] = currentUser.isActive;
          return acc;
        }, {})
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    loadUsers();
  }, [isAdmin, loadUsers]);

  const handleSaveRole = async (userId: string) => {
    const nextRole = roleDrafts[userId];
    if (!nextRole) return;

    setSavingRoleUserId(userId);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo actualizar el rol del usuario.');
    } finally {
      setSavingRoleUserId('');
    }
  };

  const handleToggleActive = async (userId: string) => {
    const nextValue = !(activeDrafts[userId] ?? true);
    setSavingRoleUserId(userId);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/admin/users/${userId}/active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextValue })
      });
      if (!res.ok) throw new Error('Failed to update status');
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo actualizar el estado del usuario.');
    } finally {
      setSavingRoleUserId('');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    setDeletingUserId(userId);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete user');
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo eliminar el usuario.');
    } finally {
      setDeletingUserId('');
    }
  };

  if (!isAdmin) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>User Management</h1>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Solo los usuarios con rol ADMIN pueden acceder a esta sección.
        </div>
      </div>
    );
  }

  const adminCount = users.filter((candidate) => candidate.role === 'ADMIN').length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Administrar cuentas activas</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{users.length}</span>
          <span style={{ color: 'var(--text-secondary)' }}>usuarios</span>
        </div>
      </div>

      {errorMessage && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {errorMessage}
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando usuarios...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem' }}>Usuario</th>
                <th style={{ padding: '1rem' }}>Rol</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem' }}>Alta</th>
                <th style={{ padding: '1rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay usuarios registrados.</td>
                </tr>
              ) : (
                users.map((adminUser) => {
                  const isLastAdmin = adminUser.role === 'ADMIN' && adminCount === 1;

                  return (
                    <tr key={adminUser.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{adminUser.username}</td>
                      <td style={{ padding: '1rem' }}>
                        <select
                          value={roleDrafts[adminUser.id] ?? adminUser.role}
                          onChange={(e) =>
                            setRoleDrafts((prev) => ({
                              ...prev,
                              [adminUser.id]: e.target.value as UserRole
                            }))
                          }
                          disabled={isLastAdmin}
                          style={{
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '0.5rem',
                            borderRadius: '4px'
                          }}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: (activeDrafts[adminUser.id] ?? adminUser.isActive) ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: (activeDrafts[adminUser.id] ?? adminUser.isActive) ? '#4ade80' : '#f87171',
                            width: 'fit-content'
                          }}>
                            {(activeDrafts[adminUser.id] ?? adminUser.isActive) ? 'ACTIVA' : 'DESACTIVADA'}
                          </span>
                          {isLastAdmin && (
                            <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>ÚLTIMO ADMIN</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {new Date(adminUser.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => void handleSaveRole(adminUser.id)}
                            disabled={savingRoleUserId === adminUser.id || isLastAdmin}
                            style={{ padding: '0.5rem' }}
                          >
                            {savingRoleUserId === adminUser.id ? '...' : 'Guardar'}
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => void handleToggleActive(adminUser.id)}
                            disabled={savingRoleUserId === adminUser.id || isLastAdmin}
                            style={{ padding: '0.5rem' }}
                          >
                            {(activeDrafts[adminUser.id] ?? adminUser.isActive) ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => void handleDeleteUser(adminUser.id)}
                            disabled={deletingUserId === adminUser.id || isLastAdmin}
                            style={{ padding: '0.5rem', color: '#ef4444' }}
                          >
                            {deletingUserId === adminUser.id ? '...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
