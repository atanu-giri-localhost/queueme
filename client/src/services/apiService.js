import { sanitizeQueueItem } from './storageService.js';

export const AUTH_TOKEN_KEY = 'queueme_auth_token';

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getApiBaseUrl() {
  let envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    (typeof globalThis !== 'undefined' && globalThis.process?.env?.VITE_API_URL);

  if (envUrl && typeof envUrl === 'string') {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api') && /^https?:\/\//i.test(clean)) {
      clean = `${clean}/api`;
    }
    return clean;
  }

  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return 'http://localhost:5000/api';
    }
    return '/api';
  }

  return 'http://localhost:5000/api';
}

export const API_BASE_URL = getApiBaseUrl();

const DEFAULT_TIMEOUT_MS = 6000;

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Fetch wrapper with timeout, token injection, and error extraction
 */
async function apiRequest(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  const token = getStoredToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const config = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeader,
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      // If unauthorized, clear invalid token
      if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        setStoredToken(null);
      }

      const errorMessage =
        (typeof data === 'object' && data?.error) ||
        (typeof data === 'object' && data?.message) ||
        `API request failed with status ${res.status}`;
      const details = typeof data === 'object' ? data?.details : null;
      throw new ApiError(errorMessage, res.status, details);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${options.timeoutMs || DEFAULT_TIMEOUT_MS}ms`, 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network request failed', 0);
  }
}

/**
 * Centralized API Service for QueueMe backend
 */
export const apiService = {
  /**
   * Health check
   */
  async checkHealth() {
    return apiRequest('/health', { timeoutMs: 3000 });
  },

  // ==========================================
  // Authentication Endpoints
  // ==========================================

  async login(email, password) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  async register(email, password, name) {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  async googleAuth(credential) {
    const res = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return apiRequest('/auth/me');
  },

  logout() {
    setStoredToken(null);
  },

  // ==========================================
  // Queue Item Endpoints
  // ==========================================

  /**
   * Fetch all items with optional filters
   */
  async fetchItems(queryParams = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        searchParams.append(k, String(v));
      }
    });

    const queryStr = searchParams.toString();
    const endpoint = `/items${queryStr ? `?${queryStr}` : ''}`;
    const response = await apiRequest(endpoint);

    const rawList = Array.isArray(response) ? response : response?.data || [];
    return rawList.map(sanitizeQueueItem);
  },

  /**
   * Fetch single item by ID
   */
  async fetchItemById(id) {
    const response = await apiRequest(`/items/${encodeURIComponent(id)}`);
    const raw = response?.data || response;
    return sanitizeQueueItem(raw);
  },

  /**
   * Create new item
   */
  async createItem(itemData) {
    const payload = sanitizeQueueItem({ ...itemData });
    const response = await apiRequest('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return sanitizeQueueItem(response?.data || response);
  },

  /**
   * Update existing item (PATCH)
   */
  async updateItem(id, itemData) {
    const payload = { ...itemData };
    delete payload.id; // ID cannot be updated
    delete payload.userId;
    delete payload.createdAt;
    delete payload.updatedAt;

    const response = await apiRequest(`/items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return sanitizeQueueItem(response?.data || response);
  },

  /**
   * Delete item by ID
   */
  async deleteItem(id) {
    return apiRequest(`/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // Note Endpoints
  // ==========================================

  /**
   * Fetch all notes with optional search query
   */
  async fetchNotes(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiRequest(`/notes${query}`);
    return res?.data || [];
  },

  /**
   * Fetch single note by ID
   */
  async getNoteById(id) {
    const res = await apiRequest(`/notes/${encodeURIComponent(id)}`);
    return res?.data;
  },

  /**
   * Create new note (POST)
   */
  async createNote(noteData) {
    const res = await apiRequest('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
    return res?.data;
  },

  /**
   * Update existing note (PATCH)
   */
  async updateNote(id, noteData) {
    const payload = { ...noteData };
    delete payload.id;
    delete payload.userId;
    delete payload.createdAt;
    delete payload.updatedAt;

    const res = await apiRequest(`/notes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res?.data;
  },

  /**
   * Delete note by ID
   */
  async deleteNote(id) {
    return apiRequest(`/notes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export default apiService;
