export const CATEGORIES = {
  all: {
    id: 'all',
    label: 'All Items',
    singular: 'Item',
    accentColor: 'indigo',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  movie: {
    id: 'movie',
    label: 'Movies & TV',
    singular: 'Movie / Show',
    accentColor: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    iconName: 'Film',
  },
  video: {
    id: 'video',
    label: 'Videos',
    singular: 'Video',
    accentColor: 'red',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    iconName: 'PlayCircle',
  },
  article: {
    id: 'article',
    label: 'Articles',
    singular: 'Article',
    accentColor: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    iconName: 'Newspaper',
  },
  book: {
    id: 'book',
    label: 'Books',
    singular: 'Book',
    accentColor: 'sky',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    iconName: 'BookOpen',
  },
  course: {
    id: 'course',
    label: 'Courses',
    singular: 'Course',
    accentColor: 'violet',
    badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    iconName: 'GraduationCap',
  },
  audio: {
    id: 'audio',
    label: 'Audio',
    singular: 'Audio',
    accentColor: 'fuchsia',
    badgeClass: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    iconName: 'Headphones',
  },
};

export const STATUS_CONFIG = {
  queued: {
    id: 'queued',
    label: 'Up Next',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700/60',
    dotClass: 'bg-zinc-400',
  },
  in_progress: {
    id: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-400 animate-pulse',
  },
  completed: {
    id: 'completed',
    label: 'Completed',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-400',
  },
};

export const PRIORITY_CONFIG = {
  high: {
    id: 'high',
    label: 'High Priority',
    shortLabel: 'High',
    colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    dotClass: 'bg-rose-500',
  },
  medium: {
    id: 'medium',
    label: 'Medium Priority',
    shortLabel: 'Medium',
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    dotClass: 'bg-amber-500',
  },
  low: {
    id: 'low',
    label: 'Low Priority',
    shortLabel: 'Low',
    colorClass: 'text-zinc-400 bg-zinc-800/80 border-zinc-700/50',
    dotClass: 'bg-zinc-500',
  },
};
