import { useEffect, useRef, useState } from 'react';
import { useAiStore } from '../../store/aiStore';
import { getAtPath, setAtPath } from '../../lib/ai/resume-tools';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { Markdown } from '../Markdown';
import { BlockDiffView } from './DiffView';
import type { AnyMessage, ToolResultMessage } from '../../lib/ai';

/* ── Badge for tool results ─────────────────────────── */

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
    <div className="w-full space-y-2">
      <div className="flex items-center gap-3 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-tight ${
            msg.success
              ? msg.undone
                ? 'line-through opacity-60'
                : ''
              : 'bg-danger/10 text-danger border-danger/20'
          }`}
          style={
            msg.success
              ? {
                  background: msg.undone ? 'var(--diff-rm-line)' : 'var(--diff-add-line)',
                  color: msg.undone ? 'var(--diff-rm-text)' : 'var(--diff-add-text)',
                  borderColor: msg.undone ? 'var(--diff-rm-word)' : 'var(--diff-add-word)',
                }
              : undefined
          }
        >
          {msg.success ? (msg.undone ? '\u21A9' : '\u2713') : '\u2717'} {msg.result.toUpperCase()}
        </span>
        {msg.success && msg.path.length > 0 && (
          <button
            onClick={handleToggle}
            className="text-text-muted hover:text-accent cursor-pointer text-[10px] font-bold tracking-wide underline transition-all"
          >
            {(msg.undone ? t('ai.redo') : t('ai.undo')).toUpperCase()}
          </button>
        )}
        {!hideDiffs && hasDiff && beforeStr !== afterStr && (
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="text-text-muted hover:text-text-secondary cursor-pointer text-[10px] font-bold tracking-wide transition-all"
          >
            {(showDiff ? 'hide diff' : 'diff').toUpperCase()}
          </button>
        )}
      </div>
      {showDiff && !hideDiffs && hasDiff && beforeStr !== afterStr && (
        <div className="mt-2 overflow-hidden rounded-2xl shadow-sm">
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
      <div className="bg-bg flex flex-1 flex-col items-center justify-center gap-10 px-8">
        <div className="max-w-sm space-y-4 text-center">
          <div className="bg-accent/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl">
            <span className="text-accent text-2xl">&#10024;</span>
          </div>
          <p className="text-text text-lg font-bold tracking-tight">
            {name ? `Let's work on ${name}'s resume` : `Let's work on your resume`}
          </p>
          <p className="text-text-tertiary px-4 text-sm leading-relaxed font-medium">
            Ask me to rewrite, translate, review, or tailor your resume for a specific role.
          </p>
        </div>
        <div className="flex max-w-lg flex-wrap justify-center gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onSend?.(p.prompt)}
              className="text-text-secondary hover:bg-bg-secondary hover:text-accent cursor-pointer rounded-full border px-5 py-2.5 text-xs font-bold shadow-sm transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
      {messages.map((m) => (
        <MessageRow key={m.id} message={m} hideDiffs={hideDiffs} />
      ))}
      {error && (
        <div className="flex justify-start">
          <div
            className="bg-danger/10 text-danger border-danger/20 max-w-[90%] cursor-pointer rounded-2xl border px-4 py-3 text-xs font-medium"
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
      <div className="flex justify-start py-1 pl-4">
        <ToolResultBadge msg={m} hideDiffs={hideDiffs} />
      </div>
    );
  }

  const isUser = m.role === 'user';
  const hasContent = !!m.content;
  const showSpinner = !hasContent && m.role === 'assistant' && !m.toolCalls?.length;

  if (!hasContent && m.role === 'assistant' && m.toolCalls?.length) return null;

  const timestamp = new Date(m.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-1.5">
      <div
        className={`text-text-muted flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase ${isUser ? 'flex-row-reverse' : ''}`}
      >
        {isUser ? 'USER' : 'ASSISTANT'}
        <span className="font-normal opacity-50">{timestamp}</span>
      </div>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group items-end gap-2`}>
        {isUser && hasContent && (
          <div className="pb-1">
            <CopyButton text={m.content} />
          </div>
        )}
        <div
          className={`max-w-[85%] px-5 py-3 text-sm shadow-sm transition-all ${
            isUser
              ? 'bg-accent rounded-3xl rounded-br-lg font-medium text-white'
              : 'bg-bg-secondary text-text border-border/50 rounded-3xl rounded-bl-lg border'
          }`}
        >
          {hasContent ? (
            isUser ? (
              <span className="leading-relaxed whitespace-pre-wrap">{m.content}</span>
            ) : (
              <Markdown text={m.content} />
            )
          ) : (
            showSpinner && (
              <div className="py-1">
                <span className="border-accent inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            )
          )}
        </div>
        {!isUser && hasContent && (
          <div className="pb-1">
            <CopyButton text={m.content} />
          </div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-text-muted hover:text-text-secondary cursor-pointer p-1 opacity-0 transition-colors group-hover:opacity-100"
      title="Copy message"
    >
      {copied ? (
        '✓'
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}
    </button>
  );
}
