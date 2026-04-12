import { useState } from 'react';
import { BlockDiffView, normalizeDiffText } from '../../ai/DiffView';
import { Printer } from 'lucide-react';
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
    <div className="rounded-lg overflow-hidden border border-border transition-shadow hover:shadow-sm">
      {/* Preview thumbnail */}
      <ResumePreviewThumbnail html={previewHtml} title={result.jobTitle} />

      {/* Title + change summary */}
      <div className="px-3 py-2.5 border-t border-border bg-bg-secondary">
        <div className="text-xs font-medium text-text">{result.jobTitle}</div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {changedSections.map((s) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded diff-word-add">
              {SECTION_LABELS[s] || s}
            </span>
          ))}
          {changedSections.length === 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded diff-word-rm">No changes</span>
          )}
          <span className="text-[10px] text-text-faint">· {lineChanges} lines changed</span>
        </div>
      </div>

      {/* Primary actions */}
      <div className="px-3 py-2 flex gap-2 border-t border-border">
        <button
          onClick={() => onSetCurrent(result.tailoredResume)}
          className="flex-1 text-xs py-1.5 rounded-md bg-accent text-white hover:opacity-90 cursor-pointer font-medium"
        >
          Print <Printer size={14} className="inline-block ms-1" />
        </button>
        <button
          onClick={() => onSetCurrent(result.tailoredResume)}
          className="flex-1 text-xs py-1.5 rounded-md bg-accent text-white hover:opacity-90 cursor-pointer font-medium"
        >
          Set as current
        </button>
        <button
          onClick={() => onSaveSlot(job)}
          className="flex-1 text-xs py-1.5 rounded-md border border-accent/50 text-accent hover:bg-accent/10 cursor-pointer"
        >
          Save to new slot
        </button>
      </div>

      {/* Secondary actions */}
      <div className="px-3 py-2 flex items-center gap-1.5 border-t border-border">
        <div className="flex gap-1">
          {['json', 'yaml', 'html'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => onDownload(result.tailoredResume, result.jobTitle, fmt)}
              className="text-[10px] px-2 py-1 bg-bg-tertiary rounded text-text-muted hover:text-text-secondary cursor-pointer uppercase"
            >
              {fmt}
            </button>
          ))}
        </div>
        <div className="h-3.5 w-px bg-border" />
        <button
          onClick={() => onGenerateCL(job)}
          disabled={generatingCL}
          className="text-[10px] px-2 py-1 bg-bg-tertiary rounded text-text-muted hover:text-text-secondary cursor-pointer disabled:opacity-50"
        >
          {generatingCL ? '...' : job.coverLetter ? 'Redo CL' : 'Cover letter'}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowDiff(!showDiff)}
          className={`text-[10px] px-2 py-1 rounded cursor-pointer transition-colors ${
            showDiff
              ? 'bg-accent/10 text-accent'
              : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'
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
