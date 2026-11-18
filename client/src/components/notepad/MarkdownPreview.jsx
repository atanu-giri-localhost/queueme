export default function MarkdownPreview({ content }) {
  if (!content || !content.trim()) {
    return (
      <div className="text-zinc-500 italic text-sm py-8 text-center">
        No content to preview yet. Start typing in Edit mode!
      </div>
    );
  }

  // Simple, clean, safe line-by-line markdown parser
  const lines = content.split('\n');
  const renderedElements = [];
  let inCodeBlock = false;
  let codeBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        renderedElements.push(
          <pre
            key={`code-${i}`}
            className="p-3 my-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-indigo-300 overflow-x-auto"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={i} className="text-base font-bold text-white mt-4 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={i} className="text-lg font-bold text-white mt-5 mb-1.5 border-b border-zinc-800 pb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      renderedElements.push(
        <h1 key={i} className="text-xl font-extrabold text-white mt-6 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('> ')) {
      // Blockquote
      renderedElements.push(
        <blockquote
          key={i}
          className="border-l-2 border-indigo-500 pl-3 my-2 italic text-zinc-400 text-sm"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
      // Task list item
      const isChecked = line.startsWith('- [x] ') || line.startsWith('- [X] ');
      renderedElements.push(
        <div key={i} className="flex items-center gap-2 my-1 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 pointer-events-none"
          />
          <span className={isChecked ? 'line-through text-zinc-500' : ''}>
            {renderInline(line.slice(6))}
          </span>
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet list item
      renderedElements.push(
        <li key={i} className="list-disc list-inside text-sm text-zinc-300 my-0.5 ml-2">
          {renderInline(line.slice(2))}
        </li>
      );
    } else if (line.trim() === '') {
      // Empty line
      renderedElements.push(<div key={i} className="h-3" />);
    } else {
      // Regular paragraph
      renderedElements.push(
        <p key={i} className="text-sm text-zinc-300 leading-relaxed my-1">
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div className="space-y-1">{renderedElements}</div>;
}

/**
 * Parses bold (**text**), italic (*text*), inline code (`code`)
 */
function renderInline(text) {
  if (!text) return '';
  const parts = [];
  let remaining = text;
  let key = 0;

  // Regex for **bold**, *italic*, and `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/;

  while (remaining) {
    const match = remaining.match(regex);
    if (!match) {
      parts.push(remaining);
      break;
    }

    const matchIndex = match.index;
    if (matchIndex > 0) {
      parts.push(remaining.substring(0, matchIndex));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      parts.push(
        <em key={key++} className="italic text-zinc-200">
          {matchedStr.slice(1, -1)}
        </em>
      );
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300 text-xs font-mono"
        >
          {matchedStr.slice(1, -1)}
        </code>
      );
    }

    remaining = remaining.substring(matchIndex + matchedStr.length);
  }

  return parts;
}
