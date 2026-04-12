import { useEffect, useRef, useState, useCallback } from 'react';
import { useAiStore } from '../../store/aiStore';
import { getAtPath, setAtPath } from '../../lib/ai/resume-tools';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import type { AnyMessage, ToolResultMessage } from '../../lib/ai';
import { useT } from '../../i18n';
import { Copy, TickCircle } from 'iconsax-react';
import { BlockDiffView } from './DiffView';

/* ── Markdown renderer (marked + DOMPurify) ──────────── */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked: no mangle, GFM tables/strikethrough, breaks
marked.setOptions({ gfm: true, breaks: true });

function renderMarkdown(text: string): string {
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
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'a',
      'span',
      'div',
      'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ADD_ATTR: ['target'],
  });
}

function Markdown({ text }: { text: string }) {
  const html = renderMarkdown(text);
  return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ── Copy button ──────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 text-[10px] text-text-muted hover:text-text transition-all cursor-pointer px-1"
      title={t('ai.copy')}
    >
      {copied ? (
        <TickCircle size={16} variant="Bold" color="currentColor" />
      ) : (
        <Copy size={16} variant="Bold" color="currentColor" />
      )}
    </button>
  );
}

/* ── Tool result badge with undo ──────────────────────── */

function ToolResultBadge({ msg, hideDiffs }: { msg: ToolResultMessage; hideDiffs?: boolean }) {
  const t = useT();
  const toggleUndo = useResumeStore((s) => s.toggleToolUndo);
  const [showDiff, setShowDiff] = useState(true);

  const handleToggle = () => {
    if (!msg.path.length) return;
    const resume = activeSlot(useResumeStore.getState()).resume;

    if (msg.undone) {
      setAtPath(msg.path, msg.after);
      toggleUndo(msg.id, undefined);
    } else {
      const current = structuredClone(getAtPath(resume, msg.path));
      setAtPath(msg.path, msg.before);
      toggleUndo(msg.id, current);
    }
  };

  const hasDiff = msg.success && msg.before != null;
  const currentValue = hasDiff
    ? (() => {
        const resume = activeSlot(useResumeStore.getState()).resume;
        return getAtPath(resume, msg.path);
      })()
    : null;

  const deepSort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(deepSort);
    if (v && typeof v === 'object') {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort())
        sorted[k] = deepSort((v as Record<string, unknown>)[k]);
      return sorted;
    }
    return v;
  };
  const sortedStringify = (v: unknown) =>
    typeof v === 'string' ? v : JSON.stringify(deepSort(v), null, 2);

  const beforeStr = hasDiff ? sortedStringify(msg.before) : '';
  const afterStr = currentValue != null ? sortedStringify(currentValue) : '';

  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
            msg.success ? (msg.undone ? 'line-through' : '') : 'bg-danger/10 text-danger'
          }`}
          style={
            msg.success
              ? {
                  background: msg.undone ? 'var(--diff-rm-line)' : 'var(--diff-add-line)',
                  color: msg.undone ? 'var(--diff-rm-text)' : 'var(--diff-add-text)',
                }
              : undefined
          }
        >
          {msg.success ? (msg.undone ? '\u21A9' : '\u2713') : '\u2717'} {msg.result}
        </span>
        {msg.success && msg.path.length > 0 && (
          <button
            onClick={handleToggle}
            className="text-text-muted hover:text-accent transition-colors cursor-pointer underline"
          >
            {msg.undone ? t('ai.redo') : t('ai.undo')}
          </button>
        )}
        {!hideDiffs && hasDiff && beforeStr !== afterStr && (
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer text-[10px]"
          >
            {showDiff ? 'hide diff' : 'diff'}
          </button>
        )}
      </div>
      {showDiff && !hideDiffs && hasDiff && beforeStr !== afterStr && (
        <div className="mt-1">
          <BlockDiffView oldText={beforeStr} newText={afterStr} />
        </div>
      )}
    </div>
  );
}

/* ── Message list ─────────────────────────────────────── */

const PRESETS = [
  {
    label: 'Improve my summary',
    prompt: 'Improve my professional summary to be more compelling and concise.',
  },
  { label: 'Review my resume', prompt: 'Review my entire resume and suggest improvements.' },
  {
    label: 'Fix grammar everywhere',
    prompt: 'Fix all grammar and spelling errors across my entire resume.',
  },
  {
    label: 'Tailor for a job',
    prompt: 'I want to tailor my resume for a specific job. Ask me for the job description.',
  },
];

export function AiMessageList({
  onSend,
  hideDiffs,
}: {
  onSend?: (text: string) => void;
  hideDiffs?: boolean;
}) {
  const t = useT();
  const messages = useResumeStore((s) => activeSlot(s).chatHistory);
  const error = useAiStore((s) => s.error);
  const setError = useAiStore((s) => s.setError);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const name = useResumeStore((s) => activeSlot(s).resume.basics?.name);

  if (messages.length === 0 && !error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <div className="text-center max-w-xs">
          <p className="text-sm font-medium text-text">
            {name ? `Let's work on ${name}'s resume` : `Let's work on your resume`}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Ask me to rewrite, translate, review, or tailor your resume for a specific role.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-xs">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onSend?.(p.prompt)}
              className="text-[11px] px-3 py-1.5 border border-border rounded-lg text-text-secondary hover:bg-bg-hover hover:text-text cursor-pointer transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 space-y-3">
      {messages.map((m) => (
        <MessageRow key={m.id} message={m} hideDiffs={hideDiffs} />
      ))}
      {error && (
        <div className="flex justify-start">
          <div
            className="max-w-[85%] rounded-lg px-3 py-2 text-xs bg-danger/10 text-danger cursor-pointer"
            onClick={() => setError(null)}
            title={t('ai.clickDismiss')}
          >
            {error}
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

function MessageRow({ message: m, hideDiffs }: { message: AnyMessage; hideDiffs?: boolean }) {
  if (m.role === 'tool_result') {
    return (
      <div className="flex justify-start pl-2">
        <ToolResultBadge msg={m} hideDiffs={hideDiffs} />
      </div>
    );
  }

  const isUser = m.role === 'user';
  const hasContent = !!m.content;
  // Show spinner only for assistant messages that have no content AND no tool calls yet
  const showSpinner = !hasContent && m.role === 'assistant' && !m.toolCalls?.length;

  // Don't render empty assistant messages that only have tool calls (tool results show below)
  if (!hasContent && m.role === 'assistant' && m.toolCalls?.length) return null;

  const timestamp = new Date(m.timestamp).toLocaleTimeString();

  return (
    <>
      {isUser ? (
        <div className="text-xs text-text-muted text-right mb-px!">
          user <span className="text-[0.6rem]">{timestamp}</span>
        </div>
      ) : (
        <div className="text-xs text-text-muted mb-px!">
          assistant <span className="text-[0.6rem]">{timestamp}</span>
        </div>
      )}
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
        {isUser && hasContent && <CopyButton text={m.content} />}
        <div
          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
            isUser ? 'bg-accent text-white' : 'bg-bg-secondary text-text'
          }`}
        >
          {hasContent ? (
            isUser ? (
              <span className="whitespace-pre-wrap">{m.content}</span>
            ) : (
              <Markdown text={m.content} />
            )
          ) : (
            showSpinner && (
              <span className="inline-block w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
            )
          )}
        </div>
        {!isUser && hasContent && <CopyButton text={m.content} />}
      </div>
    </>
  );
}
