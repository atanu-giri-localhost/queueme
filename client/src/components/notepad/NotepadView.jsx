import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Pin,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import apiService from '../../services/apiService';
import noteDraftService from '../../services/noteDraftService';
import Button from '../common/Button';
import NoteEditor from './NoteEditor';

export default function NotepadView({ onOpenAuth }) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || 'guest';

  // Notes state
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [toastMessage, setToastMessage] = useState(null);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((curr) => (curr === msg ? null : curr)), 3500);
  }, []);

  // Listen to network online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network restored. Ready to sync with cloud.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('You are offline. Notes are automatically saved to this device.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Fetch user notes from API on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadNotes() {
      if (!isAuthenticated) {
        setNotes([]);
        setLoading(false);
        return;
      }

      try {
        const data = await apiService.fetchNotes();
        if (!isCancelled) {
          setNotes(data || []);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Could not fetch notes from cloud:', err.message);
          showToast('Could not load notes from cloud. Working in offline mode.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadNotes();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, showToast]);

  const handleStartNewNote = () => {
    setActiveNoteId('new');
    setMobileShowEditor(true);
  };

  const handleSaveNote = async ({ id, title, content, pinned }) => {
    if (id === 'new') {
      const created = await apiService.createNote({
        title,
        content,
        pinned,
      });
      setNotes((prev) => [created, ...prev]);
      setActiveNoteId(created.id);
    } else {
      const updated = await apiService.updateNote(id, {
        title,
        content,
        pinned,
      });
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }
  };

  const handleDeleteNote = async (idToDelete) => {
    if (idToDelete === 'new') {
      noteDraftService.clearDraft(userId, 'new');
      setActiveNoteId('new');
      showToast('Draft cleared');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await apiService.deleteNote(idToDelete);
      noteDraftService.clearDraft(userId, idToDelete);
      setNotes((prev) => prev.filter((n) => n.id !== idToDelete));

      if (activeNoteId === idToDelete) {
        setActiveNoteId('new');
      }
      showToast('Note deleted');
    } catch (err) {
      console.error('Failed to delete note:', err);
      showToast('Failed to delete note from cloud');
    }
  };

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Filter notes based on search query
  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(term) ||
      n.content?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-zinc-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-100 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container: 2-Column Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Notes List & Search */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col shrink-0 ${
            mobileShowEditor ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & New Note Button */}
          <div className="p-4 border-b border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h1 className="font-bold text-base text-zinc-100 tracking-tight">Notepad</h1>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartNewNote}
                icon={Plus}
                className="shadow-sm"
              >
                New Note
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Unauthenticated Banner */}
          {!isAuthenticated && (
            <div className="p-3 mx-3 my-2 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex flex-col gap-1.5">
              <span className="font-semibold text-zinc-100">Local Scratchpad Mode</span>
              <p className="text-[11px] text-zinc-400">
                Sign in to back up and sync your notes to the cloud across devices.
              </p>
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth('login')}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 text-left cursor-pointer"
              >
                Sign In / Sign Up &rarr;
              </button>
            </div>
          )}

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 p-2 space-y-1">
            {/* New Unsaved Note Option */}
            <div
              onClick={() => {
                setActiveNoteId('new');
                setMobileShowEditor(true);
              }}
              className={`p-3 rounded-2xl cursor-pointer transition-all ${
                activeNoteId === 'new'
                  ? 'bg-indigo-600/15 border border-indigo-500/30 shadow-sm'
                  : 'hover:bg-zinc-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-zinc-200 truncate">
                  + Current Draft / Scratchpad
                </span>
                {noteDraftService.hasDraft(userId, 'new') && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20 shrink-0">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1">
                Write quick thoughts, draft text, or notes...
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span>Loading notes from cloud...</span>
              </div>
            ) : filteredNotes.length === 0 && activeNoteId !== 'new' ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No saved notes found. Click &quot;New Note&quot; to write one!
              </div>
            ) : (
              filteredNotes.map((n) => {
                const isActive = activeNoteId === n.id;
                const hasLocalDraft = noteDraftService.hasDraft(userId, n.id, n);

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setActiveNoteId(n.id);
                      setMobileShowEditor(true);
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 border border-indigo-500/30 shadow-sm'
                        : 'hover:bg-zinc-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {n.pinned && (
                          <Pin className="w-3 h-3 text-indigo-700 dark:text-indigo-400 shrink-0 fill-indigo-700 dark:fill-indigo-400" />
                        )}
                        <span className="font-semibold text-xs text-zinc-100 truncate">
                          {n.title || 'Untitled Note'}
                        </span>
                      </div>
                      {hasLocalDraft && (
                        <span
                          title="Contains unsaved changes on this device"
                          className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold border border-amber-500/20 shrink-0"
                        >
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">
                      {n.content || '(Empty note)'}
                    </p>
                    <span className="text-[10px] text-zinc-600 mt-1 block">
                      {new Date(n.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Note Editor */}
        <NoteEditor
          key={activeNoteId}
          activeNoteId={activeNoteId}
          activeNote={activeNote}
          userId={userId}
          isAuthenticated={isAuthenticated}
          isOnline={isOnline}
          onSaveNote={handleSaveNote}
          onDeleteNote={handleDeleteNote}
          onBackToList={() => setMobileShowEditor(false)}
          onOpenAuth={onOpenAuth}
          showToast={showToast}
        />
      </div>
    </div>
  );
}
