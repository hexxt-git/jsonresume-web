import { useEffect, useRef, useState } from 'react';
import { useAiStore } from '@/store/aiStore';
import { getAtPath, setAtPath } from '@/lib/ai/resume-tools';
import { useResumeStore, activeSlot } from '@/store/resumeStore';
import { useT } from '@/i18n';
import { Markdown } from '@/components/Markdown';
import { BlockDiffView } from './DiffView';
import type { AnyMessage, ToolResultMessage } from '@/lib/ai';
import { CopyIcon } from '@/assets/Icons';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
        <Badge
          variant={msg.success ? 'default' : 'danger'}
          className={cn('px-3 py-1', msg.success && msg.undone && 'line-through opacity-60')}
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
          {msg.success ? (msg.undone ? '\u21A9' : '\u2713') : '\u2717'} {msg.result}
        </Badge>
        {msg.success && msg.path.length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={handleToggle}
            className="tracking-wide underline hover:bg-transparent"
          >
            {msg.undone ? t('ai.redo') : t('ai.undo')}
          </Button>
        )}
        {!hideDiffs && hasDiff && beforeStr !== afterStr && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowDiff(!showDiff)}
            className="tracking-wide hover:bg-transparent"
          >
            {showDiff ? 'hide diff' : 'diff'}
          </Button>
        )}
      </div>
      {showDiff && !hideDiffs && hasDiff && beforeStr !== afterStr && (
        <div className="mt-2 overflow-hidden rounded-2xl">
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
          <p className="text-text text-lg font-bold tracking-tight">
            {name ? `Let's work on ${name}'s resume` : `Let's work on your resume`}
          </p>
          <p className="text-text-tertiary px-4 text-sm leading-relaxed font-medium">
            Ask me to rewrite, translate, review, or tailor your resume for a specific role.
          </p>
        </div>
        <div className="flex max-w-lg flex-wrap justify-center gap-3">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              onClick={() => onSend?.(p.prompt)}
              className="px-5 py-2.5"
            >
              {p.label}
            </Button>
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
          <Badge
            variant="danger"
            onClick={() => setError(null)}
            className="max-w-[90%] cursor-pointer rounded-2xl px-4 py-3 text-xs font-medium lowercase normal-case"
            title={t('ai.clickDismiss')}
          >
            {error}
          </Badge>
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
        className={cn(
          'text-text-muted flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase',
          isUser && 'flex-row-reverse',
        )}
      >
        {isUser ? 'USER' : 'ASSISTANT'}
        <span className="font-normal opacity-50">{timestamp}</span>
      </div>
      <div className={cn('group flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
        {isUser && hasContent && (
          <div className="pb-1">
            <CopyButton text={m.content} />
          </div>
        )}
        <div
          className={cn(
            'max-w-[85%] px-5 py-3 text-sm transition-all',
            isUser
              ? 'bg-accent rounded-3xl rounded-br-lg font-medium text-white'
              : 'bg-bg-secondary text-text border-border/50 rounded-3xl rounded-bl-lg border',
          )}
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
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
      title="Copy message"
    >
      {copied ? <span className="text-xs">✓</span> : <CopyIcon className="h-3 w-3" />}
    </Button>
  );
}
