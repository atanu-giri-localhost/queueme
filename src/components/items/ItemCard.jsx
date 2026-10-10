import {
  Clock,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { TypeBadge, StatusBadge, PriorityBadge, TagBadge } from '../common/Badge';
import TypeIcon from '../common/TypeIcon';

export default function ItemCard({
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
      id={`item-card-${item.id}`}
      onClick={() => onSelect(item)}
      className="group flex flex-col rounded-2xl bg-zinc-900/70 hover:bg-zinc-900/95 border border-zinc-800/80 hover:border-zinc-700/80 shadow-md hover:shadow-xl hover:shadow-black/40 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Cover Image & Badges */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden border-b border-zinc-800/60">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-95"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 gap-2">
            <TypeIcon type={item.type} className="w-10 h-10" />
            <span className="text-xs uppercase font-semibold tracking-wider">No Cover</span>
          </div>
        )}

        {/* Gradient Overlay for badge contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-zinc-950/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <TypeBadge type={item.type} size="xs" />
          <PriorityBadge priority={item.priority} size="xs" />
        </div>

        {/* Rating or Duration overlay badge */}
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-zinc-800/80">
          <Clock className="w-3 h-3 text-zinc-400" />
          <span>{item.duration}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Creator & Platform */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="truncate font-medium">{item.creator}</span>
            <span className="text-zinc-400 shrink-0 text-[11px] font-mono">
              {item.platform || item.releaseYear}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-zinc-100 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
            {item.title}
          </h3>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {item.tags.slice(0, 3).map((tag) => {
                const cleanTag = (tag || '').trim().replace(/^#/, '').trim().toLowerCase();
                const cleanActive = (activeTag || '').trim().replace(/^#/, '').trim().toLowerCase();
                const isActive = Boolean(cleanActive && cleanTag === cleanActive);
                return (
                  <TagBadge
                    key={tag}
                    label={tag}
                    active={isActive}
                    onSelectTag={onSelectTag}
                  />
                );
              })}
              {item.tags.length > 3 && (
                <span className="text-[10px] text-zinc-500 px-1 py-0.5 font-mono">
                  +{item.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress bar if in-progress */}
        {item.status === 'in_progress' && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 truncate">{item.progressLabel || 'Progress'}</span>
              <span className="font-mono text-amber-400 font-semibold">{item.progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                style={{ width: `${Math.max(item.progress || 0, 5)}%` }}
              />
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
          <StatusBadge status={item.status} size="xs" />

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
                title="Open source link"
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
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
              title={`Switch status to ${nextStatusLabel}`}
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
    </div>
  );
}
