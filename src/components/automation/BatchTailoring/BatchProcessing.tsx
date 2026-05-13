import type { BatchJob } from './types';

interface Props {
  jobs: BatchJob[];
  doneCount: number;
  failCount: number;
  onStop: () => void;
}

export function BatchProcessing({ jobs, doneCount, failCount, onStop }: Props) {
  const total = jobs.length;
  const current = doneCount + failCount;
  const pct = (current / total) * 100;

  return (
    <div className="space-y-8 bg-bg-secondary/20 p-8 rounded-3xl border border-border/50 shadow-inner">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Processing {current} of {total} variants
          </span>
          <button
            onClick={onStop}
            className="text-[10px] font-bold text-danger hover:bg-danger/5 px-3 py-1 rounded-full border border-danger/20 transition-all cursor-pointer uppercase tracking-wider"
          >
            Stop
          </button>
        </div>
        <div className="h-3 bg-bg rounded-full overflow-hidden border border-border/50 shadow-inner p-0.5">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`flex items-center gap-4 px-5 py-4 border rounded-2xl transition-all shadow-sm ${
              job.status === 'processing'
                ? 'bg-bg border-accent/30 ring-4 ring-accent/5'
                : 'bg-bg/50 border-border/40'
            }`}
          >
            {job.status === 'pending' && (
              <span className="w-2.5 h-2.5 rounded-full bg-border shrink-0" />
            )}
            {job.status === 'processing' && (
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping shrink-0" />
            )}
            {job.status === 'done' && (
              <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-diff-add shadow-[0_0_8px_rgba(var(--diff-add-rgb),0.5)]" />
            )}
            {job.status === 'failed' && (
              <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-diff-rm" />
            )}
            <span className="text-xs font-bold text-text-secondary truncate flex-1 uppercase tracking-tight">
              {job.result?.jobTitle || job.jdText.slice(0, 80) + '...'}
            </span>
            <div className="flex items-center gap-3">
              {job.status === 'processing' && (
                <span className="text-[10px] font-black text-accent animate-pulse uppercase tracking-tighter">
                  WORKING...
                </span>
              )}
              {job.status === 'done' && (
                <span className="text-[10px] font-black text-diff-add uppercase tracking-tighter">
                  DONE
                </span>
              )}
              {job.status === 'failed' && (
                <span className="text-[10px] font-black text-diff-rm uppercase tracking-tighter">
                  FAILED
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
