import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { BlockDiffView, normalizeDiffText } from '../../ai/DiffView';
import { Printer } from 'iconsax-react';
import type { ResumeSchema } from '@/types/resume';
import type { BatchJob } from './types';
import { SECTION_LABELS } from './types';
import { ResumePreviewThumbnail } from './ResumePreviewThumbnail';
import { CoverLetterSection } from './CoverLetterSection';

/* ── Helpers ──────────────────────────────────────────────── */

const SECTION_KEYS = [
  'basics',
  'work',
  'education',
  'skills',
  'projects',
  'languages',
  'volunteer',
  'awards',
  'certificates',
  'publications',
  'interests',
  'references',
] as const;

function getChangedSections(original: ResumeSchema, tailored: ResumeSchema): string[] {
  return SECTION_KEYS.filter(
    (k) =>
      JSON.stringify(original[k as keyof ResumeSchema]) !==
      JSON.stringify(tailored[k as keyof ResumeSchema]),
  ) as string[];
}

function countLineChanges(original: ResumeSchema, tailored: ResumeSchema): number {
  const a = normalizeDiffText(original).split('\n');
  const b = normalizeDiffText(tailored).split('\n');
  const setA = new Set(a);
  const setB = new Set(b);
  let changes = 0;
  for (const line of a) if (!setB.has(line)) changes++;
  for (const line of b) if (!setA.has(line)) changes++;
  return changes;
}

/* ── Component ────────────────────────────────────────────── */

interface Props {
  job: BatchJob;
  previewHtml: string;
  originalResume: ResumeSchema;
  generatingCL: boolean;
  onSetCurrent: (resume: ResumeSchema) => void;
  onSaveSlot: (job: BatchJob) => void;
  onDownload: (resume: ResumeSchema, name: string, format: string) => void;
  onGenerateCL: (job: BatchJob) => void;
}

export function BatchResultCard({
  job,
  previewHtml,
  originalResume,
  generatingCL,
  onSetCurrent,
  onSaveSlot,
  onDownload,
  onGenerateCL,
}: Props) {
  const [showDiff, setShowDiff] = useState(false);
  const result = job.result!;

  const changedSections = getChangedSections(originalResume, result.tailoredResume);
  const lineChanges = countLineChanges(originalResume, result.tailoredResume);

  return (
    <div className="border-border/40 bg-bg group/card hover:border-accent/40 overflow-hidden rounded-3xl border-2 transition-all">
      {/* Preview thumbnail */}
      <div className="bg-bg-secondary/20 group-hover/card:bg-bg-secondary/40 p-4 transition-colors">
        <div className="overflow-hidden rounded-2xl border">
          <ResumePreviewThumbnail html={previewHtml} title={result.jobTitle} />
        </div>
      </div>

      {/* Title + change summary */}
      <div className="border-border/50 bg-bg-secondary/30 border-t px-6 py-5">
        <div className="text-text text-sm font-bold tracking-tight uppercase">
          {result.jobTitle}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {changedSections.map((s) => (
            <Badge
              key={s}
              variant="accent"
              className="diff-word-add border-diff-add-word/30 px-3 py-1"
            >
              {SECTION_LABELS[s] || s}
            </Badge>
          ))}
          {changedSections.length === 0 && (
            <Badge
              variant="danger"
              className="diff-word-rm border-diff-rm-word/30 px-3 py-1 opacity-60"
            >
              No changes
            </Badge>
          )}
          <Badge variant="default" className="ml-1 px-2 py-1">
            · {lineChanges} LINES CHANGED
          </Badge>
        </div>
      </div>

      {/* Primary actions */}
      <div className="border-border/50 bg-bg flex gap-4 border-t px-6 py-5">
        <Button
          onClick={() => onSetCurrent(result.tailoredResume)}
          className="bg-accent h-12 flex-1 gap-2 rounded-full text-xs font-bold text-white"
        >
          Print <Printer size={16} variant="Bold" color="currentColor" />
        </Button>
        <Button
          variant="secondary"
          onClick={() => onSetCurrent(result.tailoredResume)}
          className="h-12 flex-1 rounded-full text-xs font-bold"
        >
          Set as current
        </Button>
        <Button
          variant="outline"
          onClick={() => onSaveSlot(job)}
          className="border-accent/30 text-accent bg-accent/5 hover:bg-accent/10 h-12 flex-1 rounded-full text-xs font-bold"
        >
          Save to new slot
        </Button>
      </div>

      {/* Secondary actions */}
      <div className="border-border/50 bg-bg-secondary/10 flex items-center gap-3 border-t px-6 py-4">
        <div className="flex gap-2">
          {['json', 'yaml', 'html'].map((fmt) => (
            <Button
              key={fmt}
              variant="outline"
              size="sm"
              onClick={() => onDownload(result.tailoredResume, result.jobTitle, fmt)}
              className="bg-bg text-text-muted hover:text-accent h-7 min-w-0 rounded-full px-3 text-[9px] font-black"
            >
              {fmt}
            </Button>
          ))}
        </div>
        <div className="bg-border/50 mx-1 h-6 w-px" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGenerateCL(job)}
          disabled={generatingCL}
          className="bg-accent/5 border-accent/20 text-accent hover:bg-accent h-7 rounded-full px-3 text-[9px] font-black hover:text-white disabled:opacity-50"
        >
          {generatingCL ? '...' : job.coverLetter ? 'Redo Cover Letter' : 'Cover letter'}
        </Button>
        <div className="flex-1" />
        <Button
          variant={showDiff ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setShowDiff(!showDiff)}
          className={cn(
            'h-7 rounded-full px-4 text-[9px] font-black',
            showDiff
              ? 'border-accent/30 shadow-inner'
              : 'text-text-muted border-border/50 hover:text-text hover:bg-bg-secondary',
          )}
        >
          {showDiff ? 'Hide diff' : 'View diff'}
        </Button>
      </div>

      {/* Diff view */}
      {showDiff && (
        <div className="border-border border-t p-3">
          <BlockDiffView
            oldText={JSON.stringify(originalResume, null, 2)}
            newText={JSON.stringify(result.tailoredResume, null, 2)}
          />
        </div>
      )}

      {/* Cover letter */}
      {job.coverLetter && <CoverLetterSection content={job.coverLetter} />}
    </div>
  );
}
