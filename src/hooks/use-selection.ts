import { useState, useCallback, useMemo } from 'react';

export function useSelection<T extends { _id: string }>(items: T[] | undefined) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!items) return;
    setSelectedIds(new Set(items.map(item => item._id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useMemo(() => {
    if (!items || items.length === 0) return false;
    return items.every(item => selectedIds.has(item._id));
  }, [items, selectedIds]);

  const isSomeSelected = useMemo(() => {
    return selectedIds.size > 0;
  }, [selectedIds]);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [isAllSelected, clearSelection, selectAll]);

  const selectedCount = selectedIds.size;
  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  return {
    selectedIds,
    selectedIdsArray,
    selectedCount,
    toggleSelect,
    selectAll,
    clearSelection,
    toggleSelectAll,
    isAllSelected,
    isSomeSelected,
  };
}
