import { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Clock,
  Calendar,
  Star,
  Tag,
  CheckCircle2,
  Flame,
  Layers,
  Edit3,
  Trash2,
  Save,
  AlertTriangle,
  Minus,
  Plus,
} from 'lucide-react';
import { TypeBadge, StatusBadge, PriorityBadge, TagBadge } from '../common/Badge';
import TypeIcon from '../common/TypeIcon';
import Button from '../common/Button';

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onStatusChange,
  onUpdateItem,
  onDeleteItem,
  onSelectTag,
  activeTag,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCreator, setEditCreator] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editRating, setEditRating] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Handle escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (isEditing) {
          setIsEditing(false);
          setValidationError('');
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showDeleteConfirm, isEditing]);

  if (!isOpen || !item) return null;

  const handleStartEdit = () => {
    setEditTitle(item.title || '');
    setEditCreator(item.creator || '');
    setEditDuration(item.duration || '');
    const initialRating = item.rating
      ? (parseFloat(item.rating) > 5
          ? String(Math.min(5, Math.max(1, Math.round((parseFloat(item.rating) / 2) * 10) / 10)))
          : String(item.rating))
      : '';
    setEditRating(initialRating);
    setEditNotes(item.notes || '');
    setValidationError('');
    setShowDeleteConfirm(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setValidationError('');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setValidationError('Title cannot be empty.');
      return;
    }
    if (!editCreator.trim()) {
      setValidationError('Creator / author cannot be empty.');
      return;
    }
    if (editRating.trim() !== '') {
      const num = parseFloat(editRating);
      if (isNaN(num) || num < 1 || num > 5) {
        setValidationError('Rating must be a number between 1 and 5.');
        return;
      }
    }

    const updatedItem = {
      ...item,
      title: editTitle.trim(),
      creator: editCreator.trim(),
      duration: editDuration.trim() || item.duration,
      rating: editRating.trim() ? String(Math.round(parseFloat(editRating) * 10) / 10) : '',
      notes: editNotes.trim(),
    };

    if (onUpdateItem) {
      onUpdateItem(updatedItem);
    }
    setIsEditing(false);
    setValidationError('');
  };

  const handleConfirmDelete = () => {
    if (onDeleteItem) {
      onDeleteItem(item.id);
    }
    setShowDeleteConfirm(false);
    setIsEditing(false);
    onClose();
  };

  // Safe progress percentage calculation handling missing or invalid values
  const currentProgress =
    item && typeof item.progress === 'number' && !isNaN(item.progress)
      ? Math.min(100, Math.max(0, Math.round(item.progress)))
      : (item?.status === 'completed' ? 100 : item?.status === 'in_progress' ? 10 : 0);

  const handleProgressChange = (newVal) => {
    if (!item) return;
    const clamped = Math.min(100, Math.max(0, Math.round(Number(newVal))));
    const isCompleted = clamped === 100;
    const newStatus = isCompleted ? 'completed' : 'in_progress';
    const newLabel = isCompleted
      ? 'Finished'
      : (clamped === 0 ? 'Just started (0%)' : `${clamped}%`);

    const updatedItem = {
      ...item,
      progress: clamped,
      status: newStatus,
      progressLabel: newLabel,
    };

    if (onUpdateItem) {
      onUpdateItem(updatedItem);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isEditing && !showDeleteConfirm) {
            onClose();
          }
        }}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Image Banner */}
        <div className="relative h-52 sm:h-60 w-full bg-zinc-900 overflow-hidden">
          {item.coverImage ? (
            <img
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
              <TypeIcon type={item.type} className="w-16 h-16" />
            </div>
          )}

          {/* Dark gradient shadow */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

          {/* Close button */}
          <button
            id="close-detail-modal-btn"
            type="button"
            onClick={() => {
              setIsEditing(false);
              setShowDeleteConfirm(false);
              onClose();
            }}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on image */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TypeBadge type={item.type} size="sm" />
              <PriorityBadge priority={item.priority} size="sm" />
            </div>

            {item.rating && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{item.rating} / 5</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-15rem)] overflow-y-auto">
          {/* Delete Confirmation Alert Banner */}
          {showDeleteConfirm && (
            <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Delete item from backlog?</span>
              </div>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                Are you sure you want to remove &ldquo;{item.title}&rdquo;? This will immediately remove it from your queue.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  id="cancel-delete-btn"
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-btn"
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-md shadow-rose-950/40 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* EDIT MODE FORM */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Edit Item Details</span>
                </div>
                <span className="text-[11px] text-zinc-500">Press Esc to cancel</span>
              </div>

              {validationError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                  {validationError}
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="edit-item-title-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="edit-item-title-input"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Item title..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                />
              </div>

              {/* Creator & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-item-creator-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Creator / Author <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="edit-item-creator-input"
                    type="text"
                    required
                    value={editCreator}
                    onChange={(e) => setEditCreator(e.target.value)}
                    placeholder="Author, director, or creator..."
                    className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="edit-item-duration-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Duration / Length
                  </label>
                  <input
                    id="edit-item-duration-input"
                    type="text"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g. 166 min, 616 pages, 14 min read"
                    className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label htmlFor="edit-item-rating-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Rating (1 – 5)
                </label>
                <input
                  id="edit-item-rating-input"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={editRating}
                  onChange={(e) => setEditRating(e.target.value)}
                  placeholder="e.g. 4.5 (optional)"
                  className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors font-mono"
                />
              </div>

              {/* Personal Notes */}
              <div>
                <label htmlFor="edit-item-notes-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Personal Notes
                </label>
                <textarea
                  id="edit-item-notes-input"
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Takeaways, why you queued this, or review notes..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors resize-none"
                />
              </div>

              {/* Edit Actions */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
                <button
                  id="cancel-edit-btn"
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  id="save-edit-btn"
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Save}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <>
              {/* Header Title */}
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                  <span className="font-medium text-zinc-300">{item.creator}</span>
                  <span>•</span>
                  <span>{item.platform || 'General'}</span>
                  {item.releaseYear && (
                    <>
                      <span>•</span>
                      <span>{item.releaseYear}</span>
                    </>
                  )}
                </div>
                <h2 id="detail-modal-title" className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {item.title}
                </h2>
              </div>

              {/* Status Switcher Bar */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Status Tracker
                  </span>
                  <StatusBadge status={item.status} size="xs" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'queued', label: 'Up Next', icon: Layers },
                    { id: 'in_progress', label: 'In Progress', icon: Flame },
                    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isCurrent = item.status === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onStatusChange && onStatusChange(item.id, s.id)}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20 font-semibold'
                            : 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Progress Tracking Controls */}
                {(item.status === 'in_progress' || item.status === 'completed') && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        {item.status === 'completed' ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 animate-pulse" /> In Progress
                          </span>
                        )}
                        <span className="text-zinc-500">•</span>
                        <span className="text-zinc-400 truncate">
                          {item.progressLabel || (item.status === 'completed' ? 'Finished' : `${currentProgress}%`)}
                        </span>
                      </div>
                      <span
                        id="progress-percentage-display"
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                          currentProgress === 100
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {currentProgress}%
                      </span>
                    </div>

                    {/* Range Slider */}
                    <div className="space-y-1.5">
                      <input
                        id="progress-slider-input"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={currentProgress}
                        onChange={(e) => handleProgressChange(e.target.value)}
                        className="w-full h-2 rounded-lg bg-zinc-800 accent-indigo-500 hover:accent-indigo-400 cursor-pointer transition-all"
                        aria-label="Progress percentage"
                        aria-valuenow={currentProgress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono px-0.5">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Step buttons & Presets */}
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap sm:flex-nowrap">
                      {/* Step -10% / +10% */}
                      <div className="flex items-center gap-1.5">
                        <button
                          id="progress-minus-10-btn"
                          type="button"
                          onClick={() => handleProgressChange(currentProgress - 10)}
                          disabled={currentProgress <= 0}
                          title="Decrease by 10%"
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                          <span>10%</span>
                        </button>
                        <button
                          id="progress-plus-10-btn"
                          type="button"
                          onClick={() => handleProgressChange(currentProgress + 10)}
                          disabled={currentProgress >= 100}
                          title="Increase by 10%"
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>10%</span>
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1">
                        {[25, 50, 75, 100].map((preset) => {
                          const isCurrent = currentProgress === preset;
                          return (
                            <button
                              key={preset}
                              id={`progress-preset-${preset}-btn`}
                              type="button"
                              onClick={() => handleProgressChange(preset)}
                              className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                isCurrent
                                  ? preset === 100
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                    : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold'
                                  : 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800/80'
                              }`}
                            >
                              {preset === 100 ? '100%' : `${preset}%`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata quick stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Duration / Length</span>
                  <span className="text-sm font-semibold text-zinc-200 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {item.duration}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Added Date</span>
                  <span className="text-sm font-semibold text-zinc-200 font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {item.addedDate || 'Recently'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Priority</span>
                  <span className="text-sm font-semibold text-zinc-200 capitalize">
                    {item.priority} Priority
                  </span>
                </div>
              </div>

              {/* Notes or Summary */}
              {item.notes && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Personal Notes
                  </h4>
                  <p className="text-sm text-zinc-300 bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-800/60 italic leading-relaxed">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Tags</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => {
                      const cleanTag = (tag || '').trim().replace(/^#/, '').trim().toLowerCase();
                      const cleanActive = (activeTag || '').trim().replace(/^#/, '').trim().toLowerCase();
                      const isActive = Boolean(cleanActive && cleanTag === cleanActive);
                      return (
                        <TagBadge
                          key={tag}
                          label={tag}
                          size="sm"
                          active={isActive}
                          onSelectTag={(t) => {
                            if (onSelectTag) onSelectTag(t);
                            if (onClose) onClose();
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer action buttons */}
              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                {/* Left: Delete action */}
                <button
                  id="open-delete-confirm-btn"
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                  title="Delete item from queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                {/* Right: Edit, External link, Close */}
                <div className="flex items-center gap-2">
                  <button
                    id="start-edit-btn"
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-colors cursor-pointer"
                    title="Edit item details"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit</span>
                  </button>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30 transition-all cursor-pointer"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
