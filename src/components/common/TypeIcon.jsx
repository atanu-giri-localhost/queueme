import { Film, PlayCircle, Newspaper, BookOpen, GraduationCap, Headphones, Layers } from 'lucide-react';

export default function TypeIcon({ type, className = 'w-4 h-4', ...props }) {
  switch (type) {
    case 'movie':
      return <Film className={className} {...props} />;
    case 'video':
      return <PlayCircle className={className} {...props} />;
    case 'article':
      return <Newspaper className={className} {...props} />;
    case 'book':
      return <BookOpen className={className} {...props} />;
    case 'course':
      return <GraduationCap className={className} {...props} />;
    case 'audio':
      return <Headphones className={className} {...props} />;
    default:
      return <Layers className={className} {...props} />;
  }
}
