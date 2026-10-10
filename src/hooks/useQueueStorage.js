import { useState, useEffect, useRef, useCallback } from 'react';
import {
  QUEUE_STORAGE_KEY,
  loadStoredQueue,
  saveStoredQueue,
  resetStoredQueue,
  sanitizeQueueItem,
} from '../services/storageService';

/**
 * Reusable hook for QueueMe items storage persistence with LocalStorage.
 *
 * Guarantees:
 * - Lazy state initialization (no flashes, no empty initial state overwriting storage).
 * - Safe handling of corrupted/malformed JSON: does NOT silently overwrite recoverable user data.
 * - Reset action replaces stored items with a fresh clone of INITIAL_ITEMS.
 * - Tab synchronization via window 'storage' event.
 */
export function useQueueStorage(storageKey = QUEUE_STORAGE_KEY) {
  // Lazy initialization to read storage on the very first render
  const [initResult] = useState(() => loadStoredQueue(storageKey));
  const [items, setItems] = useState(() => initResult.items);
  const [storageStatus, setStorageStatus] = useState(() => initResult.status);
  const [storageError, setStorageError] = useState(() => initResult.error);
  const [corruptedRawData, setCorruptedRawData] = useState(() => initResult.rawData);

  // Track initial mount to prevent redundant or premature initial writes
  const isInitialMount = useRef(true);

  // Synchronize state changes to localStorage
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Safety check: Never silently overwrite corrupted data with regular automatic sync
    if (storageStatus === 'corrupted') {
      return;
    }

    const { success, error } = saveStoredQueue(items, storageKey);
    if (!success && error) {
      console.warn('QueueMe LocalStorage save failed:', error);
    }
  }, [items, storageStatus, storageKey]);

  // Synchronize across browser tabs
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed.map(sanitizeQueueItem));
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

  // Reset action with fresh clone
  const resetToSampleData = useCallback(() => {
    const result = resetStoredQueue(storageKey);
    setItems(result.items);
    setStorageStatus('valid');
    setStorageError(null);
    setCorruptedRawData(null);
    return result;
  }, [storageKey]);

  return {
    items,
    setItems,
    storageStatus,
    storageError,
    corruptedRawData,
    isCorrupted: storageStatus === 'corrupted',
    resetToSampleData,
  };
}
