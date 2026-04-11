import { useState } from 'react';
import { ToolShell } from '../shared/ToolShell';
import { useAiStream } from '../shared/useAiStream';
import { SectionDiffReview, type SectionChange } from '../shared/SectionDiffReview';
import { useResumeStore, activeSlot } from '../../../store/resumeStore';
import { getAtPath } from '../../../lib/ai/resume-tools';
import { captureBeforeDiscreteMutation } from '../../../hooks/useUndoRedo';
import type { ResumeSchema } from '../../../types/resume';
import { Stepper } from '../shared/Stepper';
import { JdInput } from '../shared/JdInput';

interface AnalysisData {
  overallMatchScore: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  sections: Record<string, { score: number; analysis: string }>;
  recommendations: string[];
}

type Step = 'input' | 'analysis' | 'tailoring' | 'review';

const scoreColor = (s: number) =>
  s >= 75 ? 'var(--diff-add-text)' : s >= 50 ? 'var(--accent)' : 'var(--diff-rm-text)';

const SECTION_LABELS: Record<string, string> = {
  work: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  languages: 'Languages',
  volunteer: 'Volunteer',
  awards: 'Awards',
  certificates: 'Certificates',
  publications: 'Publications',
  interests: 'Interests',
  references: 'References',
};

const ANALYSIS_PROMPT = `You are a recruitment expert. Analyze this resume against the following job description.
Return ONLY valid JSON (no markdown fences) with this exact structure:
{
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
Keep analysis sentences under 15 words. Keep recommendations under 20 words.`;

const TAILOR_PROMPT = `You are a resume optimization expert. Tailor this resume for the job description below.
Use your tools to make changes. Process EVERY section that needs improvement.
For replace_section, always include ALL existing entries (modified + unchanged).
Focus on: adding missing keywords naturally, improving bullet points, strengthening the summary.
Do NOT fabricate experience. Only enhance existing content.`;

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
        ANALYSIS_PROMPT + `\n\nResume:\n\`\`\`json\n${resumeJson}\n\`\`\``,
        `Job Description:\n${jd}`,
      );
      const cleaned = result.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
      setAnalysis(JSON.parse(cleaned) as AnalysisData);
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
      footer={
        step === 'input' ? (
          <button
            onClick={handleAnalyze}
            disabled={!jd.trim() || isRunning}
            className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Analyzing...' : 'Analyze Match'}
          </button>
        ) : step === 'analysis' ? (
          <button
            onClick={handleTailor}
            disabled={isRunning}
            className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? 'Tailoring...' : 'Tailor Resume'}
          </button>
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

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Paste or upload a job description. We'll analyze how well your resume matches and
              generate tailored improvements.
            </p>
            <JdInput value={jd} onChange={setJd} rows={10} />
          </div>
        )}

        {/* Step 2: Analysis */}
        {step === 'analysis' && analysis && (
          <div className="space-y-4">
            {/* Score badge + info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: scoreColor(analysis.overallMatchScore), color: 'var(--bg)' }}
                >
                  {analysis.overallMatchScore}
                </div>
                <div>
                  <div className="text-xs font-medium text-text">Match Score</div>
                  <div className="text-[10px] text-text-muted">
                    {analysis.matchingKeywords.length} matching · {analysis.missingKeywords.length}{' '}
                    missing keywords
                    {(() => {
                      const resume = activeSlot(useResumeStore.getState()).resume;
                      const warnings: string[] = [];
                      if (!resume.work?.length) warnings.push('no work experience');
                      else if (resume.work.length < 2) warnings.push('limited work experience');
                      if (!resume.education?.length) warnings.push('no education');
                      if (!resume.skills?.length) warnings.push('no skills listed');
                      if (!resume.basics?.summary) warnings.push('no summary');
                      return warnings.length ? (
                        <span style={{ color: 'var(--diff-rm-text)' }}>
                          {' '}
                          · {warnings.join(', ')}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStep('input')}
                className="text-[10px] text-text-muted hover:text-text-secondary cursor-pointer"
              >
                Edit JD
              </button>
            </div>

            {/* Keywords */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary">
                <span className="text-xs font-medium text-text">Keywords</span>
                <span className="text-[10px] text-text-muted">
                  <span style={{ color: 'var(--diff-add-text)' }}>
                    {analysis.matchingKeywords.length} matching
                  </span>
                  {' · '}
                  <span style={{ color: 'var(--diff-rm-text)' }}>
                    {analysis.missingKeywords.length} missing
                  </span>
                </span>
              </div>
              <div className="px-3 py-2 space-y-2">
                {analysis.matchingKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {analysis.matchingKeywords.map((k) => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded diff-word-add">
                        {k}
                      </span>
                    ))}
                  </div>
                )}
                {analysis.missingKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {analysis.missingKeywords.map((k) => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded diff-word-rm">
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sections */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-bg-secondary text-xs font-medium text-text">
                Sections
              </div>
              <div className="divide-y divide-border">
                {Object.entries(analysis.sections).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 px-3 py-1.5">
                    <span className="text-xs text-text-secondary capitalize flex-1">{key}</span>
                    <span className="text-[10px] text-text-muted flex-1 truncate">
                      {val.analysis}
                    </span>
                    <span
                      className="text-xs font-medium shrink-0"
                      style={{ color: scoreColor(val.score) }}
                    >
                      {val.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-bg-secondary text-xs font-medium text-text">
                  Recommendations
                </div>
                <div className="px-3 py-2 space-y-1">
                  {analysis.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-2 text-xs text-text-secondary">
                      <span className="text-accent shrink-0">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tailoring spinner */}
        {step === 'tailoring' && (
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
        )}

        {/* Step 3: Review */}
        {step === 'review' && changes.length > 0 && (
          <div className="space-y-3">
            <SectionDiffReview
              changes={changes}
              onAccept={handleAcceptChange}
              onReject={() => {}}
              onAcceptAll={handleAcceptAll}
              onRejectAll={() => {}}
            />
          </div>
        )}

        {step === 'review' && changes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-text-muted">
              No changes needed — your resume already matches well.
            </p>
            <button
              onClick={() => setStep('input')}
              className="text-xs text-accent hover:underline cursor-pointer mt-2"
            >
              Try another JD
            </button>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
