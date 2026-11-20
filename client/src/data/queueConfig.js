export const CATEGORIES = {
  all: {
    id: 'all',
    label: 'All Items',
    singular: 'Item',
    accentColor: 'indigo',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 font-medium',
  },
  movie: {
    id: 'movie',
    label: 'Movies & TV',
    singular: 'Movie / Show',
    accentColor: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 font-medium',
    iconName: 'Film',
  },
  video: {
    id: 'video',
    label: 'Videos',
    singular: 'Video',
    accentColor: 'red',
    badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 font-medium',
    iconName: 'PlayCircle',
  },
  article: {
    id: 'article',
    label: 'Articles',
    singular: 'Article',
    accentColor: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium',
    iconName: 'Newspaper',
  },
  book: {
    id: 'book',
    label: 'Books',
    singular: 'Book',
    accentColor: 'sky',
    badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20 font-medium',
    iconName: 'BookOpen',
  },
  course: {
    id: 'course',
    label: 'Courses',
    singular: 'Course',
    accentColor: 'violet',
    badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20 font-medium',
    iconName: 'GraduationCap',
  },
  audio: {
    id: 'audio',
    label: 'Audio',
    singular: 'Audio',
    accentColor: 'fuchsia',
    badgeClass: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20 font-medium',
    iconName: 'Headphones',
  },
};

export const STATUS_CONFIG = {
  queued: {
    id: 'queued',
    label: 'Up Next',
    badgeClass: 'bg-zinc-800 text-zinc-200 border-zinc-700/60 font-medium',
    dotClass: 'bg-zinc-400',
  },
  in_progress: {
    id: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-medium',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  completed: {
    id: 'completed',
    label: 'Completed',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium',
    dotClass: 'bg-emerald-500',
  },
};

export const PRIORITY_CONFIG = {
  high: {
    id: 'high',
    label: 'High Priority',
    shortLabel: 'High',
    colorClass: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 font-semibold',
    dotClass: 'bg-rose-500',
  },
  medium: {
    id: 'medium',
    label: 'Medium Priority',
    shortLabel: 'Medium',
    colorClass: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 font-semibold',
    dotClass: 'bg-amber-500',
  },
  low: {
    id: 'low',
    label: 'Low Priority',
    shortLabel: 'Low',
    colorClass: 'text-zinc-600 dark:text-zinc-400 bg-zinc-800/80 border-zinc-700/50 font-medium',
    dotClass: 'bg-zinc-500',
  },
};
