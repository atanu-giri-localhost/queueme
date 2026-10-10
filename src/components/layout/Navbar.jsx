import { useEffect } from 'react';
import {
  Menu,
  Plus,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import Button from '../common/Button';

export default function Navbar({
  onOpenMobileNav,
  onOpenAddItem,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  currentView,
  counts,
}) {
  // Support "/" key to quickly focus the search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        const searchInput = document.getElementById('navbar-search-input') || document.getElementById('main-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu + View Title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-nav-toggle-btn"
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          title="Open Navigation"
          aria-label="Open Navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
            Q
          </div>
          <span className="font-bold text-base text-white tracking-tight">QueueMe</span>
        </div>

        {/* Desktop View Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-zinc-500 font-medium">Workspace</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-200 font-semibold capitalize">
            {currentView === 'dashboard' ? 'Personal Dashboard' : 'Queue Backlog'}
          </span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono">
            {counts.total} items
          </span>
        </div>
      </div>

      {/* Middle: Quick Search Input (Desktop) */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="navbar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, authors, or #tags..."
            aria-label="Search titles, authors, or tags"
            className="w-full pl-9 pr-12 py-1.5 bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 text-zinc-200 placeholder-zinc-400 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700/60 rounded select-none pointer-events-none" title="Press / to focus search">
            /
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Layout toggle (Grid vs List) */}
        <div className="hidden sm:flex items-center bg-zinc-900/90 rounded-xl p-1 border border-zinc-800">
          <button
            id="viewmode-grid-btn"
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid View"
            aria-label="Switch to Grid View"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            id="viewmode-list-btn"
            type="button"
            onClick={() => setViewMode('list')}
            title="List View"
            aria-label="Switch to List View"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Add Item CTA Button */}
        <Button
          id="open-add-item-modal-btn"
          variant="primary"
          size="sm"
          onClick={onOpenAddItem}
          icon={Plus}
        >
          <span className="hidden sm:inline">Add to Queue</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
}
