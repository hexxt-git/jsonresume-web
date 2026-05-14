import { useEffect, useRef } from 'react';
import { useAiStream } from '../shared/useAiStream';
import { SectionDiffReview, type SectionChange } from '../shared/SectionDiffReview';
import { useResumeStore, activeSlot } from '@/store/resumeStore';
import { getAtPath } from '@/lib/ai/resume-tools';
import { captureBeforeDiscreteMutation } from '@/hooks/useUndoRedo';
import {
  useAutomationStore,
  getPromptDirectives,
  getSectionDirective,
  ALL_SECTIONS,
  SECTION_DISPLAY,
  type Creativity,
} from '@/store/automationStore';
import type { CombinedAnalysis } from './types';
import type { ResumeSchema } from '@/types/resume';

const CURRENT_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

import { SECTION_LABELS } from '../BatchTailoring/types';

/* ── Component ──────────────────────────────────────────── */

interface Props {
  jd: string;
  analysis: CombinedAnalysis;
  changes: SectionChange[];
  onChangesGenerated: (changes: SectionChange[]) => void;
  onReady: () => void;
}

export function TailorView({ jd, analysis, changes, onChangesGenerated, onReady }: Props) {
  const { runWithTools, isRunning, error, setError, abort, getResumeContext } = useAiStream();
  const creativity = useAutomationStore((s) => s.creativity);
  const setCreativity = useAutomationStore((s) => s.setCreativity);
  const sectionsToTailor = useAutomationStore((s) => s.sectionsToTailor);
  const toggleSection = useAutomationStore((s) => s.toggleSection);
  const didRun = useRef(false);

  useEffect(() => {
    if (changes.length === 0 && !didRun.current) {
      didRun.current = true;
      handleTailor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTailor = async () => {
    setError(null);
    try {
      const resumeJson = getResumeContext();
      const resume = activeSlot(useResumeStore.getState()).resume;

      const missingKw = analysis.match.missingKeywords.join(', ');
      const highIssues = analysis.audit.categories
        .flatMap((c) => c.issues)
        .filter((i) => i.severity === 'high')
        .map((i) => i.description)
        .join('; ');

      const prompt =
        `You are a resume optimization expert. Today is ${CURRENT_DATE} (${new Date().getFullYear()}).
Tailor this resume for the job description below.
Use your tools to make changes. Process EVERY section that needs improvement.
For replace_section, always include ALL existing entries (modified + unchanged).
Focus on: adding missing keywords naturally, improving bullet points, strengthening the summary.
Do NOT fabricate experience. Only enhance existing content.
IMPORTANT: Only modify content relevant to job tailoring (summary, work highlights, skills, projects, etc.). Do NOT change personal information such as name, email, phone, location, profiles, or any other fields unrelated to tailoring for the job.` +
        (missingKw ? `\nKeywords to incorporate where natural: ${missingKw}` : '') +
        (highIssues ? `\nAlso address these ATS issues: ${highIssues}` : '') +
        getSectionDirective() +
        getPromptDirectives() +
        `\n\nCurrent Resume:\n\`\`\`json\n${resumeJson}\n\`\`\`\n\nJob Description:\n${jd}`;

      const { toolCalls } = await runWithTools(
        prompt,
        'Tailor my resume for this job. Make all necessary improvements.',
        { execute: false },
      );

      const sectionChanges: SectionChange[] = [];
      for (const { call } of toolCalls) {
        if (call.name === 'update_summary') {
          sectionChanges.push({
            sectionKey: 'basics.summary',
            label: 'Professional Summary',
            beforeValue: resume.basics?.summary || '',
            afterValue: call.args.summary as string,
            explanation: 'Tailored summary for the job description',
          });
        } else if (call.name === 'update_basics_field') {
          const field = call.args.field as string;
          sectionChanges.push({
            sectionKey: `basics.${field}`,
            label: `Basic Info: ${field}`,
            beforeValue: getAtPath(resume, ['basics', field]) || '',
            afterValue: call.args.value as string,
            explanation: `Updated ${field}`,
          });
        } else if (call.name === 'replace_section') {
          const section = call.args.section as string;
          sectionChanges.push({
            sectionKey: section,
            label: SECTION_LABELS[section] || section,
            beforeValue: resume[section as keyof ResumeSchema] || [],
            afterValue: call.args.data,
            explanation: `Tailored ${SECTION_LABELS[section] || section}`,
          });
        }
      }
      onChangesGenerated(sectionChanges);
      onReady();
    } catch {
      setError('Failed to generate changes. Try again.');
      onReady();
    }
  };

  const handleRegenerate = () => {
    didRun.current = true;
    onChangesGenerated([]);
    handleTailor();
  };

  const handleAcceptChange = (sectionKey: string, afterValue: unknown) => {
    captureBeforeDiscreteMutation();
    const store = useResumeStore.getState();
    if (sectionKey === 'basics.summary') store.updateBasics('summary', afterValue);
    else if (sectionKey.startsWith('basics.'))
      store.updateBasics(sectionKey.split('.')[1], afterValue);
    else store.updateArraySection(sectionKey as keyof ResumeSchema, afterValue as unknown[]);
  };

  const handleAcceptAll = () => {
    captureBeforeDiscreteMutation();
    const store = useResumeStore.getState();
    for (const c of changes) {
      if (c.sectionKey === 'basics.summary') store.updateBasics('summary', c.afterValue);
      else if (c.sectionKey.startsWith('basics.'))
        store.updateBasics(c.sectionKey.split('.')[1], c.afterValue);
      else store.updateArraySection(c.sectionKey as keyof ResumeSchema, c.afterValue as unknown[]);
    }
  };

  /* ── Loading ──────────────────────────────────────────── */

  if (isRunning) {
    return (
      <div className="py-8 text-center">
        <div className="border-accent mb-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-text-muted text-xs">Generating tailored changes...</p>
        <button
          onClick={abort}
          className="text-text-muted hover:text-danger mt-1 cursor-pointer text-[10px]"
        >
          Cancel
        </button>
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────── */

  if (error && changes.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-danger bg-danger/10 border-danger/20 flex items-center gap-3 rounded-2xl border px-6 py-4 text-xs font-medium">
          <span className="text-lg">&times;</span>
          {error}
        </div>
        <button
          onClick={handleRegenerate}
          className="text-accent hover:bg-accent/5 border-accent/20 cursor-pointer rounded-full border px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  /* ── No changes needed ────────────────────────────────── */

  if (changes.length === 0 && !isRunning) {
    return (
      <div className="bg-bg-secondary/20 border-border/50 space-y-4 rounded-3xl border border-dashed py-16 text-center">
        <p className="text-text-muted text-sm font-medium italic">
          No changes needed — your resume already matches well.
        </p>
        <button
          onClick={handleRegenerate}
          className="text-accent hover:bg-accent/5 border-accent/30 cursor-pointer rounded-full border px-6 py-2.5 text-xs font-bold tracking-widest uppercase transition-all"
        >
          Try with different settings
        </button>
      </div>
    );
  }

  /* ── Review ───────────────────────────────────────────── */

  return (
    <div className="space-y-6 p-4">
      {/* Inline settings */}
      <div className="bg-bg-secondary/30 border-border/50 space-y-6 rounded-2xl border p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
            Approach
          </span>
          <div className="bg-bg border-border/50 flex gap-2 rounded-full border p-1">
            {(['conservative', 'balanced', 'creative'] as Creativity[]).map((c) => (
              <button
                key={c}
                onClick={() => setCreativity(c)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-bold tracking-tight uppercase transition-all ${
                  creativity === c
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={handleRegenerate}
            className="text-accent hover:text-accent/80 border-accent/20 hover:border-accent ml-auto cursor-pointer border-b-2 pb-0.5 text-[10px] font-bold tracking-widest uppercase transition-all"
          >
            Regenerate
          </button>
        </div>

        <details className="group">
          <summary className="text-text-muted hover:text-text-secondary flex cursor-pointer items-center gap-2 text-[10px] font-bold tracking-widest uppercase select-none">
            Sections to modify
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 pl-3 sm:grid-cols-3">
            {ALL_SECTIONS.map((s) => (
              <label
                key={s}
                className="text-text-secondary group/item hover:text-accent flex cursor-pointer items-center gap-2.5 text-[11px] font-medium transition-colors select-none"
              >
                <input
                  type="checkbox"
                  checked={sectionsToTailor.includes(s)}
                  onChange={() => toggleSection(s)}
                  className="border-border-input accent-accent h-4 w-4 cursor-pointer rounded-full"
                />
                {SECTION_DISPLAY[s] || s}
              </label>
            ))}
          </div>
        </details>
      </div>

      {error && (
        <div className="text-danger bg-danger/10 border-danger/20 rounded-2xl border px-6 py-4 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Diff review */}
      <SectionDiffReview
        changes={changes}
        onAccept={handleAcceptChange}
        onReject={() => {}}
        onAcceptAll={handleAcceptAll}
        onRejectAll={() => {}}
      />
    </div>
  );
}
