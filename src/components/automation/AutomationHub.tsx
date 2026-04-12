import { useState, lazy, Suspense } from 'react';
import { Magicpen, Layer } from 'iconsax-react';
import { JdInput } from './shared/JdInput';
import { Stepper } from './shared/Stepper';
import { useAiStream } from './shared/useAiStream';
import {
  useAutomationStore,
  getPromptDirectives,
  getAuditDirective,
  type AuditStrictness,
} from '../../store/automationStore';
import type { CombinedAnalysis } from './pipeline/types';
import type { SectionChange } from './shared/SectionDiffReview';
import { AnalyzeView } from './pipeline/AnalyzeView';
import { TailorView } from './pipeline/TailorView';
import { WriteView } from './pipeline/WriteView';

const BatchPipeline = lazy(() =>
  import('./pipeline/BatchPipeline').then((m) => ({ default: m.BatchPipeline })),
);

/* ── Hub cards ──────────────────────────────────────────── */

const TOOLS = [
  {
    id: 'single' as const,
    title: 'Apply to Job',
    desc: 'Analyze match, tailor your resume, and generate cover letters and emails for a single position.',
    icon: Magicpen,
  },
  {
    id: 'batch' as const,
    title: 'Batch Tailoring',
    desc: 'Paste multiple job descriptions and get a tailored resume for each, ready to download.',
    icon: Layer,
  },
] as const;

/* ── Single pipeline steps ──────────────────────────────── */

type Step = 'jd' | 'analyze' | 'tailor' | 'write';

const STEP_LABELS = ['Job Description', 'Analyze', 'Tailor', 'Write'];
const STEP_INDEX: Record<Step, number> = { jd: 0, analyze: 1, tailor: 2, write: 3 };
const INDEX_STEP: Step[] = ['jd', 'analyze', 'tailor', 'write'];

/* ── Prompt ─────────────────────────────────────────────── */

const CURRENT_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const COMBINED_PROMPT = `You are an expert resume analyst and ATS specialist. Today is ${CURRENT_DATE} (${new Date().getFullYear()}).
Analyze this resume against the provided job description in two dimensions:
1. JOB MATCH: How well does this resume match the job requirements?
2. ATS AUDIT: How well will this resume perform in applicant tracking systems?

First, determine if the input is a real job description relevant to the candidate's field. Set "relevant" to false if it's not a job posting, is gibberish, or is for a completely unrelated field (e.g. a nurse JD for a software engineer).

Return ONLY valid JSON (no markdown fences):
{
  "relevant": <boolean>,
  "relevanceReason": "<why not relevant, omit if relevant>",
  "match": {
    "overallScore": <0-100>,
    "matchingKeywords": ["keyword1", ...],
    "missingKeywords": ["keyword1", ...],
    "sections": {
      "summary": { "score": <number>, "analysis": "<1 short sentence>" },
      "work": { "score": <number>, "analysis": "<1 short sentence>" },
      "skills": { "score": <number>, "analysis": "<1 short sentence>" },
      "education": { "score": <number>, "analysis": "<1 short sentence>" },
      "projects": { "score": <number>, "analysis": "<1 short sentence>" }
    },
    "recommendations": ["rec1", ...]
  },
  "audit": {
    "overallScore": <0-100>,
    "categories": [
      { "id": "keywords", "label": "Keyword Optimization", "score": <number>, "issues": [{ "id": "kw-1", "severity": "high|medium|low", "description": "...", "suggestion": "...", "fixable": true, "section": "skills" }] },
      { "id": "action-verbs", "label": "Action Verbs & Impact", "score": <number>, "issues": [...] },
      { "id": "quantification", "label": "Quantified Achievements", "score": <number>, "issues": [...] },
      { "id": "formatting", "label": "ATS Formatting", "score": <number>, "issues": [...] },
      { "id": "completeness", "label": "Section Completeness", "score": <number>, "issues": [...] }
    ]
  }
}
If not relevant, set scores to 0 and leave arrays empty.
Keep analysis sentences under 15 words. Keep suggestions under 20 words.`;

/* ── Fallback ───────────────────────────────────────────── */

const Fallback = (
  <div className="h-full flex items-center justify-center text-xs text-text-tertiary">
    Loading...
  </div>
);

/* ── Component ──────────────────────────────────────────── */

export default function AutomationHub() {
  const { run, isRunning, error, setError, abort, getResumeContext } = useAiStream();

  const [activeTool, setActiveTool] = useState<'single' | 'batch' | null>(null);
  const [step, setStep] = useState<Step>('jd');
  const [jd, setJd] = useState('');
  const [analysis, setAnalysis] = useState<CombinedAnalysis | null>(null);
  const [changes, setChanges] = useState<SectionChange[]>([]);
  const [tailorReady, setTailorReady] = useState(false);

  const auditStrictness = useAutomationStore((s) => s.auditStrictness);
  const setAuditStrictness = useAutomationStore((s) => s.setAuditStrictness);

  /* ── Hub ──────────────────────────────────────────────── */

  if (!activeTool) {
    return (
      <div className="h-full flex flex-col p-3 space-y-2">
        <h2 className="text-sm font-semibold text-text">Automation</h2>
        <div className="grid grid-rows-2 gap-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="flex items-start gap-3 p-4 pb-24 rounded-lg bg-bg-secondary cursor-pointer active:opacity-80 text-left"
              >
                <Icon
                  size={20}
                  variant="Bold"
                  color="currentColor"
                  className="text-text-muted shrink-0 mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-text">{tool.title}</div>
                  <div className="text-xs text-text-muted mt-0.5 max-w-80">{tool.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Batch pipeline ───────────────────────────────────── */

  if (activeTool === 'batch') {
    return (
      <Suspense fallback={Fallback}>
        <BatchPipeline onBack={() => setActiveTool(null)} />
      </Suspense>
    );
  }

  /* ── Single pipeline actions ──────────────────────────── */

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    setStep('analyze');
    setError(null);
    setAnalysis(null);
    setChanges([]);
    setTailorReady(false);
    try {
      const resumeJson = getResumeContext();
      const result = await run(
        COMBINED_PROMPT +
          getAuditDirective() +
          getPromptDirectives() +
          `\n\nResume:\n\`\`\`json\n${resumeJson}\n\`\`\``,
        `Job Description:\n${jd}`,
      );
      const cleaned = result.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
      const data = JSON.parse(cleaned) as CombinedAnalysis;
      if (!data.relevant) {
        setError(data.relevanceReason || "This doesn't appear to be a relevant job description.");
        setStep('jd');
        return;
      }
      setAnalysis(data);
    } catch {
      setError('Analysis failed. Try again.');
      setStep('jd');
    }
  };

  const handleStepClick = (index: number) => {
    if (index < STEP_INDEX[step]) setStep(INDEX_STEP[index]);
  };

  const handleReset = () => {
    setStep('jd');
    setJd('');
    setAnalysis(null);
    setChanges([]);
    setTailorReady(false);
    setError(null);
  };

  const handleBack = () => {
    if (step === 'jd') {
      setActiveTool(null);
      handleReset();
    } else {
      const prev = INDEX_STEP[STEP_INDEX[step] - 1];
      if (prev) setStep(prev);
    }
  };

  const stepIndex = STEP_INDEX[step];

  /* ── Single pipeline render ───────────────────────────── */

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <Stepper steps={STEP_LABELS} currentIndex={stepIndex} onStepClick={handleStepClick} />
          <button
            onClick={handleBack}
            className="text-[10px] text-text-muted hover:text-text-secondary cursor-pointer shrink-0 ml-3"
          >
            {step === 'jd' ? 'Back' : 'Start over'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {error && (
            <div className="text-xs text-danger bg-danger/10 rounded-md px-3 py-2">{error}</div>
          )}

          {/* Step 1: Job Description */}
          {step === 'jd' && (
            <div className="space-y-3">
              <p className="text-xs text-text-secondary">
                Paste a job description to analyze your match, tailor your resume, and generate
                application materials.
              </p>
              <JdInput value={jd} onChange={setJd} rows={10} />
            </div>
          )}

          {/* Step 2: Analyze */}
          {step === 'analyze' &&
            (analysis ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
                    Strictness
                  </span>
                  {(['lenient', 'standard', 'strict'] as AuditStrictness[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setAuditStrictness(s)}
                      className={`text-[10px] px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                        auditStrictness === s
                          ? 'bg-accent text-white'
                          : 'border border-border text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  <button
                    onClick={handleAnalyze}
                    disabled={isRunning}
                    className="text-[10px] text-accent hover:underline cursor-pointer ml-auto disabled:opacity-50"
                  >
                    Re-analyze
                  </button>
                </div>
                <AnalyzeView analysis={analysis} onEditJd={() => setStep('jd')} />
              </>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs text-text-muted">Analyzing match & ATS compatibility...</p>
                <button
                  onClick={() => {
                    abort();
                    setStep('jd');
                  }}
                  className="text-[10px] text-text-muted hover:text-danger cursor-pointer mt-1"
                >
                  Cancel
                </button>
              </div>
            ))}

          {/* Step 3: Tailor */}
          {step === 'tailor' && analysis && (
            <TailorView
              jd={jd}
              analysis={analysis}
              changes={changes}
              onChangesGenerated={setChanges}
              onReady={() => setTailorReady(true)}
            />
          )}

          {/* Step 4: Write */}
          {step === 'write' && analysis && <WriteView jd={jd} analysis={analysis} />}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-bg">
        {step === 'jd' && (
          <button
            onClick={handleAnalyze}
            disabled={!jd.trim() || isRunning}
            className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Analyzing...' : 'Analyze Match'}
          </button>
        )}

        {step === 'analyze' && analysis && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep('write')}
              className="text-[10px] text-text-muted hover:text-text-secondary cursor-pointer shrink-0"
            >
              Skip to write
            </button>
            <button
              onClick={() => setStep('tailor')}
              className="flex-1 text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer"
            >
              Tailor Resume
            </button>
          </div>
        )}

        {step === 'tailor' && (
          <button
            onClick={() => setStep('write')}
            disabled={!tailorReady}
            className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Write Materials
          </button>
        )}

        {step === 'write' && (
          <button
            onClick={handleReset}
            className="w-full text-xs py-2.5 border border-border rounded-lg hover:bg-bg-hover cursor-pointer text-text-secondary"
          >
            Apply to Another Job
          </button>
        )}
      </div>
    </div>
  );
}
