import { useState, useEffect, useCallback } from 'react';
import {
  QUEUE_STORAGE_KEY,
  loadStoredQueue,
  saveStoredQueue,
  resetStoredQueue,
  sanitizeQueueItem,
} from '../services/storageService.js';
import apiService from '../services/apiService.js';

/**
 * Reusable hook for QueueMe items persistence.
 *
 * Phase 2 Architecture:
 * - Primary persistence: Express + PostgreSQL API via apiService.js
 * - Resilient fallback: LocalStorage caching prevents silent data loss if offline or server is down.
 * - Public API preserved: { items, setItems, storageStatus, storageError, isCorrupted, resetToSampleData }
 * - Optimistic local updates for snappy 0ms UI latency, with background PostgreSQL synchronization.
 */
export function useQueueStorage(storageKey = QUEUE_STORAGE_KEY) {
  // Lazy initial state from LocalStorage for instant render without layout shift
  const [initResult] = useState(() => loadStoredQueue(storageKey));
  const [items, setItemsState] = useState(() => initResult.items);
  const [storageStatus, setStorageStatus] = useState(() =>
    initResult.status === 'corrupted' ? 'corrupted' : 'loading'
  );
  const [storageError, setStorageError] = useState(() => initResult.error);
  const [corruptedRawData, setCorruptedRawData] = useState(() => initResult.rawData);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load from PostgreSQL API with unmount safety
  const reloadItems = useCallback(async () => {
    try {
      const remoteItems = await apiService.fetchItems();
      setItemsState(remoteItems);
      setStorageStatus('valid');
      setStorageError(null);
      saveStoredQueue(remoteItems, storageKey);
    } catch (err) {
      console.warn('QueueMe API fetch failed, falling back to LocalStorage cache:', err.message);
      setStorageStatus(initResult.status === 'corrupted' ? 'corrupted' : 'fallback');
      setStorageError(err.message || 'API unavailable, using local cache');
    } finally {
      setIsLoading(false);
    }
  }, [initResult.status, storageKey]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialQueue() {
      try {
        const remoteItems = await apiService.fetchItems();
        if (!isCancelled) {
          setItemsState(remoteItems);
          setStorageStatus('valid');
          setStorageError(null);
          setIsLoading(false);
          saveStoredQueue(remoteItems, storageKey);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('QueueMe API fetch failed, falling back to LocalStorage cache:', err.message);
          setStorageStatus(initResult.status === 'corrupted' ? 'corrupted' : 'fallback');
          setStorageError(err.message || 'API unavailable, using local cache');
          setIsLoading(false);
        }
      }
    }

    fetchInitialQueue();

    return () => {
      isCancelled = true;
    };
  }, [initResult.status, storageKey]);

  // Synchronize across browser tabs
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItemsState(parsed.map(sanitizeQueueItem));
            setStorageStatus('valid');
            setStorageError(null);
            setCorruptedRawData(null);
          }
        } catch {
          // Ignore external malformed changes
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [storageKey]);

  /**
   * Dispatches CRUD operation to PostgreSQL API based on diff between prev and next state
   */
  const syncWithApi = useCallback(
    async (prevList, nextList) => {
      // 1. Check for item addition
      if (nextList.length > prevList.length) {
        const prevIds = new Set(prevList.map((i) => i.id));
        const addedItem = nextList.find((i) => !prevIds.has(i.id));
        if (addedItem) {
          try {
            await apiService.createItem(addedItem);
            setStorageStatus('valid');
            setStorageError(null);
          } catch (err) {
            console.error('Failed to create item in PostgreSQL API:', err.message);
            setStorageStatus('fallback');
            setStorageError(`API error: ${err.message}`);
          }
        }
        return;
      }

      // 2. Check for item deletion
      if (nextList.length < prevList.length) {
        const nextIds = new Set(nextList.map((i) => i.id));
        const deletedItem = prevList.find((i) => !nextIds.has(i.id));
        if (deletedItem) {
          try {
            await apiService.deleteItem(deletedItem.id);
            setStorageStatus('valid');
            setStorageError(null);
          } catch (err) {
            console.error('Failed to delete item from PostgreSQL API:', err.message);
            setStorageStatus('fallback');
            setStorageError(`API error: ${err.message}`);
          }
        }
        return;
      }

      // 3. Check for item update
      for (const nextItem of nextList) {
        const prevItem = prevList.find((i) => i.id === nextItem.id);
        if (!prevItem) continue;

        const isChanged = Object.keys(nextItem).some((key) => {
          if (key === 'createdAt' || key === 'updatedAt') return false;
          return (
            nextItem[key] !== prevItem[key] &&
            JSON.stringify(nextItem[key]) !== JSON.stringify(prevItem[key])
          );
        });

        if (isChanged) {
          try {
            await apiService.updateItem(nextItem.id, nextItem);
            setStorageStatus('valid');
            setStorageError(null);
          } catch (err) {
            console.error(`Failed to update item '${nextItem.id}' in PostgreSQL API:`, err.message);
            setStorageStatus('fallback');
            setStorageError(`API error: ${err.message}`);
          }
          break;
        }
      }
    },
    []
  );

  /**
   * Wrapped setItems supporting both new array and updater function:
   * 1. Applies optimistic UI update
   * 2. Persists to PostgreSQL via API
   * 3. Syncs to LocalStorage fallback to prevent silent data loss
   */
  const setItems = useCallback(
    (action) => {
      setItemsState((prevItems) => {
        const nextItems = typeof action === 'function' ? action(prevItems) : action;
        const sanitizedNext = (nextItems || []).map(sanitizeQueueItem);

        // Always save to fallback cache (unless user data was previously corrupted)
        if (storageStatus !== 'corrupted') {
          saveStoredQueue(sanitizedNext, storageKey);
        }

        // Asynchronously sync diff with PostgreSQL API
        syncWithApi(prevItems, sanitizedNext);

        return sanitizedNext;
      });
    },
    [syncWithApi, storageStatus, storageKey]
  );

  /**
   * Reset action: re-seeds PostgreSQL database and updates state
   */
  const resetToSampleData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Re-seed remote PostgreSQL database
      const resetItems = await apiService.resetItems();
      setItemsState(resetItems);
      setStorageStatus('valid');
      setStorageError(null);
      setCorruptedRawData(null);
      // Backup reset state to localStorage
      resetStoredQueue(storageKey);
      return { success: true, items: resetItems };
    } catch (apiErr) {
      console.warn('API reset failed, falling back to LocalStorage reset:', apiErr.message);
      const fallbackResult = resetStoredQueue(storageKey);
      setItemsState(fallbackResult.items);
      setStorageStatus('fallback');
      setStorageError(apiErr.message);
      setCorruptedRawData(null);
      return fallbackResult;
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  return {
    items,
    setItems,
    storageStatus,
    storageError,
    corruptedRawData,
    isCorrupted: storageStatus === 'corrupted',
    resetToSampleData,
    isLoading,
    isApiConnected: storageStatus === 'valid',
    isFallback: storageStatus === 'fallback',
    reloadItems,
  };
}
