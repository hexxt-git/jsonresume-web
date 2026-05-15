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
} from '@/store/automationStore';
import type { CombinedAnalysis } from './pipeline/types';
import type { SectionChange } from './shared/SectionDiffReview';
import { AnalyzeView } from './pipeline/AnalyzeView';
import { TailorView } from './pipeline/TailorView';
import { WriteView } from './pipeline/WriteView';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

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
  <div className="text-text-tertiary flex h-full w-full items-center justify-center text-xs">
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
      <div className="bg-bg flex h-full min-h-0 w-full flex-col space-y-2 p-3">
        <h2 className="text-text px-1 text-sm font-semibold">Automation</h2>
        <div className="grid grid-rows-2 gap-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant="ghost"
                onClick={() => setActiveTool(tool.id)}
                className="bg-bg-secondary hover:bg-bg-hover flex h-auto cursor-pointer items-start justify-start gap-3 rounded-xl p-4 pb-12 text-left transition-colors"
              >
                <Icon
                  size={26}
                  variant="Bold"
                  color="currentColor"
                  className="text-text-muted mt-0.5 shrink-0"
                />
                <div className="flex flex-1 flex-col items-start text-left whitespace-normal">
                  <div className="text-text text-sm font-medium">{tool.title}</div>
                  <div className="text-text-muted mt-0.5 max-w-sm text-sm">{tool.desc}</div>
                </div>
              </Button>
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
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-border shrink-0 border-b px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <Stepper steps={STEP_LABELS} currentIndex={stepIndex} onStepClick={handleStepClick} />
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-text-muted hover:text-text-secondary ml-3 shrink-0 px-0 py-0 text-[10px] hover:bg-transparent"
          >
            {step === 'jd' ? 'Back' : 'Start over'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {error && (
            <div className="text-danger bg-danger/10 rounded-2xl px-3 py-2 text-xs">{error}</div>
          )}

          {/* Step 1: Job Description */}
          {step === 'jd' && (
            <div className="space-y-3">
              <p className="text-text-secondary text-xs">
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-text-muted text-[10px] font-medium tracking-wide uppercase">
                    Strictness
                  </span>
                  {(['lenient', 'standard', 'strict'] as AuditStrictness[]).map((s) => (
                    <Button
                      key={s}
                      variant="ghost"
                      onClick={() => setAuditStrictness(s)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] transition-colors',
                        auditStrictness === s
                          ? 'bg-accent hover:bg-accent/90 text-white hover:text-white'
                          : 'text-text-muted border-border hover:text-text-secondary border',
                      )}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={handleAnalyze}
                    disabled={isRunning}
                    className="text-accent ml-auto px-0 py-0 text-[10px] hover:bg-transparent hover:underline"
                  >
                    Re-analyze
                  </Button>
                </div>
                <AnalyzeView analysis={analysis} onEditJd={() => setStep('jd')} />
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="border-accent mb-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
                <p className="text-text-muted text-xs">Analyzing match & ATS compatibility...</p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    abort();
                    setStep('jd');
                  }}
                  className="text-text-muted hover:text-danger mt-1 px-0 py-0 text-[10px] font-bold tracking-widest uppercase hover:bg-transparent"
                >
                  Cancel
                </Button>
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
      <div className="border-border bg-bg-secondary/10 shrink-0 border-t px-6 py-4">
        {step === 'jd' && (
          <Button
            onClick={handleAnalyze}
            disabled={!jd.trim() || isRunning}
            className="w-full py-3.5 font-bold tracking-widest uppercase"
          >
            {isRunning ? 'Analyzing...' : 'Analyze Match'}
          </Button>
        )}

        {step === 'analyze' && analysis && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setStep('write')}
              className="shrink-0 px-4 py-2 text-[10px] font-bold tracking-widest uppercase"
            >
              Skip to write
            </Button>
            <Button
              onClick={() => setStep('tailor')}
              className="flex-1 py-3.5 font-bold tracking-widest uppercase"
            >
              Tailor Resume
            </Button>
          </div>
        )}

        {step === 'tailor' && (
          <Button
            onClick={() => setStep('write')}
            disabled={!tailorReady}
            className="w-full py-3.5 font-bold tracking-widest uppercase"
          >
            Write Materials
          </Button>
        )}

        {step === 'write' && (
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full border-2 py-3.5 font-bold tracking-widest uppercase"
          >
            Apply to Another Job
          </Button>
        )}
      </div>
    </div>
  );
}
