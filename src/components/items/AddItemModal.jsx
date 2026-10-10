import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Film,
  PlayCircle,
  Newspaper,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import Button from '../common/Button';

const TYPE_DEFAULTS = {
  movie: {
    placeholderDuration: '120 min',
    placeholderPlatform: 'Netflix / Theater',
    defaultCover: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  },
  video: {
    placeholderDuration: '25 min',
    placeholderPlatform: 'YouTube',
    defaultCover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  },
  article: {
    placeholderDuration: '10 min read',
    placeholderPlatform: 'Medium / Substack',
    defaultCover: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
  },
  book: {
    placeholderDuration: '320 pages',
    placeholderPlatform: 'Kindle / Print',
    defaultCover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
  },
  course: {
    placeholderDuration: '8 modules (~12h)',
    placeholderPlatform: 'Coursera / Udemy',
    defaultCover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  },
};

export default function AddItemModal({
  isOpen,
  onClose,
  onAddItem,
}) {
  const [type, setType] = useState('movie');
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [platform, setPlatform] = useState('');
  const [duration, setDuration] = useState('');
  const [url, setUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [priority, setPriority] = useState('high');
  const [status, setStatus] = useState('queued');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title.');
      return;
    }
    if (!creator.trim()) {
      setError('Please specify the creator, author, or director.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    let finalUrl = url.trim();
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    let finalCover = coverImage.trim();
    if (finalCover && !/^https?:\/\//i.test(finalCover) && !finalCover.startsWith('/')) {
      finalCover = `https://${finalCover}`;
    }

    const newItem = {
      id: `qm-${Date.now()}`,
      title: title.trim(),
      type,
      creator: creator.trim(),
      platform: platform.trim() || TYPE_DEFAULTS[type].placeholderPlatform,
      duration: duration.trim() || TYPE_DEFAULTS[type].placeholderDuration,
      url: finalUrl,
      coverImage: finalCover || TYPE_DEFAULTS[type].defaultCover,
      priority,
      status,
      progress: status === 'in_progress' ? 10 : status === 'completed' ? 100 : 0,
      progressLabel: status === 'in_progress' ? 'Just started (10%)' : status === 'completed' ? 'Finished' : 'Not started',
      tags: tags.length > 0 ? tags : ['Backlog'],
      notes: notes.trim(),
      addedDate: new Date().toISOString().split('T')[0],
      releaseYear: String(new Date().getFullYear()),
    };

    onAddItem(newItem);
    onClose();

    // Reset form
    setTitle('');
    setCreator('');
    setPlatform('');
    setDuration('');
    setUrl('');
    setCoverImage('');
    setPriority('high');
    setStatus('queued');
    setTagsInput('');
    setNotes('');
    setError('');
  };

  const mediaTypes = [
    { id: 'movie', label: 'Movie / Show', icon: Film, color: 'text-rose-400' },
    { id: 'video', label: 'Video', icon: PlayCircle, color: 'text-red-400' },
    { id: 'article', label: 'Article', icon: Newspaper, color: 'text-emerald-400' },
    { id: 'book', label: 'Book', icon: BookOpen, color: 'text-sky-400' },
    { id: 'course', label: 'Course', icon: GraduationCap, color: 'text-violet-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-modal-title"
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-modal-title" className="text-lg font-bold text-white tracking-tight">Add to Queue</h2>
              <p className="text-xs text-zinc-400">Save a new movie, video, article, book, or course</p>
            </div>
          </div>

          <button
            id="close-add-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[min(75vh,600px)] overflow-y-auto">
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Media Type Selector */}
          <div>
            <span className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Media Type
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Media Type">
              {mediaTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    id={`type-picker-${t.id}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setType(t.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : t.color}`} />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="add-item-title-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="add-item-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dune: Part Two or Designing Data-Intensive Applications"
              className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-400 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            />
          </div>

          {/* Creator & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-item-creator-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Creator / Author <span className="text-rose-400">*</span>
              </label>
              <input
                id="add-item-creator-input"
                type="text"
                required
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="e.g. Christopher Nolan, James Clear"
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-400 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="add-item-platform-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Platform / Publisher
              </label>
              <input
                id="add-item-platform-input"
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder={TYPE_DEFAULTS[type].placeholderPlatform}
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-400 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Duration & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-item-duration-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Duration / Length
              </label>
              <input
                id="add-item-duration-input"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={TYPE_DEFAULTS[type].placeholderDuration}
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-400 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="add-item-priority-select" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Priority
              </label>
              <select
                id="add-item-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 text-zinc-100 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Status & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-item-status-select" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Initial Status
              </label>
              <select
                id="add-item-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 text-zinc-100 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="queued">Up Next (Queued)</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="add-item-tags-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                id="add-item-tags-input"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Sci-Fi, Architecture, AI"
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-400 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label htmlFor="add-item-url-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              URL / Link (optional)
            </label>
            <input
              id="add-item-url-input"
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or imdb.com"
              className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-400 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="add-item-notes-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Personal Notes
            </label>
            <textarea
              id="add-item-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why you queued this, who recommended it, or key takeaways..."
              className="w-full px-3.5 py-2.5 bg-zinc-900/90 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-400 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button id="submit-add-item-btn" type="submit" variant="primary" icon={Plus}>
              Save to Queue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
