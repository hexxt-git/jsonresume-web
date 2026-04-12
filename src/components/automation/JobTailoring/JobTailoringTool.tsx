import { useState } from 'react';
import { ToolShell } from '../shared/ToolShell';
import { useAiStream } from '../shared/useAiStream';
import { AutomationSettings, SettingsFooterButton } from '../shared/AutomationSettings';
import type { SectionChange } from '../shared/SectionDiffReview';
import { useResumeStore, activeSlot } from '../../../store/resumeStore';
import { getAtPath } from '../../../lib/ai/resume-tools';
import { captureBeforeDiscreteMutation } from '../../../hooks/useUndoRedo';
import { getPromptDirectives, getSectionDirective } from '../../../store/automationStore';
import type { ResumeSchema } from '../../../types/resume';
import { Stepper } from '../shared/Stepper';
import type { AnalysisData } from './types';
import { SECTION_LABELS } from './types';
import { JdInputStep } from './JdInputStep';
import { MatchAnalysis } from './MatchAnalysis';
import { TailoringSpinner } from './TailoringSpinner';
import { ReviewStep } from './ReviewStep';

/* ── Prompts ──────────────────────────────────────────────── */

type Step = 'input' | 'analysis' | 'tailoring' | 'review';

const CURRENT_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const ANALYSIS_PROMPT = `You are a recruitment expert. Today is ${CURRENT_DATE} (${new Date().getFullYear()}).
First, determine if the input is a real job description relevant to the candidate's field. Set "relevant" to false if it's not a job posting, is gibberish, or is for a completely unrelated field (e.g. a nurse JD for a software engineer).
Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "relevant": <boolean>,
  "relevanceReason": "<why not relevant, omit if relevant>",
  "overallMatchScore": <number 0-100>,
  "matchingKeywords": ["keyword1", ...],
  "missingKeywords": ["keyword1", ...],
  "sections": {
    "summary": { "score": <number>, "analysis": "<1 short sentence>" },
    "work": { "score": <number>, "analysis": "<1 short sentence>" },
    "skills": { "score": <number>, "analysis": "<1 short sentence>" },
    "education": { "score": <number>, "analysis": "<1 short sentence>" },
    "projects": { "score": <number>, "analysis": "<1 short sentence>" }
  },
  "recommendations": ["rec1", "rec2", ...]
}
If not relevant, set overallMatchScore to 0 and leave other arrays empty.
Keep analysis sentences under 15 words. Keep recommendations under 20 words.`;

const TAILOR_PROMPT = `You are a resume optimization expert. Today is ${CURRENT_DATE} (${new Date().getFullYear()}).
Tailor this resume for the job description below.
Use your tools to make changes. Process EVERY section that needs improvement.
For replace_section, always include ALL existing entries (modified + unchanged).
Focus on: adding missing keywords naturally, improving bullet points, strengthening the summary.
Do NOT fabricate experience. Only enhance existing content.`;

/* ── Component ────────────────────────────────────────────── */

export default function JobTailoringTool({ onBack }: { onBack: () => void }) {
  const { run, runWithTools, isRunning, error, setError, abort, getResumeContext } = useAiStream();
  const [step, setStep] = useState<Step>('input');
  const [jd, setJd] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [changes, setChanges] = useState<SectionChange[]>([]);

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    setError(null);
    try {
      const resumeJson = getResumeContext();
      const result = await run(
        ANALYSIS_PROMPT + getPromptDirectives() + `\n\nResume:\n\`\`\`json\n${resumeJson}\n\`\`\``,
        `Job Description:\n${jd}`,
      );
      const cleaned = result.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
      const data = JSON.parse(cleaned) as AnalysisData;
      if (!data.relevant) {
        setError(
          data.relevanceReason || 'This job description does not appear relevant to your profile.',
        );
        return;
      }
      setAnalysis(data);
      setStep('analysis');
    } catch {
      setError('Failed to analyze. Try again.');
    }
  };

  const handleTailor = async () => {
    setStep('tailoring');
    setError(null);
    try {
      const resumeJson = getResumeContext();
      const resume = activeSlot(useResumeStore.getState()).resume;
      const { toolCalls } = await runWithTools(
        TAILOR_PROMPT +
          getSectionDirective() +
          getPromptDirectives() +
          `\n\nCurrent Resume:\n\`\`\`json\n${resumeJson}\n\`\`\`\n\nJob Description:\n${jd}`,
        `Tailor my resume for this job. Make all necessary improvements.`,
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
      setChanges(sectionChanges);
      setStep('review');
    } catch {
      setError('Failed to generate changes. Try again.');
      setStep('analysis');
    }
  };

  const handleAcceptChange = (sectionKey: string, afterValue: unknown) => {
    captureBeforeDiscreteMutation();
    const store = useResumeStore.getState();
    if (sectionKey === 'basics.summary') store.updateBasics('summary', afterValue);
    else if (sectionKey.startsWith('basics.'))
      store.updateBasics(sectionKey.split('.')[1], afterValue);
    else store.updateArraySection(sectionKey as keyof ResumeSchema, afterValue as any);
  };

  const handleAcceptAll = () => {
    captureBeforeDiscreteMutation();
    const store = useResumeStore.getState();
    for (const c of changes) {
      if (c.sectionKey === 'basics.summary') store.updateBasics('summary', c.afterValue);
      else if (c.sectionKey.startsWith('basics.'))
        store.updateBasics(c.sectionKey.split('.')[1], c.afterValue);
      else store.updateArraySection(c.sectionKey as keyof ResumeSchema, c.afterValue as any);
    }
  };

  const stepIndex = step === 'tailoring' ? 2 : ['input', 'analysis', 'review'].indexOf(step);

  return (
    <ToolShell
      title="Job Tailoring"
      onBack={onBack}
      headerExtra={<AutomationSettings />}
      footer={
        step === 'input' ? (
          <div className="flex gap-2">
            <SettingsFooterButton />
            <button
              onClick={handleAnalyze}
              disabled={!jd.trim() || isRunning}
              className="flex-1 text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Analyzing...' : 'Analyze Match'}
            </button>
          </div>
        ) : step === 'analysis' ? (
          <div className="flex gap-2">
            <SettingsFooterButton />
            <button
              onClick={handleTailor}
              disabled={isRunning}
              className="flex-1 text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? 'Tailoring...' : 'Tailor Resume'}
            </button>
          </div>
        ) : step === 'review' ? (
          <button
            onClick={onBack}
            className="w-full text-xs py-2.5 border border-border rounded-lg hover:bg-bg-hover cursor-pointer text-text-secondary"
          >
            Done
          </button>
        ) : undefined
      }
    >
      <div className="p-4 space-y-4">
        <Stepper steps={['Enter JD', 'Analysis', 'Review Changes']} currentIndex={stepIndex} />

        {error && (
          <div className="text-xs text-danger bg-danger/10 rounded-md px-3 py-2">{error}</div>
        )}

        {step === 'input' && <JdInputStep jd={jd} onChange={setJd} />}
        {step === 'analysis' && analysis && (
          <MatchAnalysis analysis={analysis} onEditJd={() => setStep('input')} />
        )}
        {step === 'tailoring' && <TailoringSpinner onCancel={abort} />}
        {step === 'review' && (
          <ReviewStep
            changes={changes}
            onAccept={handleAcceptChange}
            onAcceptAll={handleAcceptAll}
            onTryAnother={() => setStep('input')}
          />
        )}
      </div>
    </ToolShell>
  );
}
