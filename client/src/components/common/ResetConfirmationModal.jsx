import { useEffect } from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function ResetConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isCorrupted = false,
}) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {isCorrupted ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="reset-modal-title" className="text-base font-bold text-white tracking-tight">
                Reset to Sample Data?
              </h3>
              <p className="text-xs text-zinc-400">Restore the default queue backlog</p>
            </div>
          </div>

          <button
            id="close-reset-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80">
          This will replace your current backlog items with a fresh, clean copy of the original
          12 sample items (movies, books, articles, videos, and courses).
          {isCorrupted && (
            <span className="block mt-2 text-amber-400 font-medium">
              A timestamped backup of your unparseable stored data will be created automatically in
              LocalStorage before resetting.
            </span>
          )}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <Button
            id="cancel-reset-btn"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            id="confirm-reset-btn"
            variant="primary"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            icon={RotateCcw}
          >
            Confirm Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
