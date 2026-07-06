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

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { peopleService } from '../../../../services/api/index.js';
import type { PersonDTO } from '../../../../services/api/index.js';
import type { MediaAsset } from '../../../../types/MediaAsset.js';

export type PeopleSortMode = 'COUNT_DESC' | 'NAME_ASC' | 'UNNAMED_FIRST';

export function useAdminPeopleLogic(token: string | null) {
  const [people, setPeople] = useState<PersonDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-gallery states
  const [selectedPerson, setSelectedPerson] = useState<PersonDTO | null>(null);
  const [personAssets, setPersonAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [personAssetsError, setPersonAssetsError] = useState<string | null>(null);

  // Inline editing state
  const [peopleQuery, setPeopleQuery] = useState('');
  const [sortMode, setSortMode] = useState<PeopleSortMode>('COUNT_DESC');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
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
      const data = await peopleService.list(token || undefined);
      setPeople(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchPersonAssets = useCallback(async (person: PersonDTO) => {
    setSelectedPerson(person);
    setIsLoadingAssets(true);
    setPersonAssets([]);
    setPersonAssetsError(null);
    try {
      const data = await peopleService.getAssets(person.id, token || undefined);
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
      await peopleService.updateName(personId, valueToSave, token || undefined);
      
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

  const handleDismissPerson = useCallback(async (person: PersonDTO) => {
    const label = person.name || person.label;
    if (!window.confirm('Descartar ' + label + ' como falso positivo? Se borraran sus detecciones de rostro.')) {
      return;
    }

    setDismissingId(person.id);
    try {
      await peopleService.deletePerson(person.id, token || undefined);
      setPeople(prev => prev.filter(p => p.id !== person.id));
      if (selectedPerson?.id === person.id) {
        setSelectedPerson(null);
        setPersonAssets([]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error descartando la persona.');
    } finally {
      setDismissingId(null);
    }
  }, [selectedPerson, token]);

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

  return {
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
    existingNames,
    filteredNames,
    visiblePeople,
    namedCount,
    totalFaces,
    fetchPeople,
    fetchPersonAssets,
    handleSaveName,
    handleDismissPerson
  };
}
