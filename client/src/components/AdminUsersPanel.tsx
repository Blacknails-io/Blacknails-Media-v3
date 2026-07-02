import { useCallback, useEffect, useState } from 'react';
import { SectionPanel } from './SectionPanel.js';
import { useAuth } from '../context/AuthContext.js';
import { authService } from '../services/api/index.js';
import type { AdminUserDTO } from '../services/api/interfaces.js';
import '../corporate/AdminUsersPanel.css';

type UserRole = 'ADMIN' | 'STANDARD' | 'VIEWER';

const ROLE_OPTIONS: UserRole[] = ['ADMIN', 'STANDARD', 'VIEWER'];

export const AdminUsersPanel = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingRoleUserId, setSavingRoleUserId] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});
  const [activeDrafts, setActiveDrafts] = useState<Record<string, boolean>>({});

  const isAdmin = user?.role === 'ADMIN';

  const loadUsers = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await authService.listUsers(token);
      setUsers(response);
      setRoleDrafts(
        response.reduce<Record<string, UserRole>>((acc, currentUser) => {
          acc[currentUser.id] = currentUser.role;
          return acc;
        }, {})
      );
      setActiveDrafts(
        response.reduce<Record<string, boolean>>((acc, currentUser) => {
          acc[currentUser.id] = currentUser.isActive;
          return acc;
        }, {})
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    loadUsers();
  }, [isAdmin, loadUsers]);

  const handleSaveRole = async (userId: string) => {
    if (!token) return;

    const nextRole = roleDrafts[userId];
    if (!nextRole) return;

    setSavingRoleUserId(userId);
    setErrorMessage('');

    try {
      await authService.updateUserRole(token, userId, nextRole);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo actualizar el rol del usuario.');
    } finally {
      setSavingRoleUserId('');
    }
  };

  const handleToggleActive = async (userId: string) => {
    if (!token) return;

    const nextValue = !(activeDrafts[userId] ?? true);
    setSavingRoleUserId(userId);
    setErrorMessage('');

    try {
      await authService.updateUserActive(token, userId, nextValue);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo actualizar el estado del usuario.');
    } finally {
      setSavingRoleUserId('');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;

    const confirmed = window.confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    setDeletingUserId(userId);
    setErrorMessage('');

    try {
      await authService.deleteUser(token, userId);
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo eliminar el usuario.');
    } finally {
      setDeletingUserId('');
    }
  };

  if (!isAdmin) {
    return (
      <SectionPanel instanceId="admin-users-section" title="Gestión de Usuarios">
        <div className="admin-users-empty-state" data-instance-id="admin-users-empty-state">
          Solo los usuarios con rol ADMIN pueden acceder a esta sección.
        </div>
      </SectionPanel>
    );
  }

  const adminCount = users.filter((candidate) => candidate.role === 'ADMIN').length;

  return (
    <SectionPanel instanceId="admin-users-section" title="Gestión de Usuarios">
      <div className="admin-users-panel" data-instance-id="admin-users-panel">
        <div className="admin-users-header">
          <div>
            <p className="admin-users-kicker">CONTROL DE ACCESO</p>
            <h3 className="admin-users-title">Administrar cuentas activas</h3>
          </div>
          <div className="admin-users-summary">
            <span>{users.length}</span>
            <small>usuarios</small>
          </div>
        </div>

        {errorMessage && (
          <div className="admin-users-error" data-instance-id="admin-users-error">
            {errorMessage}
          </div>
        )}

        <div className="admin-users-table-wrap">
          {isLoading ? (
            <div className="admin-users-empty-state">Cargando usuarios...</div>
          ) : (
            <table className="admin-users-table" data-instance-id="admin-users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Alta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No hay usuarios registrados.</td>
                  </tr>
                ) : (
                  users.map((adminUser) => {
                    const isLastAdmin = adminUser.role === 'ADMIN' && adminCount === 1;

                    return (
                      <tr key={adminUser.id} data-instance-id={`admin-user-row-${adminUser.id}`}>
                        <td>{adminUser.username}</td>
                        <td>
                          <select
                            className="admin-users-role-select"
                            value={roleDrafts[adminUser.id] ?? adminUser.role}
                            onChange={(e) =>
                              setRoleDrafts((prev) => ({
                                ...prev,
                                [adminUser.id]: e.target.value as UserRole
                              }))
                            }
                            data-instance-id={`admin-user-role-select-${adminUser.id}`}
                            disabled={isLastAdmin}
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className={`admin-users-status ${activeDrafts[adminUser.id] ?? adminUser.isActive ? 'admin-users-status-active' : 'admin-users-status-inactive'}`}>
                            {(activeDrafts[adminUser.id] ?? adminUser.isActive) ? 'ACTIVA' : 'DESACTIVADA'}
                          </span>
                          {isLastAdmin && (
                            <span className="admin-users-status admin-users-status-warning">ÚLTIMO ADMIN</span>
                          )}
                        </td>
                        <td>{new Date(adminUser.createdAt).toLocaleString()}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-users-row-action"
                            onClick={() => handleSaveRole(adminUser.id)}
                            disabled={savingRoleUserId === adminUser.id || isLastAdmin}
                            data-instance-id={`admin-user-save-role-${adminUser.id}`}
                          >
                            {savingRoleUserId === adminUser.id ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            type="button"
                            className="admin-users-row-action"
                            onClick={() => handleToggleActive(adminUser.id)}
                            disabled={savingRoleUserId === adminUser.id || isLastAdmin}
                            data-instance-id={`admin-user-toggle-active-${adminUser.id}`}
                          >
                            {(activeDrafts[adminUser.id] ?? adminUser.isActive) ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            className="admin-users-row-action admin-users-row-action-danger"
                            onClick={() => handleDeleteUser(adminUser.id)}
                            disabled={deletingUserId === adminUser.id || isLastAdmin}
                            data-instance-id={`admin-user-delete-${adminUser.id}`}
                          >
                            {deletingUserId === adminUser.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
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
    </SectionPanel>
  );
};
