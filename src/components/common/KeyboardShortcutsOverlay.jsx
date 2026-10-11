import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['1'], description: 'Go to Dashboard' },
      { keys: ['2'], description: 'Go to Queue Backlog' },
      { keys: ['?'], description: 'Show this help overlay' },
    ],
  },
  {
    title: 'Queue Actions',
    shortcuts: [
      { keys: ['N'], description: 'Add new item to queue' },
      { keys: ['G'], description: 'Switch to Grid view' },
      { keys: ['L'], description: 'Switch to List view' },
    ],
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: ['/'], description: 'Focus search bar' },
      { keys: ['Esc'], description: 'Clear search / close modal' },
    ],
  },
];

function Key({ label }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.6rem] h-6 px-1.5 text-[11px] font-mono font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700/80 rounded-md shadow-sm select-none">
      {label}
    </kbd>
  );
}

export default function KeyboardShortcutsOverlay({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-overlay-title"
        className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <h2 id="shortcuts-overlay-title" className="text-sm font-bold text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            id="close-shortcuts-overlay-btn"
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcut groups */}
        <div className="px-5 py-4 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                {group.title}
              </p>
              <div className="space-y-2">
                {group.shortcuts.map((s) => (
                  <div key={s.description} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-zinc-400">{s.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k) => (
                        <Key key={k} label={k} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-zinc-800/60 bg-zinc-900/40">
          <p className="text-[11px] text-zinc-500 text-center">
            Shortcuts are inactive when a text field is focused
          </p>
        </div>
      </div>
    </div>
  );
}
