import { useState } from 'react';
import { BlockDiffView, normalizeDiffText } from '../../ai/DiffView';
import { Printer } from 'iconsax-react';
import type { ResumeSchema } from '../../../types/resume';
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
    <div className="border-border/40 bg-bg group/card overflow-hidden rounded-3xl border-2 transition-all hover:shadow-2xl">
      {/* Preview thumbnail */}
      <div className="bg-bg-secondary/20 group-hover/card:bg-bg-secondary/40 p-4 transition-colors">
        <div className="overflow-hidden rounded-2xl border shadow-md">
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
            <span
              key={s}
              className="diff-word-add border-diff-add-word/30 rounded-full border px-3 py-1 text-[10px] font-bold tracking-tight uppercase shadow-sm"
            >
              {SECTION_LABELS[s] || s}
            </span>
          ))}
          {changedSections.length === 0 && (
            <span className="diff-word-rm border-diff-rm-word/30 rounded-full border px-3 py-1 text-[10px] font-bold tracking-tight uppercase opacity-60 shadow-sm">
              No changes
            </span>
          )}
          <span className="text-text-muted bg-bg-secondary border-border/50 ml-1 rounded-full border px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
            · {lineChanges} LINES CHANGED
          </span>
        </div>
      </div>

      {/* Primary actions */}
      <div className="border-border/50 bg-bg flex gap-4 border-t px-6 py-5">
        <button
          onClick={() => onSetCurrent(result.tailoredResume)}
          className="bg-accent flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full py-3 text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all hover:opacity-90"
        >
          Print <Printer size={16} variant="Bold" color="currentColor" />
        </button>
        <button
          onClick={() => onSetCurrent(result.tailoredResume)}
          className="bg-bg-secondary text-text hover:bg-bg-hover border-border/50 flex-1 cursor-pointer rounded-full border py-3 text-xs font-bold tracking-widest uppercase transition-all"
        >
          Set as current
        </button>
        <button
          onClick={() => onSaveSlot(job)}
          className="border-accent/30 text-accent bg-accent/5 hover:bg-accent/10 flex-1 cursor-pointer rounded-full border py-3 text-xs font-bold tracking-widest uppercase transition-all"
        >
          Save to new slot
        </button>
      </div>

      {/* Secondary actions */}
      <div className="border-border/50 bg-bg-secondary/10 flex items-center gap-3 border-t px-6 py-4">
        <div className="flex gap-2">
          {['json', 'yaml', 'html'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => onDownload(result.tailoredResume, result.jobTitle, fmt)}
              className="bg-bg border-border/50 text-text-muted hover:text-accent cursor-pointer rounded-full border px-3 py-1.5 text-[9px] font-black tracking-widest uppercase shadow-sm transition-all"
            >
              {fmt}
            </button>
          ))}
        </div>
        <div className="bg-border/50 mx-1 h-6 w-px" />
        <button
          onClick={() => onGenerateCL(job)}
          disabled={generatingCL}
          className="bg-accent/5 border-accent/20 text-accent hover:bg-accent cursor-pointer rounded-full border px-3 py-1.5 text-[9px] font-black tracking-widest uppercase shadow-sm transition-all hover:text-white disabled:opacity-50"
        >
          {generatingCL ? '...' : job.coverLetter ? 'Redo Cover Letter' : 'Cover letter'}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowDiff(!showDiff)}
          className={`cursor-pointer rounded-full border px-4 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all ${
            showDiff
              ? 'bg-bg text-accent border-accent/30 shadow-inner'
              : 'bg-bg text-text-muted border-border/50 hover:text-text hover:bg-bg-secondary shadow-sm'
          }`}
        >
          {showDiff ? 'Hide diff' : 'View diff'}
        </button>
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
