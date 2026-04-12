import type { AuditCategory, FixProposal } from './types';
import { scoreColor } from './types';
import { AuditIssueRow } from './AuditIssueRow';

interface Props {
  category: AuditCategory;
  fixProposals: Record<string, FixProposal>;
  fixedIds: Set<string>;
  expandedIssue: string | null;
  fixingId: string | null;
  isRunning: boolean;
  onToggleExpand: (id: string) => void;
  onFix: (issue: AuditCategory['issues'][number]) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function AuditCategoryCard({
  category,
  fixProposals,
  fixedIds,
  expandedIssue,
  fixingId,
  isRunning,
  onToggleExpand,
  onFix,
  onAccept,
  onReject,
}: Props) {
  if (!category.issues.length) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary">
        <span className="text-xs font-medium text-text">{category.label}</span>
        <span className="text-xs font-medium" style={{ color: scoreColor(category.score) }}>
          {category.score}
        </span>
      </div>
      <div className="divide-y divide-border">
        {category.issues.map((issue) => (
          <AuditIssueRow
            key={issue.id}
            issue={issue}
            fix={fixProposals[issue.id]}
            isFixed={fixedIds.has(issue.id)}
            isExpanded={expandedIssue === issue.id}
            isFixing={fixingId === issue.id}
            isRunning={isRunning}
            onToggleExpand={() => onToggleExpand(issue.id)}
            onFix={() => onFix(issue)}
            onAccept={() => onAccept(issue.id)}
            onReject={() => onReject(issue.id)}
          />
        ))}
      </div>
    </div>
  );
}
