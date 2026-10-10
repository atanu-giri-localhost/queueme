import {
  Search,
  X,
  LayoutGrid,
  List,
  RotateCcw,
} from 'lucide-react';
import TypeIcon from '../common/TypeIcon';

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  totalFiltered,
  totalItems,
}) {
  const categoriesList = [
    { id: 'all', label: 'All Items' },
    { id: 'movie', label: 'Movies & TV' },
    { id: 'video', label: 'Videos' },
    { id: 'article', label: 'Articles' },
    { id: 'book', label: 'Books' },
    { id: 'course', label: 'Courses' },
  ];

  const statusList = [
    { id: 'all', label: 'All Status' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'queued', label: 'Up Next' },
    { id: 'completed', label: 'Completed' },
  ];

  const priorityList = [
    { id: 'all', label: 'All Priorities' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortBy('recent');
  };

  return (
    <div className="space-y-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/80 backdrop-blur-sm">
      {/* Top Row: Search + Sort + View switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="main-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, creator, publication, or #tag..."
            className="w-full pl-10 pr-9 py-2 bg-zinc-950/80 hover:bg-zinc-950 focus:bg-zinc-950 text-zinc-100 placeholder-zinc-400 text-sm rounded-xl border border-zinc-800 focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls: Priority, Sort, View mode */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Priority filter */}
          <div className="relative flex items-center">
            <select
              id="priority-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-zinc-950/80 hover:bg-zinc-950 text-xs text-zinc-300 font-medium py-2 px-3 rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              {priorityList.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-200">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="relative flex items-center">
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-950/80 hover:bg-zinc-950 text-xs text-zinc-300 font-medium py-2 px-3 rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="recent" className="bg-zinc-900 text-zinc-200">
                Recently Added
              </option>
              <option value="title" className="bg-zinc-900 text-zinc-200">
                Title (A-Z)
              </option>
              <option value="priority" className="bg-zinc-900 text-zinc-200">
                Highest Priority
              </option>
              <option value="progress" className="bg-zinc-900 text-zinc-200">
                Most Progress
              </option>
            </select>
          </div>

          {/* Reset button if active */}
          {isFiltered && (
            <button
              id="reset-filters-btn"
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* View Switcher */}
          <div className="flex sm:hidden items-center bg-zinc-950/80 rounded-xl p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs ${
                viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Category Pills + Status Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-zinc-800/60">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800/80'
                }`}
              >
                {cat.id !== 'all' && (
                  <TypeIcon
                    type={cat.id}
                    className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-400'}`}
                  />
                )}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/90 self-start sm:self-auto overflow-x-auto">
          {statusList.map((status) => {
            const isSelected = statusFilter === status.id;
            return (
              <button
                key={status.id}
                id={`status-filter-${status.id}`}
                type="button"
                onClick={() => setStatusFilter(status.id)}
                className={`text-xs font-medium px-3 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter result feedback summary */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Showing <span className="font-semibold text-zinc-200">{totalFiltered}</span> of{' '}
            <span className="font-semibold text-zinc-200">{totalItems}</span> backlog items
          </span>
          {searchQuery.trim().startsWith('#') && (
            <span
              id="active-tag-filter-pill"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono pl-2 pr-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
            >
              <span>Tag: {searchQuery.trim()}</span>
              <button
                id="clear-tag-filter-btn"
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:text-white hover:bg-indigo-500/20 p-0.5 rounded-full cursor-pointer transition-colors"
                title="Clear tag filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
        {isFiltered && (
          <span className="text-[11px] text-indigo-400 font-medium">Filters active</span>
        )}
      </div>
    </div>
  );
}
