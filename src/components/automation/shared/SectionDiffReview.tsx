import { useState } from 'react';
import { BlockDiffView } from '@/components/ai/DiffView';
import { TickCircle, CloseCircle } from 'iconsax-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
            <Button
              variant="secondary"
              onClick={handleRejectAll}
              className="hover:text-danger hover:bg-danger/5 h-9 rounded-full px-4 text-[10px]"
            >
              <CloseCircle size={14} variant="Bold" color="currentColor" />
              Reject all
            </Button>
            <Button
              variant="primary"
              onClick={handleAcceptAll}
              className="h-9 rounded-full px-4 text-[10px]"
            >
              <TickCircle size={14} variant="Bold" color="currentColor" />
              Accept all
            </Button>
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
              className={`overflow-hidden rounded-3xl border-2 transition-all ${
                status === 'rejected'
                  ? 'border-border/30 scale-98 opacity-40'
                  : status === 'accepted'
                    ? 'border-accent ring-accent/5 ring-4'
                    : 'bg-bg'
              }`}
            >
              <div className="bg-bg-secondary/30 border-border/50 flex items-center justify-between border-b px-6 py-4">
                <span className="text-text text-xs font-bold tracking-widest uppercase">
                  {change.label}
                </span>
                {status === 'accepted' && (
                  <Badge variant="accent" className="px-3 py-1 font-black">
                    ACCEPTED
                  </Badge>
                )}
                {status === 'rejected' && (
                  <Badge variant="danger" className="px-3 py-1 font-black">
                    REJECTED
                  </Badge>
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
                  <Button
                    variant="secondary"
                    onClick={() => handleReject(change)}
                    className="hover:text-danger hover:bg-danger/5 h-9 rounded-full px-4 text-[10px]"
                  >
                    <CloseCircle size={14} variant="Bold" color="currentColor" />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleAccept(change)}
                    className="h-9 rounded-full px-4 text-[10px]"
                  >
                    <TickCircle size={14} variant="Bold" color="currentColor" />
                    Accept
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {pendingCount === 0 && changes.length > 0 && (
        <Badge
          variant="outline"
          className="w-full justify-center py-4 text-center lowercase first-letter:uppercase"
        >
          {acceptedCount} of {changes.length} changes applied
        </Badge>
      )}
    </div>
  );
}
