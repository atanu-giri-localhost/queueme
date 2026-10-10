import { Flame, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { TypeBadge, PriorityBadge } from '../common/Badge';
import TypeIcon from '../common/TypeIcon';

export default function InProgressShelf({
  items,
  onSelectItem,
  onStatusChange,
}) {
  const inProgressItems = items.filter((item) => item.status === 'in_progress');

  if (inProgressItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Continue Consuming
            </h3>
            <p className="text-xs text-zinc-400">
              Pick up where you left off across your active queue
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {inProgressItems.length} active
        </span>
      </div>

      {/* Grid of In-Progress items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inProgressItems.map((item) => (
          <div
            key={item.id}
            id={`in-progress-${item.id}`}
            onClick={() => onSelectItem(item)}
            className="group relative flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 hover:border-amber-500/40 transition-all duration-200 cursor-pointer overflow-hidden shadow-lg shadow-black/20"
          >
            {/* Top row: Type and Priority */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <TypeBadge type={item.type} size="xs" />
                <PriorityBadge priority={item.priority} size="xs" />
              </div>

              {/* Title & Creator */}
              <div className="flex gap-3 mb-3">
                <div className="w-14 h-18 rounded-xl overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700/60 relative">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                      <TypeIcon type={item.type} className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 truncate">{item.creator}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{item.platform}</p>
                </div>
              </div>
            </div>

            {/* Bottom Progress Bar & Actions */}
            <div className="pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                <span className="font-mono text-[11px] text-zinc-300 font-medium">
                  {item.progressLabel || `${item.progress}%`}
                </span>
                <span className="text-[11px] text-amber-400 font-medium">{item.duration}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(item.progress || 0, 5)}%` }}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStatusChange) onStatusChange(item.id, 'completed');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  title="Mark as completed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Done</span>
                </button>

                <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Resume</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
