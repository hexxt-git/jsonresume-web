import { useState } from 'react';

interface Props {
  content: string;
}

export function CoverLetterSection({ content }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="border-t px-3 py-2">
      <div
        className={`text-text-secondary bg-bg-secondary p-1 text-xs whitespace-pre-wrap ${
          !expanded ? 'line-clamp-3' : ''
        }`}
      >
        {content}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-accent cursor-pointer text-[10px]"
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
          className="text-text-muted hover:text-accent cursor-pointer text-[10px]"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
