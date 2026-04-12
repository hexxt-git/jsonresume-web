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
    <div className="border border-border rounded-lg overflow-hidden">
      {label && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-bg-secondary border-b border-border">
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
            {label}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary cursor-pointer transition-colors"
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
            className="markdown-content text-sm text-text"
            dangerouslySetInnerHTML={{ __html: renderMd(content) }}
          />
        ) : (
          <pre className="text-sm text-text whitespace-pre-wrap">{content}</pre>
        )}
      </div>
      {!label && (
        <div className="flex justify-end px-3 py-1.5 border-t border-border">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary cursor-pointer transition-colors"
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
