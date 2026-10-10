import {
  LayoutDashboard,
  Layers,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
} from 'lucide-react';
import TypeIcon from '../common/TypeIcon';

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  currentView,
  setCurrentView,
  selectedCategory,
  setSelectedCategory,
  statusFilter,
  setStatusFilter,
  counts,
  onOpenResetModal,
}) {
  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: currentView === 'dashboard',
      onClick: () => {
        setCurrentView('dashboard');
        setStatusFilter('all');
      },
    },
    {
      id: 'all',
      label: 'All Queue',
      icon: Layers,
      count: counts.total,
      active: currentView === 'queue' && statusFilter === 'all' && selectedCategory === 'all',
      onClick: () => {
        setCurrentView('queue');
        setStatusFilter('all');
        setSelectedCategory('all');
      },
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      icon: Flame,
      count: counts.in_progress,
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      active: currentView === 'queue' && statusFilter === 'in_progress' && selectedCategory === 'all',
      onClick: () => {
        setCurrentView('queue');
        setStatusFilter('in_progress');
        setSelectedCategory('all');
      },
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircle2,
      count: counts.completed,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      active: currentView === 'queue' && statusFilter === 'completed' && selectedCategory === 'all',
      onClick: () => {
        setCurrentView('queue');
        setStatusFilter('completed');
        setSelectedCategory('all');
      },
    },
  ];

  const categoryNavItems = [
    { id: 'movie', label: 'Movies & TV', type: 'movie', count: counts.movie },
    { id: 'video', label: 'Videos', type: 'video', count: counts.video },
    { id: 'article', label: 'Articles', type: 'article', count: counts.article },
    { id: 'book', label: 'Books', type: 'book', count: counts.book },
    { id: 'course', label: 'Courses', type: 'course', count: counts.course },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0 select-none relative z-20 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-800/60 justify-between">
        <div
          onClick={() => {
            setCurrentView('dashboard');
            setStatusFilter('all');
            setSelectedCategory('all');
          }}
          className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          title="QueueMe Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-1 ring-white/20 shrink-0 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-white text-lg tracking-tighter">Q</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                QueueMe
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0
                </span>
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">Watch & Read Backlog</span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Trigger */}
        <button
          id="collapse-sidebar-btn"
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-6">
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Overview
            </div>
          )}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={item.onClick}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                  item.active
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/5'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    item.active ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {typeof item.count === 'number' && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${
                          item.badgeColor || 'bg-zinc-800/90 text-zinc-400 border-zinc-700/50'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Media Categories */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Categories</span>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-[10px] lowercase text-zinc-500 hover:text-indigo-400 cursor-pointer"
                >
                  reset
                </button>
              )}
            </div>
          )}
          {categoryNavItems.map((cat) => {
            const isSelected = selectedCategory === cat.id && currentView === 'queue';
            return (
              <button
                key={cat.id}
                id={`cat-nav-${cat.id}`}
                onClick={() => {
                  setCurrentView('queue');
                  setSelectedCategory(cat.id);
                  setStatusFilter('all');
                }}
                title={isCollapsed ? cat.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <TypeIcon
                  type={cat.type}
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{cat.label}</span>
                    {typeof cat.count === 'number' && (
                      <span className="text-xs px-1.5 py-0.5 rounded text-zinc-400 bg-zinc-900 border border-zinc-800 font-mono">
                        {cat.count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-zinc-800/60 bg-zinc-950/60 space-y-2">
        <button
          id="sidebar-reset-demo-btn"
          type="button"
          onClick={onOpenResetModal}
          title={isCollapsed ? 'Reset to Sample Data' : undefined}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-amber-300 hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800/80 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-1.5' : ''
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0 text-zinc-400 group-hover:text-amber-400" />
          {!isCollapsed && <span>Reset to Sample Data</span>}
        </button>

        <div
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900/80 border border-zinc-800/40 transition-colors ${
            isCollapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-xs text-zinc-950 shrink-0 shadow">
            AC
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-zinc-200 truncate">Atanu Giri</span>
              <span className="text-[11px] text-zinc-500 truncate">Productivity Curator</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
