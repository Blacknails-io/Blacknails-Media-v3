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

import { useState, useEffect, useCallback } from 'react';
import { authService } from '../../../../services/api/index.js';
import type { AdminUserDTO } from '../../../../services/api/interfaces.js';

export type UserRole = 'ADMIN' | 'STANDARD' | 'VIEWER';

export function useAdminUsersLogic(token: string | null, currentUserRole: string | undefined) {
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingRoleUserId, setSavingRoleUserId] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});
  const [activeDrafts, setActiveDrafts] = useState<Record<string, boolean>>({});

  const isAdmin = currentUserRole === 'ADMIN';

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

    void loadUsers();
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

  const adminCount = users.filter((candidate) => candidate.role === 'ADMIN').length;

  return {
    users,
    isLoading,
    errorMessage,
    savingRoleUserId,
    deletingUserId,
    roleDrafts,
    setRoleDrafts,
    activeDrafts,
    setActiveDrafts,
    isAdmin,
    adminCount,
    loadUsers,
    handleSaveRole,
    handleToggleActive,
    handleDeleteUser
  };
}
