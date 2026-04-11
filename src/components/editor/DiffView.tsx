/**
 * Two-level diff: line-level background + word-level highlight.
 * Unchanged lines render plain. Changed lines get a subtle bg,
 * with the specific changed words getting a stronger highlight.
 * Similar to Cursor / GitHub's diff rendering.
 */

import { useState } from 'react';

/* ── Tokenizer ───────────────────────────────────────── */

function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) || [];
}

/* ── LCS for word-level diff ─────────────────────────── */

interface WordToken {
  type: 'equal' | 'remove' | 'add';
  text: string;
}

function wordDiff(a: string, b: string): WordToken[] {
  const at = tokenize(a);
  const bt = tokenize(b);
  const m = at.length,
    n = bt.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        at[i - 1] === bt[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const inA = Array(m).fill(false);
  const inB = Array(n).fill(false);
  let i = m,
    j = n;
  while (i > 0 && j > 0) {
    if (at[i - 1] === bt[j - 1]) {
      inA[--i] = true;
      inB[--j] = true;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }

  const result: WordToken[] = [];
  let ai = 0,
    bi = 0;
  while (ai < m || bi < n) {
    if (ai < m && inA[ai] && bi < n && inB[bi]) {
      result.push({ type: 'equal', text: at[ai] });
      ai++;
      bi++;
    } else {
      while (ai < m && !inA[ai]) {
        result.push({ type: 'remove', text: at[ai] });
        ai++;
      }
      while (bi < n && !inB[bi]) {
        result.push({ type: 'add', text: bt[bi] });
        bi++;
      }
    }
  }
  return result;
}

/* ── Line-level diff ─────────────────────────────────── */

interface LineDiff {
  type: 'equal' | 'remove' | 'add' | 'modify';
  oldLine?: string;
  newLine?: string;
  words?: WordToken[];
}

function lineDiff(oldText: string, newText: string): LineDiff[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const m = oldLines.length,
    n = newLines.length;

  // LCS on lines
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);

  // Backtrack to build edit script
  const ops: LineDiff[] = [];
  let i = m,
    j = n;
  const stack: LineDiff[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: 'equal', oldLine: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', newLine: newLines[j - 1] });
      j--;
    } else {
      stack.push({ type: 'remove', oldLine: oldLines[i - 1] });
      i--;
    }
  }
  stack.reverse();

  // Pair adjacent remove+add as "modify" with word-level diff
  let k = 0;
  while (k < stack.length) {
    if (stack[k].type === 'remove' && k + 1 < stack.length && stack[k + 1].type === 'add') {
      const old = stack[k].oldLine!;
      const neu = stack[k + 1].newLine!;
      ops.push({ type: 'modify', oldLine: old, newLine: neu, words: wordDiff(old, neu) });
      k += 2;
    } else {
      ops.push(stack[k]);
      k++;
    }
  }
  return ops;
}

/* ── List diff ───────────────────────────────────────── */

export interface ListDiffItem {
  type: 'equal' | 'remove' | 'add';
  text: string;
}

export function computeListDiff(oldItems: string[], newItems: string[]): ListDiffItem[] {
  const oldSet = new Set(oldItems);
  const newSet = new Set(newItems);
  const result: ListDiffItem[] = [];
  for (const item of oldItems)
    result.push({ type: newSet.has(item) ? 'equal' : 'remove', text: item });
  for (const item of newItems) if (!oldSet.has(item)) result.push({ type: 'add', text: item });
  return result;
}

/* ── Styles ──────────────────────────────────────────── */

const DIFF_STYLES = `
@keyframes ai-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.ai-shimmer {
  background: linear-gradient(90deg, transparent 0%, var(--accent, #2563eb) 50%, transparent 100%);
  opacity: 0.07;
  animation: ai-shimmer 1.5s ease-in-out infinite;
}
.dark .ai-shimmer { opacity: 0.10; }
.diff-line-rm { background: var(--diff-rm-line); color: var(--diff-rm-text); }
.diff-line-add { background: var(--diff-add-line); color: var(--diff-add-text); }
.diff-word-rm { background: var(--diff-rm-word); color: var(--diff-rm-text) !important; text-decoration: line-through; border-radius: 2px; padding: 0 1px; }
.diff-word-add { background: var(--diff-add-word); color: var(--diff-add-text) !important; border-radius: 2px; padding: 0 1px; }
`;

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = DIFF_STYLES;
  document.head.appendChild(style);
}

/* ── Render: word tokens ─────────────────────────────── */

function WordTokens({ tokens }: { tokens: WordToken[] }) {
  return (
    <>
      {tokens.map((t, i) => {
        if (t.type === 'equal') return <span key={i}>{t.text}</span>;
        if (t.type === 'remove')
          return (
            <span key={i} className="diff-word-rm">
              {t.text}
            </span>
          );
        return (
          <span key={i} className="diff-word-add">
            {t.text}
          </span>
        );
      })}
    </>
  );
}

/* ── Collapsible unchanged lines ────────────────────── */

type DisplayItem =
  | { kind: 'line'; line: LineDiff; index: number }
  | { kind: 'collapsed'; lines: LineDiff[]; groupId: number };

function groupLines(lines: LineDiff[]): DisplayItem[] {
  const result: DisplayItem[] = [];
  let equalRun: LineDiff[] = [];
  let equalStartIndex = 0;
  let groupId = 0;

  const flushEquals = () => {
    if (equalRun.length >= 3) {
      result.push({ kind: 'collapsed', lines: equalRun, groupId: groupId++ });
    } else {
      for (let k = 0; k < equalRun.length; k++) {
        result.push({ kind: 'line', line: equalRun[k], index: equalStartIndex + k });
      }
    }
    equalRun = [];
  };

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type === 'equal') {
      if (equalRun.length === 0) equalStartIndex = i;
      equalRun.push(lines[i]);
    } else {
      flushEquals();
      result.push({ kind: 'line', line: lines[i], index: i });
    }
  }
  flushEquals();

  return result;
}

/* ── Render: inline diff (for writing tools review) ──── */

export function InlineDiffView({ oldText, newText }: { oldText: string; newText: string }) {
  ensureStyles();
  const lines = lineDiff(oldText, newText);
  const groups = groupLines(lines);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (groupId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <div className="w-full text-sm leading-relaxed text-text whitespace-pre-wrap">
      {groups.map((item, i) => {
        if (item.kind === 'collapsed') {
          if (expanded.has(item.groupId)) {
            return (
              <div key={i}>
                <div
                  className="text-xs text-text-tertiary hover:text-text-secondary cursor-pointer py-0.5 select-none"
                  onClick={() => toggle(item.groupId)}
                >
                  ··· collapse {item.lines.length} unchanged lines
                </div>
                {item.lines.map((line, j) => (
                  <div key={j}>{line.oldLine}</div>
                ))}
              </div>
            );
          }
          return (
            <div
              key={i}
              className="text-xs text-text-tertiary hover:text-text-secondary cursor-pointer py-0.5 select-none"
              onClick={() => toggle(item.groupId)}
            >
              ··· {item.lines.length} unchanged lines — click to expand
            </div>
          );
        }
        const { line } = item;
        if (line.type === 'equal') return <div key={i}>{line.oldLine}</div>;
        if (line.type === 'remove')
          return (
            <div key={i} className="diff-line-rm">
              <span className="diff-word-rm">{line.oldLine}</span>
            </div>
          );
        if (line.type === 'add')
          return (
            <div key={i} className="diff-line-add">
              <span className="diff-word-add">{line.newLine}</span>
            </div>
          );
        // modify: show word-level diff
        return (
          <div key={i} className="diff-line-add">
            <WordTokens tokens={line.words!} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Render: block diff (for AI chat tool results) ───── */

export function BlockDiffView({ oldText, newText }: { oldText: string; newText: string }) {
  ensureStyles();
  const lines = lineDiff(oldText, newText);
  const groups = groupLines(lines);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (groupId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <div className="w-full text-xs font-mono rounded-md overflow-hidden border border-border whitespace-pre-wrap">
      {groups.map((item, i) => {
        if (item.kind === 'collapsed') {
          if (expanded.has(item.groupId)) {
            return (
              <div key={i}>
                <div
                  className="px-2 py-0.5 text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary cursor-pointer select-none"
                  onClick={() => toggle(item.groupId)}
                >
                  ··· collapse {item.lines.length} unchanged lines
                </div>
                {item.lines.map((line, j) => (
                  <div key={j} className="px-2 py-0.5 text-text-secondary">
                    {line.oldLine || '\u00A0'}
                  </div>
                ))}
              </div>
            );
          }
          return (
            <div
              key={i}
              className="px-2 py-0.5 text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary cursor-pointer select-none"
              onClick={() => toggle(item.groupId)}
            >
              ··· {item.lines.length} unchanged lines — click to expand
            </div>
          );
        }
        const { line } = item;
        if (line.type === 'equal')
          return (
            <div key={i} className="px-2 py-0.5 text-text-secondary">
              {line.oldLine || '\u00A0'}
            </div>
          );
        if (line.type === 'remove')
          return (
            <div key={i} className="diff-line-rm px-2 py-0.5">
              <span className="diff-word-rm">{line.oldLine}</span>
            </div>
          );
        if (line.type === 'add')
          return (
            <div key={i} className="diff-line-add px-2 py-0.5">
              <span className="diff-word-add">{line.newLine}</span>
            </div>
          );
        // modify: removed line then added line with word highlights
        return (
          <div key={i}>
            <div className="diff-line-rm px-2 py-0.5">
              <WordTokens tokens={line.words!.filter((t) => t.type !== 'add')} />
            </div>
            <div className="diff-line-add px-2 py-0.5">
              <WordTokens tokens={line.words!.filter((t) => t.type !== 'remove')} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Render: list diff (for chip inputs) ─────────────── */

export function ListDiffView({ items }: { items: ListDiffItem[] }) {
  ensureStyles();
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span
          key={i}
          className={`text-xs px-2 py-0.5 rounded ${
            item.type === 'remove'
              ? 'diff-word-rm'
              : item.type === 'add'
                ? 'diff-word-add'
                : 'bg-bg-tertiary text-text'
          }`}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}

/* ── Re-export computeDiff for external use ──────────── */
export { wordDiff as computeDiff };
