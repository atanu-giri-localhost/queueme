import { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  ArrowRight,
  FilterX,
  AlertTriangle,
  RotateCcw,
  Inbox,
} from 'lucide-react';

import { useQueueStorage } from './hooks/useQueueStorage';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import MobileNav from './components/layout/MobileNav';
import StatsCards from './components/dashboard/StatsCards';
import InProgressShelf from './components/dashboard/InProgressShelf';
import CategoryBreakdown from './components/dashboard/CategoryBreakdown';
import FilterBar from './components/filters/FilterBar';
import ItemCard from './components/items/ItemCard';
import ItemListItem from './components/items/ItemListItem';
import ItemDetailModal from './components/items/ItemDetailModal';
import AddItemModal from './components/items/AddItemModal';
import ResetConfirmationModal from './components/common/ResetConfirmationModal';
import Button from './components/common/Button';

export default function App() {
  const {
    items,
    setItems,
    isCorrupted,
    resetToSampleData,
  } = useQueueStorage();

  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'queue'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Dynamic counts for sidebar and stats
  const counts = useMemo(() => {
    return {
      total: items.length,
      queued: items.filter((i) => i.status === 'queued').length,
      in_progress: items.filter((i) => i.status === 'in_progress').length,
      completed: items.filter((i) => i.status === 'completed').length,
      movie: items.filter((i) => i.type === 'movie').length,
      video: items.filter((i) => i.type === 'video').length,
      article: items.filter((i) => i.type === 'article').length,
      book: items.filter((i) => i.type === 'book').length,
      course: items.filter((i) => i.type === 'course').length,
    };
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search & tag query filter (handles # prefix, case, and whitespace consistently)
        if (searchQuery.trim()) {
          const rawQ = searchQuery.toLowerCase().trim();
          const isTagSearch = rawQ.startsWith('#');
          const cleanQ = isTagSearch ? rawQ.slice(1).trim() : rawQ;

          if (isTagSearch) {
            // Specifically match tags when query starts with #
            if (!cleanQ) {
              if (!item.tags || item.tags.length === 0) return false;
            } else {
              const matchTag = (item.tags || []).some((t) => {
                const normalizedTag = (t || '').toLowerCase().trim().replace(/^#/, '').trim();
                if (normalizedTag === cleanQ || normalizedTag.includes(cleanQ)) return true;
                const words = normalizedTag.split(/[\s-_/]+/);
                return normalizedTag.startsWith(cleanQ) || words.some((w) => w.startsWith(cleanQ));
              });
              if (!matchTag) {
                return false;
              }
            }
          } else {
            // General query: match title, creator, platform, or tags
            const matchTitle = (item.title || '').toLowerCase().includes(cleanQ);
            const matchCreator = (item.creator || '').toLowerCase().includes(cleanQ);
            const matchPlatform = (item.platform || '').toLowerCase().includes(cleanQ);
            const matchTags = (item.tags || []).some((t) => {
              const normalizedTag = (t || '').toLowerCase().trim().replace(/^#/, '').trim();
              return normalizedTag.includes(cleanQ);
            });
            if (!matchTitle && !matchCreator && !matchPlatform && !matchTags) {
              return false;
            }
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && item.type !== selectedCategory) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'priority') {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        }
        if (sortBy === 'progress') {
          return (b.progress || 0) - (a.progress || 0);
        }
        // default: recent (by addedDate desc) with deterministic tie-breaking
        const dateDiff = (b.addedDate || '').localeCompare(a.addedDate || '');
        if (dateDiff !== 0) return dateDiff;
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [items, searchQuery, selectedCategory, statusFilter, priorityFilter, sortBy]);

  // Pure helper to synchronize status, progress and progressLabel
  const getUpdatedStatusItem = (item, newStatus) => {
    let updatedProgress = item.progress;
    let updatedLabel = item.progressLabel;

    if (newStatus === 'completed') {
      updatedProgress = 100;
      updatedLabel = 'Finished';
    } else if (newStatus === 'queued') {
      updatedProgress = 0;
      updatedLabel = 'Not started';
    } else if (newStatus === 'in_progress') {
      if (updatedProgress === 0 || updatedProgress === 100 || typeof updatedProgress !== 'number') {
        updatedProgress = 25;
      }
      updatedLabel = `In progress (${updatedProgress}%)`;
    }

    return {
      ...item,
      status: newStatus,
      progress: updatedProgress,
      progressLabel: updatedLabel,
    };
  };

  // Handlers
  const handleAddItem = (newItem) => {
    setItems((prev) => [newItem, ...prev]);
  };

  const handleStatusChange = (itemId, newStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? getUpdatedStatusItem(item, newStatus) : item))
    );
    setSelectedItem((prev) => (prev && prev.id === itemId ? getUpdatedStatusItem(prev, newStatus) : prev));
  };

  const handleUpdateItem = (updatedItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setSelectedItem((prev) => (prev && prev.id === updatedItem.id ? updatedItem : prev));
  };

  const handleDeleteItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedItem(null);
  };

  const handleStatSelect = (statusTarget) => {
    setCurrentView('queue');
    setStatusFilter(statusTarget);
    setSelectedCategory('all');
    setPriorityFilter('all');
  };

  const handleCategorySelect = (categoryId) => {
    setCurrentView('queue');
    setSelectedCategory(categoryId);
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const handleSelectTag = (tag) => {
    if (!tag) return;
    const cleanTag = tag.trim().replace(/^#/, '').trim();
    if (!cleanTag) return;
    const currentCleanQuery = searchQuery.trim().replace(/^#/, '').trim().toLowerCase();
    if (searchQuery.trim().startsWith('#') && currentCleanQuery === cleanTag.toLowerCase()) {
      setSearchQuery('');
    } else {
      setSearchQuery(`#${cleanTag}`);
    }
    setCurrentView('queue');
    setSelectedCategory('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSelectedItem(null);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Collapsible Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        counts={counts}
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        counts={counts}
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-radial from-zinc-900/30 to-zinc-950">
        {/* Top Navbar */}
        <Navbar
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onOpenAddItem={() => setIsAddModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={(query) => {
            setSearchQuery(query);
            if (query.trim() && currentView !== 'queue') {
              setCurrentView('queue');
            }
          }}
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentView={currentView}
          counts={counts}
        />

        {/* Malformed Data Safe Warning Banner */}
        {isCorrupted && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-200">
                  Unparseable LocalStorage data detected in 'queueme_items_v1'
                </p>
                <p className="text-xs text-amber-300/80">
                  Showing temporary sample data in memory. Your stored data has been kept intact without overwriting.
                </p>
              </div>
            </div>
            <Button
              id="storage-banner-reset-btn"
              variant="secondary"
              size="xs"
              onClick={() => setIsResetModalOpen(true)}
              icon={RotateCcw}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40 shrink-0"
            >
              Reset to Sample Data
            </Button>
          </div>
        )}

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* DASHBOARD VIEW */}
          {currentView === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Productivity Welcome Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/70 via-zinc-900/90 to-zinc-900/80 border border-indigo-500/20 p-6 sm:p-8 backdrop-blur-md shadow-xl">
                {/* Background glow decoration */}
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-1/3 -top-10 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Backlog & Reading Hub</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Ready to dive in, Alex?
                    </h1>
                    <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                      You have <span className="text-indigo-400 font-semibold">{counts.in_progress} items in progress</span> and{' '}
                      <span className="text-zinc-200 font-semibold">{counts.queued} pending items</span> in your personal queue.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      id="dashboard-explore-queue-btn"
                      variant="secondary"
                      size="md"
                      onClick={() => setCurrentView('queue')}
                      iconRight={ArrowRight}
                    >
                      Explore Queue
                    </Button>
                    <Button
                      id="dashboard-add-item-btn"
                      variant="primary"
                      size="md"
                      onClick={() => setIsAddModalOpen(true)}
                      icon={Plus}
                    >
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <StatsCards
                counts={counts}
                onSelectStatus={handleStatSelect}
                activeStatus={statusFilter}
              />

              {/* Continue Consuming Shelf (In-Progress Items) */}
              <InProgressShelf
                items={items}
                onSelectItem={(item) => setSelectedItem(item)}
                onStatusChange={handleStatusChange}
              />

              {/* Category Breakdown */}
              <CategoryBreakdown
                counts={counts}
                onSelectCategory={handleCategorySelect}
                selectedCategory={selectedCategory}
              />

              {/* Recently Added Shelf */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Recently Added to Backlog
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Latest movies, articles, and reading material queued up
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('queue');
                      setStatusFilter('all');
                      setSelectedCategory('all');
                      setPriorityFilter('all');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span>View all ({counts.total})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.slice(0, 4).map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onSelect={(item) => setSelectedItem(item)}
                      onStatusChange={handleStatusChange}
                      onSelectTag={handleSelectTag}
                      activeTag={searchQuery}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FULL QUEUE BACKLOG VIEW */}
          {currentView === 'queue' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header Title & Breadcrumb */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Queue Backlog</span>
                    {selectedCategory !== 'all' && (
                      <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                        {selectedCategory}
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Search, filter, and organize your watchlist and reading backlog
                  </p>
                </div>

                <Button
                  id="queue-add-btn"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  icon={Plus}
                >
                  Add Item
                </Button>
              </div>

              {/* Filter & Search Bar */}
              <FilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
                totalFiltered={filteredItems.length}
                totalItems={items.length}
              />

              {/* Items Display: Grid or List */}
              {filteredItems.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onSelect={(item) => setSelectedItem(item)}
                        onStatusChange={handleStatusChange}
                        onSelectTag={handleSelectTag}
                        activeTag={searchQuery}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredItems.map((item) => (
                      <ItemListItem
                        key={item.id}
                        item={item}
                        onSelect={(item) => setSelectedItem(item)}
                        onStatusChange={handleStatusChange}
                        onSelectTag={handleSelectTag}
                        activeTag={searchQuery}
                      />
                    ))}
                  </div>
                )
              ) : (
                /* Empty State */
                <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto border border-zinc-700/60">
                    <FilterX className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">No items match your criteria</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                      Try resetting your search query or filters, or add a new item directly to your queue.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddModalOpen(true)}
                      icon={Plus}
                    >
                      Add New Item
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Item Details Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onStatusChange={handleStatusChange}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onSelectTag={handleSelectTag}
        activeTag={searchQuery}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
      />

      {/* Reset to Sample Data Confirmation Modal */}
      <ResetConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={resetToSampleData}
        isCorrupted={isCorrupted}
      />
    </div>
  );
}