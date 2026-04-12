import type { AuditData } from './types';
import { scoreColor } from './types';

interface Props {
  audit: AuditData;
  isRunning: boolean;
  fixableRemaining: number;
  pendingFixes: number;
  onRerun: () => void;
  onFixAll: () => void;
  onAcceptAll: () => void;
}

export function AuditScoreHeader({
  audit,
  isRunning,
  fixableRemaining,
  pendingFixes,
  onRerun,
  onFixAll,
  onAcceptAll,
}: Props) {
  const totalIssues = audit.categories.reduce((n, c) => n + c.issues.length, 0);
  const highCount = audit.categories.reduce(
    (n, c) => n + c.issues.filter((i) => i.severity === 'high').length,
    0,
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: scoreColor(audit.overallScore), color: 'var(--bg)' }}
        >
          {audit.overallScore}
        </div>
        <div>
          <div className="text-xs font-medium text-text">
            {totalIssues} issue{totalIssues !== 1 ? 's' : ''} found
          </div>
          {highCount > 0 && (
            <div className="text-[10px]" style={{ color: 'var(--diff-rm-text)' }}>
              {highCount} high priority
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-1.5">
        {pendingFixes > 0 && (
          <button
            onClick={onAcceptAll}
            className="text-[10px] px-2 py-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer"
          >
            Accept ({pendingFixes})
          </button>
        )}
        {fixableRemaining > 0 && (
          <button
            onClick={onFixAll}
            disabled={isRunning}
            className="text-[10px] px-2 py-1.5 bg-accent text-white rounded-md hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? 'Fixing...' : `Fix all (${fixableRemaining})`}
          </button>
        )}
        <button
          onClick={onRerun}
          disabled={isRunning}
          className="text-[10px] px-2 py-1.5 border border-border rounded-md text-text-secondary hover:bg-bg-hover cursor-pointer disabled:opacity-50"
        >
          Re-audit
        </button>
      </div>
    </div>
  );
}
