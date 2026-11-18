/**
 * Service to manage local draft persistence in localStorage
 * Guarantees zero data loss even when offline or before explicit saving to PostgreSQL
 */

const STORAGE_PREFIX = 'queueme_notepad_drafts_';

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

function readAllDrafts(userId) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to read note drafts from localStorage:', err);
    return {};
  }
}

function writeAllDrafts(userId, drafts) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(drafts));
  } catch (err) {
    console.warn('Failed to save note drafts to localStorage:', err);
  }
}

export const noteDraftService = {
  /**
   * Get draft for a specific note (or 'new')
   */
  getDraft(userId, noteId = 'new') {
    const drafts = readAllDrafts(userId);
    return drafts[noteId] || null;
  },

  /**
   * Save draft in localStorage immediately (auto-saved as user types)
   */
  saveDraft(userId, noteId = 'new', { title, content, pinned }) {
    const drafts = readAllDrafts(userId);
    drafts[noteId] = {
      title: title ?? '',
      content: content ?? '',
      pinned: !!pinned,
      updatedAt: Date.now(),
    };
    writeAllDrafts(userId, drafts);
    return drafts[noteId];
  },

  /**
   * Clear draft once successfully saved to database
   */
  clearDraft(userId, noteId = 'new') {
    const drafts = readAllDrafts(userId);
    if (drafts[noteId]) {
      delete drafts[noteId];
      writeAllDrafts(userId, drafts);
    }
  },

  /**
   * Check if a note has an unsaved local draft that differs from the DB version
   */
  hasDraft(userId, noteId = 'new', baseNote = null) {
    const draft = this.getDraft(userId, noteId);
    if (!draft) return false;
    if (!baseNote) {
      return !!(draft.title?.trim() || draft.content?.trim());
    }
    const titleDiff = (draft.title || '') !== (baseNote.title || '');
    const contentDiff = (draft.content || '') !== (baseNote.content || '');
    return titleDiff || contentDiff;
  },

  /**
   * Get all active drafts for user
   */
  getAllDrafts(userId) {
    return readAllDrafts(userId);
  },
};

export default noteDraftService;
