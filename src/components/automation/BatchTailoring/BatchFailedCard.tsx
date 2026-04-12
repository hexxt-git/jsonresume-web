import type { BatchJob } from './types';

export function BatchFailedCard({ job }: { job: BatchJob }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-3 py-2.5 flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: 'var(--diff-rm-text)' }}
        />
        <span className="text-xs text-text-secondary truncate flex-1">
          {job.jdText.slice(0, 60)}...
        </span>
        <span className="text-[10px]" style={{ color: 'var(--diff-rm-text)' }}>
          failed
        </span>
      </div>
      {job.error && <div className="px-3 pb-2 text-[10px] text-text-muted">{job.error}</div>}
    </div>
  );
}
