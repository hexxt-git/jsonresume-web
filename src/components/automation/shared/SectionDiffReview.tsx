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
        <div className="flex items-center justify-between px-2 bg-bg-secondary/30 p-3 rounded-full border border-border/50">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-3">
            {pendingCount} change{pendingCount !== 1 ? 's' : ''} to review
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleRejectAll}
              className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-danger cursor-pointer transition-all px-4 py-2 rounded-full border border-border/50 hover:bg-danger/5 uppercase tracking-wide"
            >
              <CloseCircle size={14} variant="Bold" color="currentColor" />
              Reject all
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex items-center gap-1.5 text-[10px] font-bold text-accent hover:opacity-80 cursor-pointer transition-all px-4 py-2 rounded-full border border-accent/20 bg-accent/5 uppercase tracking-wide"
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
              className={`border-2 rounded-3xl overflow-hidden transition-all shadow-sm ${
                status === 'rejected'
                  ? 'border-border/30 opacity-40 scale-98'
                  : status === 'accepted'
                    ? 'border-accent shadow-lg ring-4 ring-accent/5'
                    : 'border-border bg-bg'
              }`}
            >
              <div className="flex items-center justify-between px-6 py-4 bg-bg-secondary/30 border-b border-border/50">
                <span className="text-xs font-bold text-text uppercase tracking-widest">
                  {change.label}
                </span>
                {status === 'accepted' && (
                  <span className="text-[10px] font-black text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                    ACCEPTED
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="text-[10px] font-black text-danger bg-danger/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                    REJECTED
                  </span>
                )}
              </div>
              {change.explanation && (
                <div className="px-6 py-3 text-[11px] font-medium text-text-muted italic border-b border-border/50 bg-bg">
                  {change.explanation}
                </div>
              )}
              <div className="p-4 bg-bg">
                <div className="rounded-2xl overflow-hidden border border-border/50">
                  <BlockDiffView
                    oldText={stringify(change.beforeValue)}
                    newText={stringify(change.afterValue)}
                  />
                </div>
              </div>
              {status === 'pending' && (
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/50 bg-bg-secondary/10">
                  <button
                    onClick={() => handleReject(change)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-danger cursor-pointer transition-all px-4 py-2 rounded-full border border-border/50 hover:bg-danger/5 uppercase tracking-wide"
                  >
                    <CloseCircle size={14} variant="Bold" color="currentColor" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(change)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-accent hover:opacity-80 cursor-pointer transition-all px-4 py-2 rounded-full border border-accent/20 bg-accent/5 uppercase tracking-wide"
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
        <div className="text-center text-[10px] font-bold text-text-muted py-4 uppercase tracking-widest bg-bg-secondary/20 rounded-full border border-dashed border-border/50">
          {acceptedCount} of {changes.length} changes applied
        </div>
      )}
    </div>
  );
}
