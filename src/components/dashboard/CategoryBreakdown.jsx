import TypeIcon from '../common/TypeIcon';

export default function CategoryBreakdown({
  counts,
  onSelectCategory,
  selectedCategory,
}) {
  const mediaTypes = ['movie', 'video', 'article', 'book', 'course'];
  const total = counts.total || 1;

  const typeConfig = {
    movie: { label: 'Movies & TV', color: 'bg-rose-500', barColor: 'from-rose-500 to-rose-600', text: 'text-rose-400' },
    video: { label: 'Videos', color: 'bg-red-500', barColor: 'from-red-500 to-red-600', text: 'text-red-400' },
    article: { label: 'Articles', color: 'bg-emerald-500', barColor: 'from-emerald-500 to-emerald-600', text: 'text-emerald-400' },
    book: { label: 'Books', color: 'bg-sky-500', barColor: 'from-sky-500 to-sky-600', text: 'text-sky-400' },
    course: { label: 'Courses', color: 'bg-violet-500', barColor: 'from-violet-500 to-violet-600', text: 'text-violet-400' },
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Queue Distribution</h3>
          <p className="text-xs text-zinc-400">Media split across your personal backlog</p>
        </div>
        <span className="text-xs font-mono text-zinc-400">5 Categories</span>
      </div>

      {/* Multi-segmented distribution bar */}
      <div className="w-full h-3 rounded-full bg-zinc-800/90 overflow-hidden flex gap-0.5 p-0.5">
        {mediaTypes.map((type) => {
          const count = counts[type] || 0;
          const percentage = (count / total) * 100;
          if (percentage === 0) return null;
          return (
            <div
              key={type}
              style={{ width: `${percentage}%` }}
              className={`h-full rounded-sm bg-gradient-to-r ${typeConfig[type].barColor} transition-all duration-300`}
              title={`${typeConfig[type].label}: ${count} (${Math.round(percentage)}%)`}
            />
          );
        })}
      </div>

      {/* Cards for each category */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {mediaTypes.map((type) => {
          const cfg = typeConfig[type];
          const count = counts[type] || 0;
          const pct = Math.round((count / total) * 100);
          const isSelected = selectedCategory === type;

          return (
            <button
              key={type}
              id={`cat-card-${type}`}
              type="button"
              onClick={() => onSelectCategory(type)}
              className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-zinc-800/90 border-indigo-500 shadow-sm'
                  : 'bg-zinc-950/50 hover:bg-zinc-800/60 border-zinc-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/60 ${cfg.text}`}>
                  <TypeIcon type={type} className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-mono text-zinc-400">{pct}%</span>
              </div>
              <div className="text-base font-bold text-white">{count}</div>
              <div className="text-xs text-zinc-400 truncate">{cfg.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
