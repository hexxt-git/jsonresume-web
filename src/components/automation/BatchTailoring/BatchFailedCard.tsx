import type { BatchJob } from './types';

export function BatchFailedCard({ job }: { job: BatchJob }) {
  return (
    <div className="rounded-2xl border-2 border-danger/20 bg-danger/5 overflow-hidden shadow-sm">
      <div className="px-5 py-4 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-diff-rm shadow-[0_0_8px_rgba(var(--diff-rm-rgb),0.5)]" />
        <span className="text-xs font-bold text-text-secondary truncate flex-1 uppercase tracking-tight">
          {job.jdText.slice(0, 80)}...
        </span>
        <span className="text-[10px] font-black text-diff-rm uppercase tracking-tighter bg-diff-rm/10 px-2 py-0.5 rounded-full">
          FAILED
        </span>
      </div>
      {job.error && (
        <div className="px-5 pb-4 text-[11px] font-medium text-text-muted italic leading-relaxed">
          {job.error}
        </div>
      )}
    </div>
  );
}
