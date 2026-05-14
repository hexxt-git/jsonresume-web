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

import { stringify } from './helpers';

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
    <div className="space-y-6">
      {/* Bulk actions */}
      {pendingCount > 0 && (
        <div className="bg-bg-secondary/30 border-border/50 flex items-center justify-between rounded-full border p-3 px-2">
          <span className="text-text-muted ml-3 text-[10px] font-bold tracking-widest uppercase">
            {pendingCount} change{pendingCount !== 1 ? 's' : ''} to review
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleRejectAll}
              className="text-text-muted hover:text-danger border-border/50 hover:bg-danger/5 flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-bold tracking-wide uppercase transition-all"
            >
              <CloseCircle size={14} variant="Bold" color="currentColor" />
              Reject all
            </button>
            <button
              onClick={handleAcceptAll}
              className="text-accent border-accent/20 bg-accent/5 flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-bold tracking-wide uppercase transition-all hover:opacity-80"
            >
              <TickCircle size={14} variant="Bold" color="currentColor" />
              Accept all
            </button>
          </div>
        </div>
      )}

      {/* Section cards */}
      <div className="space-y-4">
        {changes.map((change) => {
          const status = statuses[change.sectionKey];
          return (
            <div
              key={change.sectionKey}
              className={`overflow-hidden rounded-3xl border-2 shadow-sm transition-all ${
                status === 'rejected'
                  ? 'border-border/30 scale-98 opacity-40'
                  : status === 'accepted'
                    ? 'border-accent ring-accent/5 shadow-lg ring-4'
                    : 'bg-bg'
              }`}
            >
              <div className="bg-bg-secondary/30 border-border/50 flex items-center justify-between border-b px-6 py-4">
                <span className="text-text text-xs font-bold tracking-widest uppercase">
                  {change.label}
                </span>
                {status === 'accepted' && (
                  <span className="text-accent bg-accent/10 rounded-full px-3 py-1 text-[10px] font-black tracking-tighter uppercase">
                    ACCEPTED
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="text-danger bg-danger/10 rounded-full px-3 py-1 text-[10px] font-black tracking-tighter uppercase">
                    REJECTED
                  </span>
                )}
              </div>
              {change.explanation && (
                <div className="text-text-muted border-border/50 bg-bg border-b px-6 py-3 text-[11px] font-medium italic">
                  {change.explanation}
                </div>
              )}
              <div className="bg-bg p-4">
                <div className="border-border/50 overflow-hidden rounded-2xl border">
                  <BlockDiffView
                    oldText={stringify(change.beforeValue)}
                    newText={stringify(change.afterValue)}
                  />
                </div>
              </div>
              {status === 'pending' && (
                <div className="border-border/50 bg-bg-secondary/10 flex justify-end gap-3 border-t px-6 py-4">
                  <button
                    onClick={() => handleReject(change)}
                    className="text-text-muted hover:text-danger border-border/50 hover:bg-danger/5 flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-bold tracking-wide uppercase transition-all"
                  >
                    <CloseCircle size={14} variant="Bold" color="currentColor" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(change)}
                    className="text-accent border-accent/20 bg-accent/5 flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-bold tracking-wide uppercase transition-all hover:opacity-80"
                  >
                    <TickCircle size={14} variant="Bold" color="currentColor" />
                    Accept
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {pendingCount === 0 && changes.length > 0 && (
        <div className="text-text-muted bg-bg-secondary/20 border-border/50 rounded-full border border-dashed py-4 text-center text-[10px] font-bold tracking-widest uppercase">
          {acceptedCount} of {changes.length} changes applied
        </div>
      )}
    </div>
  );
}
