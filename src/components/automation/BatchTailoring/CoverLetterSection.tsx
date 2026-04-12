import { useState } from 'react';

interface Props {
  content: string;
}

export function CoverLetterSection({ content }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="px-3 py-2 border-t border-border">
      <div
        className={`text-xs text-text-secondary whitespace-pre-wrap bg-bg-secondary p-1 ${
          !expanded ? 'line-clamp-3' : ''
        }`}
      >
        {content}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-text-muted hover:text-accent cursor-pointer"
        >
          {expanded ? 'Show less' : 'View full'}
        </button>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-[10px] text-text-muted hover:text-accent cursor-pointer"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
