import {
  Clock,
  ExternalLink,
  CheckCircle2,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { TypeBadge, StatusBadge, PriorityBadge, TagBadge } from '../common/Badge';
import TypeIcon from '../common/TypeIcon';

export default function ItemListItem({
  item,
  onSelect,
  onStatusChange,
  onSelectTag,
  activeTag,
}) {
  const getNextStatus = (current) => {
    if (current === 'queued') return 'in_progress';
    if (current === 'in_progress') return 'completed';
    return 'queued';
  };

  const nextStatus = getNextStatus(item.status);
  const nextStatusLabel =
    nextStatus === 'in_progress' ? 'Start' : nextStatus === 'completed' ? 'Finish' : 'Re-queue';

  return (
    <div
      id={`item-list-row-${item.id}`}
      onClick={() => onSelect(item)}
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-150 cursor-pointer gap-3"
    >
      {/* Left: Thumbnail + Title Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 relative">
          {item.coverImage ? (
            <img
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
              <TypeIcon type={item.type} className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Title, Creator, Tags */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <TypeBadge type={item.type} size="xs" />
            <span className="text-xs text-zinc-400 truncate">• {item.creator}</span>
          </div>

          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors truncate">
            {item.title}
          </h3>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
            <span className="font-mono">{item.platform || item.releaseYear}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-zinc-400">
              <Clock className="w-3 h-3 text-zinc-400" />
              {item.duration}
            </span>
            {item.tags && item.tags[0] && (
              <>
                <span>•</span>
                <TagBadge
                  label={item.tags[0]}
                  active={Boolean(
                    activeTag &&
                    (item.tags[0] || '').trim().replace(/^#/, '').trim().toLowerCase() ===
                    (activeTag || '').trim().replace(/^#/, '').trim().toLowerCase()
                  )}
                  onSelectTag={onSelectTag}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Status, Priority & Quick Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
        {/* Progress or Priority */}
        <div className="flex items-center gap-2">
          <PriorityBadge priority={item.priority} size="xs" />
          <StatusBadge status={item.status} size="xs" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Open external link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onStatusChange) onStatusChange(item.id, nextStatus);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
          >
            {nextStatus === 'completed' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : nextStatus === 'in_progress' ? (
              <Flame className="w-3 h-3 text-amber-400" />
            ) : (
              <RotateCcw className="w-3 h-3 text-zinc-400" />
            )}
            <span>{nextStatusLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
