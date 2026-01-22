import { useState, useMemo, useCallback } from 'react';
import { ProcessDefinition, VersionStatus } from '../types';
import { useUser } from '../contexts/UserContext';
import { useData } from '../contexts/DataContext';
import { LibraryContext } from './useAppNavigation';

export function useLibraryFilters(libraryContext: LibraryContext) {
  const { currentUser } = useUser();
  const { processes } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterMenu, setActiveFilterMenu] = useState<{ key: string; x: number; y: number } | null>(null);
  const [activeVersionSelector, setActiveVersionSelector] = useState<string | null>(null);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.dir === 'asc') return { key, dir: 'desc' };
        return null;
      }
      return { key, dir: 'asc' };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSortConfig(null);
    setColumnFilters({});
    setActiveVersionSelector(null);
  }, []);

  // VISIBILITY FILTERING LOGIC
  const visibleProcesses = useMemo(() => {
    return processes.filter(p => {
      if (currentUser.permissions.canManageTeam) return true;
      if (currentUser.team === 'External') return true;
      if (p.category === currentUser.team) return true;
      if (p.isPublic) return true;
      return false;
    });
  }, [processes, currentUser]);

  const groupedProcesses = useMemo(() => {
    const latestVersions: Record<string, ProcessDefinition> = {};
    visibleProcesses.forEach(p => {
      const current = latestVersions[p.rootId];
      if (libraryContext === 'RUN') {
        if (p.status === 'PUBLISHED') {
          if (!current || p.versionNumber > current.versionNumber) {
            latestVersions[p.rootId] = p;
          }
        }
      } else {
        if (!current) {
          latestVersions[p.rootId] = p;
        } else {
          const priorityMap: Record<VersionStatus, number> = { DRAFT: 4, IN_REVIEW: 3, PUBLISHED: 2, ARCHIVED: 1 };
          const pPrio = priorityMap[p.status] || 0;
          const cPrio = priorityMap[current.status] || 0;
          if (pPrio > cPrio) {
            latestVersions[p.rootId] = p;
          } else if (pPrio === cPrio && p.versionNumber > current.versionNumber) {
            latestVersions[p.rootId] = p;
          }
        }
      }
    });
    return Object.values(latestVersions);
  }, [visibleProcesses, libraryContext]);

  const filteredData = useMemo(() => {
    let result = [...groupedProcesses];
    if (searchTerm) {
      result = result.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (!val) return;
      result = result.filter(p => {
        const d = p as any;
        return (d[key]?.toString() || '').toLowerCase().includes(String(val).toLowerCase());
      });
    });
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = ((a as any)[sortConfig.key]?.toString() || '').toLowerCase();
        const valB = ((b as any)[sortConfig.key]?.toString() || '').toLowerCase();
        if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [groupedProcesses, searchTerm, sortConfig, columnFilters]);

  return {
    // State
    searchTerm,
    sortConfig,
    columnFilters,
    activeFilterMenu,
    activeVersionSelector,
    filteredData,
    
    // Actions
    setSearchTerm,
    handleSort,
    setColumnFilters,
    setActiveFilterMenu,
    setActiveVersionSelector,
    resetFilters,
  };
}
