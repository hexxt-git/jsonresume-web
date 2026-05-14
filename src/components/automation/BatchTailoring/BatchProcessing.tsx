import type { BatchJob } from './types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
    <div className="bg-bg-secondary/20 border-border/50 space-y-8 rounded-3xl border p-8 shadow-inner">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
            Processing {current} of {total} variants
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className="text-danger hover:bg-danger/5 h-6 rounded-full px-3 text-[10px]"
          >
            Stop
          </Button>
        </div>
        <div className="bg-bg border-border/50 h-3 overflow-hidden rounded-full border p-0.5 shadow-inner">
          <div
            className="bg-accent h-full rounded-full shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all ${
              job.status === 'processing'
                ? 'bg-bg border-accent/30 ring-accent/5 ring-4'
                : 'bg-bg/50 border-border/40'
            }`}
          >
            {job.status === 'pending' && (
              <span className="bg-border h-2.5 w-2.5 shrink-0 rounded-full" />
            )}
            {job.status === 'processing' && (
              <span className="bg-accent h-2.5 w-2.5 shrink-0 animate-ping rounded-full" />
            )}
            {job.status === 'done' && (
              <span className="bg-diff-add h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_8px_rgba(var(--diff-add-rgb),0.5)]" />
            )}
            {job.status === 'failed' && (
              <span className="bg-diff-rm h-2.5 w-2.5 shrink-0 rounded-full" />
            )}
            <span className="text-text-secondary flex-1 truncate text-xs font-bold tracking-tight uppercase">
              {job.result?.jobTitle || job.jdText.slice(0, 80) + '...'}
            </span>
            <div className="flex items-center gap-3">
              {job.status === 'processing' && (
                <Badge variant="accent" className="animate-pulse px-2 py-0.5 font-black">
                  WORKING...
                </Badge>
              )}
              {job.status === 'done' && (
                <Badge variant="accent" className="px-2 py-0.5 font-black">
                  DONE
                </Badge>
              )}
              {job.status === 'failed' && (
                <Badge variant="danger" className="px-2 py-0.5 font-black">
                  FAILED
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
