import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pin,
  PinOff,
  Trash2,
  Cloud,
  CloudOff,
  Check,
  Clock,
  Eye,
  Edit3,
  Bold,
  Italic,
  Heading,
  List,
  CheckSquare,
  Code,
  Quote,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import noteDraftService from '../../services/noteDraftService';
import Button from '../common/Button';
import MarkdownPreview from './MarkdownPreview';

export default function NoteEditor({
  activeNoteId,
  activeNote,
  userId,
  isAuthenticated,
  isOnline,
  onSaveNote,
  onDeleteNote,
  onBackToList,
  onOpenAuth,
  showToast,
}) {
  // Read initial draft or base note
  const initialDraft = noteDraftService.getDraft(userId, activeNoteId);
  const [title, setTitle] = useState(() => initialDraft?.title ?? activeNote?.title ?? '');
  const [content, setContent] = useState(() => initialDraft?.content ?? activeNote?.content ?? '');
  const [pinned, setPinned] = useState(() => initialDraft?.pinned ?? activeNote?.pinned ?? false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState(() => {
    if (initialDraft && (initialDraft.title !== activeNote?.title || initialDraft.content !== activeNote?.content)) {
      return 'draft';
    }
    return 'saved';
  });

  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const autoSaveDraft = useCallback(
    (t, c, p) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        noteDraftService.saveDraft(userId, activeNoteId, {
          title: t,
          content: c,
          pinned: p,
        });
      }, 250);
    },
    [userId, activeNoteId]
  );

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    setSaveStatus('draft');
    autoSaveDraft(newTitle, content, pinned);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setSaveStatus('draft');
    autoSaveDraft(title, newContent, pinned);
  };

  const handleTogglePin = () => {
    const next = !pinned;
    setPinned(next);
    setSaveStatus('draft');
    autoSaveDraft(title, content, next);
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    if (!isOnline) {
      showToast('You are offline. Note draft is safely saved on this device.');
      setSaveStatus('offline');
      return;
    }

    setSaveStatus('saving');
    try {
      await onSaveNote({
        id: activeNoteId,
        title: title.trim() || 'Untitled Note',
        content,
        pinned,
      });
      noteDraftService.clearDraft(userId, activeNoteId);
      setSaveStatus('saved');
      showToast('Note saved to cloud!');
    } catch (err) {
      console.warn('Failed to save note:', err);
      setSaveStatus('draft');
      showToast('Could not save to cloud. Draft remains on this device.');
    }
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const insertFormatting = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 10);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <main className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Editor Header Bar */}
      <div className="h-16 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between gap-3 shrink-0 bg-zinc-950/80 backdrop-blur-xl">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBackToList}
          className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Back to notes list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Note Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note Title..."
          className="flex-1 bg-transparent border-0 text-base sm:text-lg font-bold text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0 truncate"
        />

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Pin Toggle */}
          <button
            type="button"
            onClick={handleTogglePin}
            title={pinned ? 'Unpin note' : 'Pin note to top'}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              pinned
                ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            {pinned ? <Pin className="w-4 h-4 fill-indigo-400" /> : <PinOff className="w-4 h-4" />}
          </button>

          {/* Delete Note Button */}
          <button
            type="button"
            onClick={() => onDeleteNote(activeNoteId)}
            title="Delete note"
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Status Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border"
            style={{
              backgroundColor:
                saveStatus === 'saved'
                  ? 'rgba(16, 185, 129, 0.08)'
                  : saveStatus === 'offline'
                  ? 'rgba(245, 158, 11, 0.08)'
                  : 'rgba(234, 179, 8, 0.08)',
              borderColor:
                saveStatus === 'saved'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : saveStatus === 'offline'
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(234, 179, 8, 0.2)',
              color:
                saveStatus === 'saved'
                  ? '#34d399'
                  : saveStatus === 'offline'
                  ? '#fbbf24'
                  : '#facc15',
            }}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved to Cloud</span>
              </>
            ) : saveStatus === 'offline' || !isOnline ? (
              <>
                <CloudOff className="w-3.5 h-3.5" />
                <span>Offline (Saved on device)</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>Draft saved on device</span>
              </>
            )}
          </div>

          {/* Save to Cloud Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            icon={saveStatus === 'saving' ? Loader2 : Cloud}
            disabled={saveStatus === 'saving'}
            className="shadow-md shadow-indigo-600/20"
            title="Save note to database (Ctrl+S)"
          >
            <span className="hidden sm:inline">Save Note</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="px-4 py-2 border-b border-zinc-800/60 bg-zinc-950/40 flex items-center justify-between gap-2 overflow-x-auto select-none shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('## ')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Heading (## Heading)"
          >
            <Heading className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- ')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Bullet list (- Item)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- [ ] ')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Task list (- [ ] Task)"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('`', '`')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Inline code (`code`)"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('> ')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Quote (> quote)"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Preview / Edit Mode */}
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              !previewMode ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              previewMode ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {previewMode ? (
          <div className="max-w-3xl mx-auto prose dark:prose-invert">
            <h1 className="text-2xl font-bold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">
              {title || 'Untitled Note'}
            </h1>
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start typing your note... You can write plain text, bullet points, checklists (- [ ]), quotes, or markdown. Your draft is continuously preserved on this device even if you go offline."
            className="w-full h-full min-h-[350px] bg-transparent border-0 text-sm sm:text-base text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-0 resize-none font-sans leading-relaxed"
          />
        )}
      </div>

      {/* Editor Status Footer */}
      <div className="h-10 px-4 sm:px-6 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 shrink-0 bg-zinc-950/60">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Press Ctrl+S to save to cloud</span>
        </div>
      </div>
    </main>
  );
}
