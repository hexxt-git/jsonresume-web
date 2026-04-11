import { useEffect, useRef, useState, useCallback } from 'react';
import { useAiStore } from '../../store/aiStore';
import { getAtPath, setAtPath } from '../../lib/ai/resume-tools';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import type { AnyMessage, ToolResultMessage } from '../../lib/ai';
import { useT } from '../../i18n';
import { Copy, TickCircle } from 'iconsax-react';
import { BlockDiffView } from './DiffView';

/* ── Lightweight Markdown renderer ────────────────────── */

function Markdown({ text }: { text: string }) {
  const html = renderMarkdown(text);
  return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderMarkdown(text: string): string {
  // Split into code blocks vs. normal text
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const inner = part.slice(3, -3);
        const newlineIdx = inner.indexOf('\n');
        const code = newlineIdx >= 0 ? inner.slice(newlineIdx + 1) : inner;
        return `<pre class="md-code-block"><code>${escHtml(code)}</code></pre>`;
      }
      return renderInline(part);
    })
    .join('');
}

function renderInline(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      // Headers
      if (/^### /.test(line)) return `<h4 class="md-h">${inlineFormat(line.slice(4))}</h4>`;
      if (/^## /.test(line)) return `<h3 class="md-h">${inlineFormat(line.slice(3))}</h3>`;
      if (/^# /.test(line)) return `<h3 class="md-h">${inlineFormat(line.slice(2))}</h3>`;
      // Bullet lists
      if (/^[-*] /.test(line)) return `<div class="md-li">${inlineFormat(line.slice(2))}</div>`;
      // Numbered lists
      if (/^\d+\. /.test(line))
        return `<div class="md-li">${inlineFormat(line.replace(/^\d+\. /, ''))}</div>`;
      // Empty line
      if (!line.trim()) return '<div class="md-br"></div>';
      return `<div>${inlineFormat(line)}</div>`;
    })
    .join('');
}

function inlineFormat(text: string): string {
  return escHtml(text)
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function ToolResultBadge({ msg }: { msg: ToolResultMessage }) {
  const t = useT();
  const toggleUndo = useResumeStore((s) => s.toggleToolUndo);
  const [showDiff, setShowDiff] = useState(false);

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

  const beforeStr = hasDiff
    ? typeof msg.before === 'string'
      ? msg.before
      : JSON.stringify(msg.before, null, 2)
    : '';
  const afterStr =
    currentValue != null
      ? typeof currentValue === 'string'
        ? currentValue
        : JSON.stringify(currentValue, null, 2)
      : '';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
            msg.success
              ? msg.undone
                ? 'bg-yellow-500/10 text-yellow-400 line-through'
                : 'bg-green-500/10 text-green-400'
              : 'bg-danger/10 text-danger'
          }`}
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
        {hasDiff && beforeStr !== afterStr && (
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer text-[10px]"
          >
            {showDiff ? 'hide diff' : 'diff'}
          </button>
        )}
      </div>
      {showDiff && hasDiff && beforeStr !== afterStr && (
        <div className="ml-2">
          <BlockDiffView oldText={beforeStr} newText={afterStr} />
        </div>
      )}
    </div>
  );
}

/* ── Message list ─────────────────────────────────────── */

export function AiMessageList() {
  const t = useT();
  const messages = useResumeStore((s) => activeSlot(s).chatHistory);
  const error = useAiStore((s) => s.error);
  const setError = useAiStore((s) => s.setError);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((m) => (
        <MessageRow key={m.id} message={m} />
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

function MessageRow({ message: m }: { message: AnyMessage }) {
  if (m.role === 'tool_result') {
    return (
      <div className="flex justify-start pl-2">
        <ToolResultBadge msg={m} />
      </div>
    );
  }

  const isUser = m.role === 'user';
  const hasContent = !!m.content;
  // Show spinner only for assistant messages that have no content AND no tool calls yet
  const showSpinner = !hasContent && m.role === 'assistant' && !m.toolCalls?.length;

  // Don't render empty assistant messages that only have tool calls (tool results show below)
  if (!hasContent && m.role === 'assistant' && m.toolCalls?.length) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
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
      {hasContent && <CopyButton text={m.content} />}
    </div>
  );
}
