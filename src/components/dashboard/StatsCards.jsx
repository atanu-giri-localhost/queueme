import { Layers, Flame, CheckCircle2, Clock } from 'lucide-react';

export default function StatsCards({
  counts,
  onSelectStatus,
  activeStatus,
}) {
  const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

  const stats = [
    {
      id: 'total',
      statusTarget: 'all',
      title: 'Total Backlog',
      value: counts.total,
      suffix: 'items',
      label: 'Movies, articles & books',
      icon: Layers,
      accent: 'indigo',
      cardClass: 'hover:border-indigo-500/40 from-indigo-500/5 to-transparent',
      iconClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      badge: 'All Media',
    },
    {
      id: 'in_progress',
      statusTarget: 'in_progress',
      title: 'In Progress',
      value: counts.in_progress,
      suffix: 'active',
      label: 'Currently watching & reading',
      icon: Flame,
      accent: 'amber',
      cardClass: 'hover:border-amber-500/40 from-amber-500/5 to-transparent',
      iconClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: 'Active Now',
    },
    {
      id: 'completed',
      statusTarget: 'completed',
      title: 'Completed',
      value: counts.completed,
      suffix: `(${completionRate}%)`,
      label: 'Finished & archived',
      icon: CheckCircle2,
      accent: 'emerald',
      cardClass: 'hover:border-emerald-500/40 from-emerald-500/5 to-transparent',
      iconClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: `${completionRate}% Done`,
    },
    {
      id: 'time',
      statusTarget: 'queued',
      title: 'Up Next in Queue',
      value: counts.queued,
      suffix: 'queued',
      label: 'Ready for consumption',
      icon: Clock,
      accent: 'violet',
      cardClass: 'hover:border-violet-500/40 from-violet-500/5 to-transparent',
      iconClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      badge: 'Pending',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isSelected = activeStatus === stat.statusTarget;

        return (
          <div
            key={stat.id}
            id={`stat-card-${stat.id}`}
            onClick={() => onSelectStatus && onSelectStatus(stat.statusTarget)}
            className={`group relative p-5 rounded-2xl bg-gradient-to-b bg-zinc-900/60 border backdrop-blur-sm transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-zinc-900'
                : 'border-zinc-800/80 hover:bg-zinc-900/90'
            } ${stat.cardClass}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`p-2 rounded-xl border ${stat.iconClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs font-semibold text-zinc-400">{stat.suffix}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
              <span className="text-zinc-500 truncate">{stat.label}</span>
              <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {stat.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
