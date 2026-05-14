import { useState, useCallback } from 'react';
import { Copy, TickCircle } from 'iconsax-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: true });

function renderMd(text: string): string {
  const raw = marked.parse(text, { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'del',
      'code',
      'pre',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'a',
      'span',
      'div',
      'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

interface CopyableOutputProps {
  content: string;
  label?: string;
  format?: 'markdown' | 'plain';
}

export function CopyableOutput({ content, label, format = 'markdown' }: CopyableOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [content]);

  return (
    <div className="overflow-hidden rounded-lg border">
      {label && (
        <div className="bg-bg-secondary border-border flex items-center justify-between border-b px-3 py-1.5">
          <span className="text-text-muted text-[10px] font-medium tracking-wide uppercase">
            {label}
          </span>
          <button
            onClick={handleCopy}
            className="text-text-muted hover:text-text-secondary flex cursor-pointer items-center gap-1 text-[10px] transition-colors"
          >
            {copied ? (
              <>
                <TickCircle size={12} variant="Bold" color="currentColor" /> Copied
              </>
            ) : (
              <>
                <Copy size={12} variant="Bold" color="currentColor" /> Copy
              </>
            )}
          </button>
        </div>
      )}
      <div className="px-3 py-2.5">
        {format === 'markdown' ? (
          <div
            className="markdown-content text-text text-sm"
            dangerouslySetInnerHTML={{ __html: renderMd(content) }}
          />
        ) : (
          <pre className="text-text text-sm whitespace-pre-wrap">{content}</pre>
        )}
      </div>
      {!label && (
        <div className="flex justify-end border-t px-3 py-1.5">
          <button
            onClick={handleCopy}
            className="text-text-muted hover:text-text-secondary flex cursor-pointer items-center gap-1 text-[10px] transition-colors"
          >
            {copied ? (
              <>
                <TickCircle size={12} variant="Bold" color="currentColor" /> Copied
              </>
            ) : (
              <>
                <Copy size={12} variant="Bold" color="currentColor" /> Copy
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
