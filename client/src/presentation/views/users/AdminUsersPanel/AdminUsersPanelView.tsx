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

import { SectionPanel } from '../../../../components/SectionPanel.js';
import type { AdminUserDTO } from '../../../../services/api/interfaces.js';
import type { UserRole } from './useAdminUsersLogic.js';
import '../../../../corporate/AdminUsersPanel.css';

const ROLE_OPTIONS: UserRole[] = ['ADMIN', 'STANDARD', 'VIEWER'];

interface AdminUsersPanelViewProps {
  users: AdminUserDTO[];
  isLoading: boolean;
  errorMessage: string;
  savingRoleUserId: string;
  deletingUserId: string;
  roleDrafts: Record<string, UserRole>;
  setRoleDrafts: React.Dispatch<React.SetStateAction<Record<string, UserRole>>>;
  activeDrafts: Record<string, boolean>;
  isAdmin: boolean;
  adminCount: number;

  handleSaveRole: (userId: string) => Promise<void>;
  handleToggleActive: (userId: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
}

export const AdminUsersPanelView = ({
  users,
  isLoading,
  errorMessage,
  savingRoleUserId,
  deletingUserId,
  roleDrafts,
  setRoleDrafts,
  activeDrafts,
  isAdmin,
  adminCount,
  handleSaveRole,
  handleToggleActive,
  handleDeleteUser
}: AdminUsersPanelViewProps) => {
  if (!isAdmin) {
    return (
      <SectionPanel instanceId="admin-users-section" title="Gestión de Usuarios">
        <div className="admin-users-empty-state" data-instance-id="admin-users-empty-state">
          Solo los usuarios con rol ADMIN pueden acceder a esta sección.
        </div>
      </SectionPanel>
    );
  }

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
                            onClick={() => void handleSaveRole(adminUser.id)}
                            disabled={savingRoleUserId === adminUser.id || isLastAdmin}
                            data-instance-id={`admin-user-save-role-${adminUser.id}`}
                          >
                            {savingRoleUserId === adminUser.id ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            type="button"
                            className="admin-users-row-action"
                            onClick={() => void handleToggleActive(adminUser.id)}
                            disabled={savingRoleUserId === adminUser.id || isLastAdmin}
                            data-instance-id={`admin-user-toggle-active-${adminUser.id}`}
                          >
                            {(activeDrafts[adminUser.id] ?? adminUser.isActive) ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            className="admin-users-row-action admin-users-row-action-danger"
                            onClick={() => void handleDeleteUser(adminUser.id)}
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
