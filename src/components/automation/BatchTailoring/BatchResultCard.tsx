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
    <div className="rounded-3xl overflow-hidden border-2 border-border/40 bg-bg transition-all hover:shadow-2xl group/card">
      {/* Preview thumbnail */}
      <div className="p-4 bg-bg-secondary/20 group-hover/card:bg-bg-secondary/40 transition-colors">
        <div className="rounded-2xl overflow-hidden border border-border shadow-md">
          <ResumePreviewThumbnail html={previewHtml} title={result.jobTitle} />
        </div>
      </div>

      {/* Title + change summary */}
      <div className="px-6 py-5 border-t border-border/50 bg-bg-secondary/30">
        <div className="text-sm font-bold text-text uppercase tracking-tight">
          {result.jobTitle}
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {changedSections.map((s) => (
            <span
              key={s}
              className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tight diff-word-add shadow-sm border border-diff-add-word/30"
            >
              {SECTION_LABELS[s] || s}
            </span>
          ))}
          {changedSections.length === 0 && (
            <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tight diff-word-rm shadow-sm border border-diff-rm-word/30 opacity-60">
              No changes
            </span>
          )}
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1 bg-bg-secondary px-2 py-1 rounded-full border border-border/50">
            · {lineChanges} LINES CHANGED
          </span>
        </div>
      </div>

      {/* Primary actions */}
      <div className="px-6 py-5 flex gap-4 border-t border-border/50 bg-bg">
        <button
          onClick={() => onSetCurrent(result.tailoredResume)}
          className="flex-1 flex items-center justify-center gap-2 text-xs py-3 rounded-full bg-accent text-white hover:opacity-90 cursor-pointer font-bold shadow-lg transition-all uppercase tracking-widest"
        >
          Print <Printer size={16} variant="Bold" color="currentColor" />
        </button>
        <button
          onClick={() => onSetCurrent(result.tailoredResume)}
          className="flex-1 text-xs py-3 rounded-full bg-bg-secondary text-text hover:bg-bg-hover cursor-pointer font-bold border border-border/50 transition-all uppercase tracking-widest"
        >
          Set as current
        </button>
        <button
          onClick={() => onSaveSlot(job)}
          className="flex-1 text-xs py-3 rounded-full border border-accent/30 text-accent bg-accent/5 hover:bg-accent/10 cursor-pointer font-bold transition-all uppercase tracking-widest"
        >
          Save to new slot
        </button>
      </div>

      {/* Secondary actions */}
      <div className="px-6 py-4 flex items-center gap-3 border-t border-border/50 bg-bg-secondary/10">
        <div className="flex gap-2">
          {['json', 'yaml', 'html'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => onDownload(result.tailoredResume, result.jobTitle, fmt)}
              className="text-[9px] px-3 py-1.5 bg-bg border border-border/50 rounded-full text-text-muted hover:text-accent cursor-pointer uppercase font-black tracking-widest shadow-sm transition-all"
            >
              {fmt}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-border/50 mx-1" />
        <button
          onClick={() => onGenerateCL(job)}
          disabled={generatingCL}
          className="text-[9px] px-3 py-1.5 bg-accent/5 border border-accent/20 rounded-full text-accent hover:bg-accent hover:text-white cursor-pointer disabled:opacity-50 font-black tracking-widest uppercase shadow-sm transition-all"
        >
          {generatingCL ? '...' : job.coverLetter ? 'Redo Cover Letter' : 'Cover letter'}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowDiff(!showDiff)}
          className={`text-[9px] px-4 py-1.5 rounded-full cursor-pointer transition-all font-black tracking-widest uppercase border ${
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
        <div className="border-t border-border p-3">
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
