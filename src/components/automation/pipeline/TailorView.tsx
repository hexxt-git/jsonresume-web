import { useEffect, useRef } from 'react';
import { useAiStream } from '../shared/useAiStream';
import { SectionDiffReview, type SectionChange } from '../shared/SectionDiffReview';
import { useResumeStore, activeSlot } from '../../../store/resumeStore';
import { getAtPath } from '../../../lib/ai/resume-tools';
import { captureBeforeDiscreteMutation } from '../../../hooks/useUndoRedo';
import {
  useAutomationStore,
  getPromptDirectives,
  getSectionDirective,
  ALL_SECTIONS,
  SECTION_DISPLAY,
  type Creativity,
} from '../../../store/automationStore';
import type { CombinedAnalysis } from './types';
import type { ResumeSchema } from '../../../types/resume';

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
      <div className="text-center py-8">
        <div className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-text-muted">Generating tailored changes...</p>
        <button
          onClick={abort}
          className="text-[10px] text-text-muted hover:text-danger cursor-pointer mt-1"
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
        <div className="text-xs font-medium text-danger bg-danger/10 border border-danger/20 rounded-2xl px-6 py-4 flex items-center gap-3">
          <span className="text-lg">&times;</span>
          {error}
        </div>
        <button
          onClick={handleRegenerate}
          className="text-xs font-bold text-accent hover:bg-accent/5 px-4 py-2 rounded-full border border-accent/20 transition-all cursor-pointer uppercase tracking-widest"
        >
          Try again
        </button>
      </div>
    );
  }

  /* ── No changes needed ────────────────────────────────── */

  if (changes.length === 0 && !isRunning) {
    return (
      <div className="text-center py-16 space-y-4 bg-bg-secondary/20 rounded-3xl border border-dashed border-border/50">
        <p className="text-sm font-medium text-text-muted italic">
          No changes needed — your resume already matches well.
        </p>
        <button
          onClick={handleRegenerate}
          className="text-xs font-bold text-accent hover:bg-accent/5 px-6 py-2.5 rounded-full border border-accent/30 transition-all cursor-pointer uppercase tracking-widest"
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
      <div className="space-y-6 bg-bg-secondary/30 p-5 rounded-2xl border border-border/50">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Approach
          </span>
          <div className="flex gap-2 bg-bg p-1 rounded-full border border-border/50 shadow-sm">
            {(['conservative', 'balanced', 'creative'] as Creativity[]).map((c) => (
              <button
                key={c}
                onClick={() => setCreativity(c)}
                className={`text-[10px] font-bold px-4 py-1.5 rounded-full cursor-pointer transition-all uppercase tracking-tight ${
                  creativity === c
                    ? 'bg-accent text-white shadow-md'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={handleRegenerate}
            className="text-[10px] font-bold text-accent hover:text-accent/80 cursor-pointer ml-auto uppercase tracking-widest border-b-2 border-accent/20 hover:border-accent transition-all pb-0.5"
          >
            Regenerate
          </button>
        </div>

        <details className="group">
          <summary className="text-[10px] font-bold text-text-muted cursor-pointer hover:text-text-secondary select-none uppercase tracking-widest flex items-center gap-2">
            Sections to modify
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mt-4 pl-3">
            {ALL_SECTIONS.map((s) => (
              <label
                key={s}
                className="flex items-center gap-2.5 text-[11px] font-medium text-text-secondary cursor-pointer select-none group/item hover:text-accent transition-colors"
              >
                <input
                  type="checkbox"
                  checked={sectionsToTailor.includes(s)}
                  onChange={() => toggleSection(s)}
                  className="rounded-full border-border-input accent-accent w-4 h-4 cursor-pointer"
                />
                {SECTION_DISPLAY[s] || s}
              </label>
            ))}
          </div>
        </details>
      </div>

      {error && (
        <div className="text-xs font-medium text-danger bg-danger/10 border border-danger/20 rounded-2xl px-6 py-4">
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
