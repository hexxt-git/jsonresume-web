/**
 * Word-level diff view. Shows removed words in red, added in green.
 * Used in AI writing tools review state and AI chat tool results.
 */

/* ── Simple word-level LCS diff ──────────────────────── */

interface DiffToken {
  type: 'equal' | 'remove' | 'add';
  text: string;
}

function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) || [];
}

function lcs(a: string[], b: string[]): boolean[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const inLcs: boolean[][] = [Array(m).fill(false), Array(n).fill(false)];
  let i = m,
    j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      inLcs[0][i - 1] = true;
      inLcs[1][j - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return inLcs;
}

export function computeDiff(oldText: string, newText: string): DiffToken[] {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);
  const [oldInLcs, newInLcs] = lcs(oldTokens, newTokens);

  const result: DiffToken[] = [];
  let oi = 0,
    ni = 0;

  while (oi < oldTokens.length || ni < newTokens.length) {
    if (oi < oldTokens.length && oldInLcs[oi] && ni < newTokens.length && newInLcs[ni]) {
      result.push({ type: 'equal', text: oldTokens[oi] });
      oi++;
      ni++;
    } else {
      while (oi < oldTokens.length && !oldInLcs[oi]) {
        result.push({ type: 'remove', text: oldTokens[oi] });
        oi++;
      }
      while (ni < newTokens.length && !newInLcs[ni]) {
        result.push({ type: 'add', text: newTokens[ni] });
        ni++;
      }
    }
  }

  return result;
}

/* ── List diff (for chip inputs) ─────────────────────── */

export interface ListDiffItem {
  type: 'equal' | 'remove' | 'add';
  text: string;
}

export function computeListDiff(oldItems: string[], newItems: string[]): ListDiffItem[] {
  const oldSet = new Set(oldItems);
  const newSet = new Set(newItems);
  const result: ListDiffItem[] = [];

  for (const item of oldItems) {
    result.push({ type: newSet.has(item) ? 'equal' : 'remove', text: item });
  }
  for (const item of newItems) {
    if (!oldSet.has(item)) result.push({ type: 'add', text: item });
  }
  return result;
}

/* ── Shared style helpers ────────────────────────────── */

const removeCls = 'diff-remove';
const addCls = 'diff-add';

/* CSS injected once — uses theme-aware colors via opacity */
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

.diff-remove { background: rgba(239,68,68,0.12); color: var(--danger); text-decoration: line-through; border-radius: 2px; padding: 0 1px; }
.diff-add { background: rgba(34,197,94,0.12); color: #22c55e; border-radius: 2px; padding: 0 1px; }
.dark .diff-remove { background: rgba(248,113,113,0.12); color: #f87171; }
.dark .diff-add { background: rgba(74,222,128,0.12); color: #4ade80; }
.diff-block-old { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); color: var(--danger); }
.diff-block-new { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15); color: #22c55e; }
.dark .diff-block-old { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.15); color: #f87171; }
.dark .diff-block-new { background: rgba(74,222,128,0.08); border-color: rgba(74,222,128,0.15); color: #4ade80; }
`;

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = DIFF_STYLES;
  document.head.appendChild(style);
}

/* ── Render components ───────────────────────────────── */

export function InlineDiffView({ oldText, newText }: { oldText: string; newText: string }) {
  ensureStyles();
  const tokens = computeDiff(oldText, newText);
  return (
    <div className="text-sm leading-relaxed text-text">
      {tokens.map((t, i) => {
        if (t.type === 'equal') return <span key={i}>{t.text}</span>;
        if (t.type === 'remove')
          return (
            <span key={i} className={removeCls}>
              {t.text}
            </span>
          );
        return (
          <span key={i} className={addCls}>
            {t.text}
          </span>
        );
      })}
    </div>
  );
}

export function BlockDiffView({ oldText, newText }: { oldText: string; newText: string }) {
  ensureStyles();
  return (
    <div className="space-y-1 text-xs font-mono">
      <div className="diff-block-old rounded px-2 py-1.5 whitespace-pre-wrap line-through">
        {oldText}
      </div>
      <div className="diff-block-new rounded px-2 py-1.5 whitespace-pre-wrap">{newText}</div>
    </div>
  );
}

export function ListDiffView({ items }: { items: ListDiffItem[] }) {
  ensureStyles();
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span
          key={i}
          className={`text-xs px-2 py-0.5 rounded ${
            item.type === 'remove'
              ? removeCls
              : item.type === 'add'
                ? addCls
                : 'bg-bg-tertiary text-text'
          }`}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
