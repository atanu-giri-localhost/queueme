import TypeIcon from './TypeIcon';
import { CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG } from '../../data/sampleData';

export function TypeBadge({ type, size = 'sm', showIcon = true }) {
  const cat = CATEGORIES[type] || { label: type, badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
  const sizeClasses = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border backdrop-blur-md transition-colors ${cat.badgeClass} ${sizeClasses}`}
    >
      {showIcon && <TypeIcon type={type} className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{cat.singular || cat.label}</span>
    </span>
  );
}

export function StatusBadge({ status, size = 'sm' }) {
  const conf = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  const sizeClasses = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors ${conf.badgeClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dotClass}`} />
      <span>{conf.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority, size = 'sm', dotOnly = false }) {
  const conf = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const sizeClasses = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2 py-0.5';

  if (dotOnly) {
    return (
      <span
        title={conf.label}
        className={`inline-flex items-center gap-1 text-xs font-medium ${conf.colorClass.split(' ')[0]}`}
      >
        <span className={`w-2 h-2 rounded-full ${conf.dotClass}`} />
        <span>{conf.shortLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors ${conf.colorClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dotClass}`} />
      <span>{conf.shortLabel}</span>
    </span>
  );
}

export function TagBadge({ label, onClick, onSelectTag, active = false, size = 'xs' }) {
  const cleanLabel = (label || '').trim().replace(/^#/, '').trim();

  const handleClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (onClick) {
      onClick(e);
    }
    if (onSelectTag) {
      onSelectTag(cleanLabel);
    }
  };

  const isClickable = Boolean(onClick || onSelectTag);
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5';

  return (
    <button
      type="button"
      onClick={isClickable ? handleClick : undefined}
      disabled={!isClickable}
      title={isClickable ? `Filter backlog by #${cleanLabel}` : undefined}
      className={`inline-flex items-center rounded-md border font-medium transition-colors select-none ${sizeClasses} ${
        active
          ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 shadow-sm'
          : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700/40'
      } ${isClickable ? 'cursor-pointer hover:border-indigo-500/40 hover:text-indigo-300' : 'cursor-default'}`}
    >
      #{cleanLabel}
    </button>
  );
}
