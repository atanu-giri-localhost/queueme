import { useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Layers,
  Flame,
  CheckCircle2,
  LogOut,
  LogIn,
} from 'lucide-react';
import TypeIcon from '../common/TypeIcon';
import logoIcon from '../../assets/queueme-icon.svg';
import useAuth from '../../hooks/useAuth';

export default function MobileNav({
  isOpen,
  onClose,
  currentView,
  setCurrentView,
  selectedCategory,
  setSelectedCategory,
  statusFilter,
  setStatusFilter,
  counts,
  onOpenAuth,
}) {
  const { user, isAuthenticated, logout } = useAuth();
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

  const handleNav = (action) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Drawer"
        className="relative w-72 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 h-full flex flex-col p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <img
              src={logoIcon}
              alt="QueueMe Logo"
              className="w-8 h-8 rounded-xl ring-1 ring-white/20 shrink-0 object-cover shadow-sm"
            />
            <div>
              <h2 className="font-bold text-sm text-white">QueueMe</h2>
              <p className="text-[11px] text-zinc-500">Backlog & Watchlist</p>
            </div>
          </div>
          <button
            id="close-mobile-nav-btn"
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Navigation */}
        <div className="flex-1 py-4 overflow-y-auto space-y-6">
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Navigation
            </div>
            <button
              onClick={() =>
                handleNav(() => {
                  setCurrentView('dashboard');
                  setStatusFilter('all');
                })
              }
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setCurrentView('queue');
                  setStatusFilter('all');
                  setSelectedCategory('all');
                })
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'queue' && statusFilter === 'all' && selectedCategory === 'all'
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4" />
                <span>All Queue</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                {counts.total}
              </span>
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setCurrentView('queue');
                  setStatusFilter('in_progress');
                  setSelectedCategory('all');
                })
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'queue' && statusFilter === 'in_progress' && selectedCategory === 'all'
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>In Progress</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                {counts.in_progress}
              </span>
            </button>

            <button
              onClick={() =>
                handleNav(() => {
                  setCurrentView('queue');
                  setStatusFilter('completed');
                  setSelectedCategory('all');
                })
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'queue' && statusFilter === 'completed' && selectedCategory === 'all'
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Completed</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {counts.completed}
              </span>
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Categories
            </div>
            {[
              { id: 'movie', label: 'Movies & TV', type: 'movie', count: counts.movie },
              { id: 'video', label: 'Videos', type: 'video', count: counts.video },
              { id: 'article', label: 'Articles', type: 'article', count: counts.article },
              { id: 'book', label: 'Books', type: 'book', count: counts.book },
              { id: 'course', label: 'Courses', type: 'course', count: counts.course },
              { id: 'audio', label: 'Audio', type: 'audio', count: counts.audio },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  handleNav(() => {
                    setCurrentView('queue');
                    setSelectedCategory(cat.id);
                    setStatusFilter('all');
                  })
                }
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === cat.id && currentView === 'queue'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TypeIcon type={cat.type} className="w-4 h-4" />
                  <span>{cat.label}</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Info */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-3">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
              <div className="flex items-center gap-3 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User avatar'}
                    className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-zinc-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-zinc-200 truncate">
                    {user.name || user.email.split('@')[0]}
                  </span>
                  <span className="text-[11px] text-zinc-500 truncate">{user.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                title="Sign out"
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth('register');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-colors cursor-pointer"
              >
                <span>Create Free Account</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth('login');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
