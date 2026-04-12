import type { BatchJob } from './types';

interface Props {
  jobs: BatchJob[];
  doneCount: number;
  failCount: number;
  onStop: () => void;
}

export function BatchProcessing({ jobs, doneCount, failCount, onStop }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          Processing {doneCount + failCount} of {jobs.length}...
        </span>
        <button onClick={onStop} className="text-[10px] text-danger hover:underline cursor-pointer">
          Stop
        </button>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${((doneCount + failCount) / jobs.length) * 100}%` }}
        />
      </div>
      <div className="space-y-1">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md text-xs"
          >
            {job.status === 'pending' && (
              <span className="w-2 h-2 rounded-full bg-border shrink-0" />
            )}
            {job.status === 'processing' && (
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
            )}
            {job.status === 'done' && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: 'var(--diff-add-text)' }}
              />
            )}
            {job.status === 'failed' && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: 'var(--diff-rm-text)' }}
              />
            )}
            <span className="text-text-secondary truncate flex-1">
              {job.result?.jobTitle || job.jdText.slice(0, 60) + '...'}
            </span>
            {job.status === 'failed' && (
              <span className="text-[10px]" style={{ color: 'var(--diff-rm-text)' }}>
                failed
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
