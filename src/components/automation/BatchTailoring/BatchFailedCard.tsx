import type { BatchJob } from './types';

export function BatchFailedCard({ job }: { job: BatchJob }) {
  return (
    <div className="border-danger/20 bg-danger/5 overflow-hidden rounded-2xl border-2 shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="bg-diff-rm h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_8px_rgba(var(--diff-rm-rgb),0.5)]" />
        <span className="text-text-secondary flex-1 truncate text-xs font-bold tracking-tight uppercase">
          {job.jdText.slice(0, 80)}...
        </span>
        <span className="text-diff-rm bg-diff-rm/10 rounded-full px-2 py-0.5 text-[10px] font-black tracking-tighter uppercase">
          FAILED
        </span>
      </div>
      {job.error && (
        <div className="text-text-muted px-5 pb-4 text-[11px] leading-relaxed font-medium italic">
          {job.error}
        </div>
      )}
    </div>
  );
}
