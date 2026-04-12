import { BlockDiffView } from '../../ai/DiffView';
import { TickCircle, CloseCircle } from 'iconsax-react';
import type { AuditIssue, FixProposal } from './types';

const stringify = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v, null, 2));

interface Props {
  issue: AuditIssue;
  fix: FixProposal | undefined;
  isFixed: boolean;
  isExpanded: boolean;
  isFixing: boolean;
  isRunning: boolean;
  onToggleExpand: () => void;
  onFix: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export function AuditIssueRow({
  issue,
  fix,
  isFixed,
  isExpanded,
  isFixing,
  isRunning,
  onToggleExpand,
  onFix,
  onAccept,
  onReject,
}: Props) {
  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onToggleExpand}>
        <span
          className="shrink-0 w-1.5 h-1.5 rounded-full"
          style={{
            background:
              issue.severity === 'high'
                ? 'var(--diff-rm-text)'
                : issue.severity === 'medium'
                  ? 'var(--accent)'
                  : 'var(--text-muted)',
          }}
        />
        <span
          className={`flex-1 text-xs ${isFixed ? 'text-text-muted line-through' : 'text-text-secondary'}`}
        >
          {issue.description}
        </span>
        {!isFixed && !fix && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="text-[10px] px-2 py-0.5 rounded bg-bg-tertiary text-text-muted hover:text-text-secondary cursor-pointer"
            >
              {isExpanded ? 'Hide' : 'Details'}
            </button>
            {issue.fixable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFix();
                }}
                disabled={isRunning}
                className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer disabled:opacity-50"
              >
                {isFixing ? '...' : 'Fix'}
              </button>
            )}
          </div>
        )}
        {isFixed && (
          <span className="shrink-0 text-[10px]" style={{ color: 'var(--diff-add-text)' }}>
            Fixed
          </span>
        )}
      </div>

      {isExpanded && !fix && !isFixed && (
        <p className="text-[10px] text-text-muted mt-1 ml-3.5">{issue.suggestion}</p>
      )}

      {fix && (
        <div className="mt-2 space-y-1.5">
          <BlockDiffView oldText={stringify(fix.beforeValue)} newText={stringify(fix.afterValue)} />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={onReject}
              className="flex items-center gap-1 text-[10px] text-text-muted hover:text-danger cursor-pointer"
            >
              <CloseCircle size={12} variant="Bold" color="currentColor" /> Reject
            </button>
            <button
              onClick={onAccept}
              className="flex items-center gap-1 text-[10px] text-accent hover:opacity-80 cursor-pointer"
            >
              <TickCircle size={12} variant="Bold" color="currentColor" /> Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
