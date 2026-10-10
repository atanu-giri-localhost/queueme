import { INITIAL_ITEMS } from '../data/sampleData.js';

export const QUEUE_STORAGE_KEY = 'queueme_items_v1';

/**
 * Creates a fresh, deep copy of INITIAL_ITEMS
 * preventing reference mutations from affecting the initial template.
 */
export function cloneInitialItems() {
  return JSON.parse(JSON.stringify(INITIAL_ITEMS));
}

/**
 * Safe wrapper to check if localStorage is available in the current environment
 */
export function isLocalStorageAvailable() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__qm_test_storage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Restricts ratings to a 1–5 range, gracefully scaling legacy 10-point scale ratings,
 * clamping out-of-range ratings, or returning empty string if not set.
 */
export function normalizeRating(rawRating) {
  if (rawRating === undefined || rawRating === null || rawRating === '') {
    return '';
  }
  const num = parseFloat(rawRating);
  if (isNaN(num)) return '';
  if (num > 5) {
    // Scale legacy 10-point rating to 1–5
    const scaled = Math.min(5, Math.max(1, Math.round((num / 2) * 10) / 10));
    return String(scaled);
  }
  if (num < 1) {
    return '1';
  }
  return String(Math.round(num * 10) / 10);
}

/**
 * Sanitizes and validates an individual queue item to ensure ratings remain 1–5,
 * status and progress stay consistent, and data remains safe and valid.
 */
export function sanitizeQueueItem(item) {
  if (!item || typeof item !== 'object') return item;
  const sanitized = { ...item };

  // Ratings restricted to 1–5
  if (sanitized.rating !== undefined && sanitized.rating !== null && sanitized.rating !== '') {
    sanitized.rating = normalizeRating(sanitized.rating);
  }

  // Ensure tags is always an array
  if (!Array.isArray(sanitized.tags)) {
    if (typeof sanitized.tags === 'string' && sanitized.tags.trim()) {
      sanitized.tags = sanitized.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
    } else {
      sanitized.tags = [];
    }
  }

  // Ensure status and progress stay synchronized
  if (sanitized.status === 'completed') {
    sanitized.progress = 100;
    if (!sanitized.progressLabel) sanitized.progressLabel = 'Finished';
  } else if (sanitized.status === 'queued') {
    sanitized.progress = 0;
    if (!sanitized.progressLabel) sanitized.progressLabel = 'Not started';
  } else if (sanitized.status === 'in_progress') {
    if (typeof sanitized.progress !== 'number' || isNaN(sanitized.progress)) {
      sanitized.progress = 25;
    } else {
      sanitized.progress = Math.min(99, Math.max(0, Math.round(sanitized.progress)));
    }
    if (!sanitized.progressLabel) sanitized.progressLabel = `In progress (${sanitized.progress}%)`;
  } else {
    // Fallback if status is unknown
    sanitized.status = 'queued';
    sanitized.progress = 0;
    sanitized.progressLabel = 'Not started';
  }

  return sanitized;
}

/**
 * Loads stored queue items from localStorage.
 *
 * Safety guarantees:
 * 1. If key is missing, returns status: 'empty' and fresh clone of INITIAL_ITEMS.
 * 2. If key exists and contains valid JSON array, returns status: 'valid' with parsed items.
 * 3. If key contains malformed JSON or non-array data, returns status: 'corrupted',
 *    preserves the corrupted raw string in localStorage without overwriting it,
 *    and provides fallback items for safe in-memory rendering.
 */
export function loadStoredQueue(storageKey = QUEUE_STORAGE_KEY) {
  if (!isLocalStorageAvailable()) {
    return {
      items: cloneInitialItems(),
      status: 'unsupported',
      rawData: null,
      error: new Error('localStorage is not available in this environment.'),
    };
  }

  let raw;
  try {
    raw = window.localStorage.getItem(storageKey);
  } catch (err) {
    return {
      items: cloneInitialItems(),
      status: 'unsupported',
      rawData: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }

  // Scenario 1: No saved data exists
  if (raw === null) {
    const initialCopy = cloneInitialItems();
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(initialCopy));
    } catch {
      // Ignore quota error on initial seed
    }
    return {
      items: initialCopy,
      status: 'empty',
      rawData: null,
      error: null,
    };
  }

  // Scenario 2: Data exists, attempt parsing
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Stored data is not a valid queue array.');
    }
    const sanitizedItems = parsed.map(sanitizeQueueItem);
    return {
      items: sanitizedItems,
      status: 'valid',
      rawData: raw,
      error: null,
    };
  } catch (parseError) {
    // Scenario 3: Malformed data.
    // CRITICAL: DO NOT overwrite window.localStorage[storageKey] here!
    // Keep user's recoverable data intact in storage.
    return {
      items: cloneInitialItems(),
      status: 'corrupted',
      rawData: raw,
      error: parseError instanceof Error ? parseError : new Error(String(parseError)),
    };
  }
}

/**
 * Saves queue items to localStorage.
 * Fails safely without throwing if quota is exceeded or storage is restricted.
 */
export function saveStoredQueue(items, storageKey = QUEUE_STORAGE_KEY) {
  if (!isLocalStorageAvailable()) {
    return { success: false, error: new Error('localStorage is not available.') };
  }

  try {
    const serialized = JSON.stringify(items);
    window.localStorage.setItem(storageKey, serialized);
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Resets queue items in localStorage to a fresh clone of INITIAL_ITEMS.
 * If raw data already exists, backs it up to a timestamped backup key first
 * for ultimate data safety.
 */
export function resetStoredQueue(storageKey = QUEUE_STORAGE_KEY) {
  const freshItems = cloneInitialItems();

  if (isLocalStorageAvailable()) {
    try {
      const existingRaw = window.localStorage.getItem(storageKey);
      if (existingRaw !== null) {
        // Create emergency recovery backup
        const backupKey = `${storageKey}_backup_${Date.now()}`;
        try {
          window.localStorage.setItem(backupKey, existingRaw);
        } catch {
          // If backup fails due to quota, proceed with reset
        }
      }
      window.localStorage.setItem(storageKey, JSON.stringify(freshItems));
    } catch (err) {
      return {
        items: freshItems,
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }

  return {
    items: freshItems,
    success: true,
    error: null,
  };
}
