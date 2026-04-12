import { useState } from 'react';
import { BlockDiffView } from '../../ai/DiffView';
import { TickCircle, CloseCircle } from 'iconsax-react';

export interface SectionChange {
  sectionKey: string;
  label: string;
  beforeValue: unknown;
  afterValue: unknown;
  explanation: string;
}

type ReviewStatus = 'pending' | 'accepted' | 'rejected';

interface SectionDiffReviewProps {
  changes: SectionChange[];
  onAccept: (sectionKey: string, afterValue: unknown) => void;
  onReject: (sectionKey: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

function stringify(v: unknown): string {
  if (typeof v === 'string') return v;
  return JSON.stringify(v, null, 2);
}

export function SectionDiffReview({
  changes,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
}: SectionDiffReviewProps) {
  const [statuses, setStatuses] = useState<Record<string, ReviewStatus>>(
    Object.fromEntries(changes.map((c) => [c.sectionKey, 'pending'])),
  );

  const pendingCount = Object.values(statuses).filter((s) => s === 'pending').length;
  const acceptedCount = Object.values(statuses).filter((s) => s === 'accepted').length;

  const handleAccept = (change: SectionChange) => {
    setStatuses((s) => ({ ...s, [change.sectionKey]: 'accepted' }));
    onAccept(change.sectionKey, change.afterValue);
  };

  const handleReject = (change: SectionChange) => {
    setStatuses((s) => ({ ...s, [change.sectionKey]: 'rejected' }));
    onReject(change.sectionKey);
  };

  const handleAcceptAll = () => {
    const next: Record<string, ReviewStatus> = {};
    for (const c of changes) {
      if (statuses[c.sectionKey] === 'pending') {
        next[c.sectionKey] = 'accepted';
      } else {
        next[c.sectionKey] = statuses[c.sectionKey];
      }
    }
    setStatuses(next);
    onAcceptAll();
  };

  const handleRejectAll = () => {
    const next: Record<string, ReviewStatus> = {};
    for (const c of changes) {
      if (statuses[c.sectionKey] === 'pending') {
        next[c.sectionKey] = 'rejected';
      } else {
        next[c.sectionKey] = statuses[c.sectionKey];
      }
    }
    setStatuses(next);
    onRejectAll();
  };

  return (
    <div className="space-y-3">
      {/* Bulk actions */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {pendingCount} change{pendingCount !== 1 ? 's' : ''} to review
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleRejectAll}
              className="flex items-center gap-1 text-[10px] text-text-muted hover:text-danger cursor-pointer transition-colors"
            >
              <CloseCircle size={12} variant="Bold" color="currentColor" />
              Reject all
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex items-center gap-1 text-[10px] text-accent hover:opacity-80 cursor-pointer transition-colors"
            >
              <TickCircle size={12} variant="Bold" color="currentColor" />
              Accept all
            </button>
          </div>
        </div>
      )}

      {/* Section cards */}
      {changes.map((change) => {
        const status = statuses[change.sectionKey];
        return (
          <div
            key={change.sectionKey}
            className={`border rounded-lg overflow-hidden transition-opacity ${
              status === 'rejected'
                ? 'border-border opacity-40'
                : status === 'accepted'
                  ? 'border-[var(--diff-add-word)]'
                  : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary">
              <span className="text-xs font-medium text-text">{change.label}</span>
              {status === 'accepted' && (
                <span className="text-[10px] font-medium" style={{ color: 'var(--diff-add-text)' }}>
                  Accepted
                </span>
              )}
              {status === 'rejected' && (
                <span className="text-[10px] font-medium" style={{ color: 'var(--diff-rm-text)' }}>
                  Rejected
                </span>
              )}
            </div>
            {change.explanation && (
              <div className="px-3 py-1.5 text-xs text-text-tertiary border-b border-border">
                {change.explanation}
              </div>
            )}
            <div className="p-2">
              <BlockDiffView
                oldText={stringify(change.beforeValue)}
                newText={stringify(change.afterValue)}
              />
            </div>
            {status === 'pending' && (
              <div className="flex justify-end gap-1.5 px-3 py-2 border-t border-border">
                <button
                  onClick={() => handleReject(change)}
                  className="flex items-center gap-1 text-[10px] text-text-muted hover:text-danger cursor-pointer transition-colors"
                >
                  <CloseCircle size={12} variant="Bold" color="currentColor" />
                  Reject
                </button>
                <button
                  onClick={() => handleAccept(change)}
                  className="flex items-center gap-1 text-[10px] text-accent hover:opacity-80 cursor-pointer transition-colors"
                >
                  <TickCircle size={12} variant="Bold" color="currentColor" />
                  Accept
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      {pendingCount === 0 && changes.length > 0 && (
        <div className="text-center text-xs text-text-muted py-2">
          {acceptedCount} of {changes.length} changes applied
        </div>
      )}
    </div>
  );
}
