import { useState, useRef, useMemo } from 'react';
import { Stepper } from '../shared/Stepper';
import { JdInput } from '../shared/JdInput';
import { useAiStream } from '../shared/useAiStream';
import { useResumeStore, activeSlot } from '../../../store/resumeStore';
import { captureBeforeDiscreteMutation } from '../../../hooks/useUndoRedo';
import { getProvider } from '../../../lib/ai';
import { useAiStore } from '../../../store/aiStore';
import { resumeToolDeclarations } from '../../../lib/ai/resume-tools';
import type { ResumeSchema } from '../../../types/resume';
import type { ToolCall } from '../../../lib/ai';
import { saveAs } from 'file-saver';
import YAML from 'yaml';
import { getThemeById } from '../../../themes';
import { buildCustomCss } from '../../../store/themeCustomStore';
import {
  useAutomationStore,
  getPromptDirectives,
  getSectionDirective,
  getCoverLetterDirective,
  ALL_SECTIONS,
  SECTION_DISPLAY,
  type Creativity,
} from '../../../store/automationStore';
import type { BatchJob } from '../BatchTailoring/types';
import { BatchProcessing } from '../BatchTailoring/BatchProcessing';
import { BatchResultCard } from '../BatchTailoring/BatchResultCard';
import { BatchFailedCard } from '../BatchTailoring/BatchFailedCard';

/* ── Constants ──────────────────────────────────────────── */

type Step = 'jd' | 'processing' | 'results';
const STEP_LABELS = ['Job Descriptions', 'Process', 'Results'];
const STEP_INDEX: Record<Step, number> = { jd: 0, processing: 1, results: 2 };

import { splitJds } from '../shared/helpers';

const CURRENT_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const TAILOR_SYSTEM = `You are a resume tailoring expert. Today is ${CURRENT_DATE} (${new Date().getFullYear()}).
You will receive a resume and a job description.
Use your tools to tailor the resume. For replace_section, include ALL entries.
Focus on keywords, bullet points, and summary. Do NOT fabricate experience.
IMPORTANT: Only modify content relevant to job tailoring (summary, work highlights, skills, projects, etc.). Do NOT change personal information such as name, email, phone, location, profiles, or any other fields unrelated to tailoring for the job.`;

function buildTitleSystem(resume: ResumeSchema): string {
  const profile = [
    resume.basics?.label,
    resume.basics?.summary?.slice(0, 120),
    resume.skills?.map((s) => s.keywords?.join(', ')).join('; '),
  ]
    .filter(Boolean)
    .join('. ');
  return `Today is ${CURRENT_DATE} (${new Date().getFullYear()}). Extract the job title and company from the text, and check if it is a real job posting relevant to the candidate.
Candidate profile: ${profile}
Return ONLY JSON: {"title":"...","company":"...","relevant":true/false,"reason":"..."}. No markdown.
Set relevant=false if: the text is not a job description, the role is for a completely unrelated field, or the text is gibberish/spam.`;
}

/* ── Component ──────────────────────────────────────────── */

interface Props {
  onBack: () => void;
}

export function BatchPipeline({ onBack }: Props) {
  const [step, setStep] = useState<Step>('jd');
  const [rawInput, setRawInput] = useState('');
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [originalResume, setOriginalResume] = useState<ResumeSchema | null>(null);
  const [generatingCL, setGeneratingCL] = useState<string | null>(null);
  const abortRef = useRef(false);
  const { run, error } = useAiStream();

  const creativity = useAutomationStore((s) => s.creativity);
  const setCreativity = useAutomationStore((s) => s.setCreativity);
  const sectionsToTailor = useAutomationStore((s) => s.sectionsToTailor);
  const toggleSection = useAutomationStore((s) => s.toggleSection);

  const detectedJds = rawInput.trim() ? splitJds(rawInput) : [];

  /* ── Preview HTML ─────────────────────────────────────── */

  const previewHtmls = useMemo(() => {
    if (step !== 'results') return {};
    const slot = activeSlot(useResumeStore.getState());
    const theme = getThemeById(slot.themeId);
    const css = buildCustomCss(slot.customization);
    const map: Record<string, string> = {};
    for (const job of jobs) {
      if (job.status === 'done' && job.result) {
        map[job.id] = theme.render(job.result.tailoredResume, css);
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, jobs]);

  /* ── Batch processing ─────────────────────────────────── */

  const handleStart = async () => {
    const jds = splitJds(rawInput);
    if (!jds.length) return;
    const batchJobs: BatchJob[] = jds.map((jd, i) => ({
      id: `job-${i}`,
      jdText: jd,
      status: 'pending',
    }));
    setJobs(batchJobs);
    setStep('processing');
    abortRef.current = false;

    const slot = activeSlot(useResumeStore.getState());
    const origResume = structuredClone(slot.resume);
    setOriginalResume(origResume);
    const { apiKeys, provider, model } = useAiStore.getState();
    const key = apiKeys[provider] || '';
    const providerObj = getProvider(provider);

    for (let i = 0; i < batchJobs.length; i++) {
      if (abortRef.current) break;
      const job = batchJobs[i];
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'processing' } : j)));

      try {
        /* ── Extract title & validate ── */
        let jobTitle = `Job ${i + 1}`;
        {
          let titleResult = '';
          const titleStream = providerObj.streamChat(
            key,
            [{ id: '1', role: 'user', content: job.jdText, timestamp: Date.now() }],
            buildTitleSystem(origResume),
            undefined,
            model,
          );
          for await (const ev of titleStream) {
            if (ev.type === 'text') titleResult += ev.content;
          }
          const parsed = JSON.parse(
            titleResult
              .trim()
              .replace(/^```(?:json)?\s*\n?/i, '')
              .replace(/\n?```\s*$/, ''),
          );
          if (parsed.relevant === false)
            throw new Error(parsed.reason || 'Not a relevant job description');
          jobTitle = [parsed.title, parsed.company].filter(Boolean).join(' at ') || jobTitle;
        }

        /* ── Tailor resume ── */
        const clonedResume = structuredClone(origResume);
        const messages: {
          id: string;
          role: string;
          content: string;
          toolCalls?: ToolCall[];
          toolName?: string;
          result?: string;
          success?: boolean;
          timestamp: number;
        }[] = [
          {
            id: '1',
            role: 'user',
            content: `Tailor this resume for the job.\n\nJob Description:\n${job.jdText}`,
            timestamp: Date.now(),
          },
        ];

        let tailored = clonedResume;
        for (let loop = 0; loop < 6; loop++) {
          if (abortRef.current) break;
          let text = '';
          const toolCalls: ToolCall[] = [];
          const stream = providerObj.streamChat(
            key,
            messages as any,
            TAILOR_SYSTEM +
              getSectionDirective() +
              getPromptDirectives() +
              `\n\nResume:\n\`\`\`json\n${JSON.stringify(tailored, null, 2)}\n\`\`\``,
            resumeToolDeclarations,
            model,
          );
          for await (const ev of stream) {
            if (ev.type === 'text') text += ev.content;
            else if (ev.type === 'tool_call') toolCalls.push(ev.call);
          }
          messages.push({
            id: String(Date.now()),
            role: 'assistant',
            content: text,
            toolCalls: toolCalls.length ? toolCalls : undefined,
            timestamp: Date.now(),
          });
          if (!toolCalls.length) break;

          for (const call of toolCalls) {
            if (call.name === 'update_summary')
              tailored = {
                ...tailored,
                basics: { ...tailored.basics, summary: call.args.summary as string },
              };
            else if (call.name === 'update_basics_field')
              tailored = {
                ...tailored,
                basics: {
                  ...tailored.basics,
                  [call.args.field as string]: call.args.value,
                },
              };
            else if (call.name === 'replace_section')
              tailored = { ...tailored, [call.args.section as string]: call.args.data };
            else if (call.name === 'add_section_entry') {
              const sec = call.args.section as string;
              tailored = {
                ...tailored,
                [sec]: [
                  ...((tailored[sec as keyof ResumeSchema] as unknown[]) || []),
                  call.args.entry,
                ],
              };
            }
            messages.push({
              id: String(Date.now()),
              role: 'tool_result',
              content: '',
              toolName: call.name,
              result: `Applied ${call.name}`,
              success: true,
              timestamp: Date.now(),
            });
          }
        }
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? { ...j, status: 'done', result: { jobTitle, tailoredResume: tailored } }
              : j,
          ),
        );
      } catch (err) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  status: 'failed',
                  error: err instanceof Error ? err.message : 'Failed',
                }
              : j,
          ),
        );
      }
    }
    setStep('results');
  };

  /* ── Result handlers ──────────────────────────────────── */

  const handleSetCurrent = (resume: ResumeSchema) => {
    captureBeforeDiscreteMutation();
    useResumeStore.getState().setResume(resume);
  };

  const handleSaveSlot = (job: BatchJob) => {
    if (!job.result) return;
    const slot = activeSlot(useResumeStore.getState());
    useResumeStore
      .getState()
      .saveSlot(job.result.jobTitle, job.result.tailoredResume, slot.themeId, slot.customization);
  };

  const handleDownload = (resume: ResumeSchema, name: string, format: string) => {
    const fname = name.replace(/\s+/g, '_');
    if (format === 'json')
      saveAs(
        new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' }),
        `${fname}.json`,
      );
    else if (format === 'yaml')
      saveAs(new Blob([YAML.stringify(resume)], { type: 'text/yaml' }), `${fname}.yaml`);
    else if (format === 'html') {
      const slot = activeSlot(useResumeStore.getState());
      saveAs(
        new Blob([getThemeById(slot.themeId).render(resume, buildCustomCss(slot.customization))], {
          type: 'text/html',
        }),
        `${fname}.html`,
      );
    }
  };

  const handleGenerateCL = async (job: BatchJob) => {
    if (!job.result) return;
    setGeneratingCL(job.id);
    try {
      const cl = await run(
        `Write a professional cover letter for this job based on the candidate's tailored resume. No markdown headers.${getCoverLetterDirective()}${getPromptDirectives()}\n\nResume:\n${JSON.stringify(job.result.tailoredResume, null, 2)}`,
        `Job Description:\n${job.jdText}`,
      );
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, coverLetter: cl } : j)));
    } catch {
      /* ignore */
    }
    setGeneratingCL(null);
  };

  const doneCount = jobs.filter((j) => j.status === 'done').length;
  const failCount = jobs.filter((j) => j.status === 'failed').length;

  const handleReset = () => {
    setStep('jd');
    setRawInput('');
    setJobs([]);
    setOriginalResume(null);
  };

  const handleStepClick = (index: number) => {
    const steps: Step[] = ['jd', 'processing', 'results'];
    if (index < STEP_INDEX[step]) setStep(steps[index]);
  };

  const stepIndex = STEP_INDEX[step];

  /* ── Render ───────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <Stepper steps={STEP_LABELS} currentIndex={stepIndex} onStepClick={handleStepClick} />
          <button
            onClick={step === 'jd' ? onBack : handleReset}
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

          {/* Step 1: JD Input */}
          {step === 'jd' && (
            <div className="space-y-3">
              <p className="text-xs text-text-secondary">
                Paste multiple job descriptions separated by{' '}
                <code className="text-[10px] px-1 py-0.5 bg-bg-tertiary rounded">---</code> or blank
                lines. Each gets a tailored resume.
              </p>

              <JdInput
                value={rawInput}
                onChange={setRawInput}
                rows={10}
                label="Job Descriptions"
                placeholder={
                  'Paste multiple job descriptions.\nSeparate them with --- or === or blank lines.'
                }
                append
              />

              {detectedJds.length > 0 && (
                <p className="text-[10px] text-text-muted">
                  <span className="text-accent font-medium">{detectedJds.length}</span> job
                  description{detectedJds.length !== 1 ? 's' : ''} detected
                </p>
              )}

              {/* Inline settings */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
                    Approach
                  </span>
                  {(['conservative', 'balanced', 'creative'] as Creativity[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCreativity(c)}
                      className={`text-[10px] px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                        creativity === c
                          ? 'bg-accent text-white'
                          : 'border border-border text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
                <details className="group">
                  <summary className="text-[10px] text-text-muted cursor-pointer hover:text-text-secondary select-none">
                    Sections to modify
                  </summary>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1 mt-1.5 pl-1">
                    {ALL_SECTIONS.map((s) => (
                      <label
                        key={s}
                        className="flex items-center gap-1.5 text-[10px] text-text-secondary cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={sectionsToTailor.includes(s)}
                          onChange={() => toggleSection(s)}
                          className="rounded border-border-input accent-accent w-3 h-3"
                        />
                        {SECTION_DISPLAY[s] || s}
                      </label>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && (
            <BatchProcessing
              jobs={jobs}
              doneCount={doneCount}
              failCount={failCount}
              onStop={() => {
                abortRef.current = true;
              }}
            />
          )}

          {/* Step 3: Results */}
          {step === 'results' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  <span className="text-diff-add">{doneCount} succeeded</span>
                  {failCount > 0 && (
                    <span className="text-diff-rm"> &middot; {failCount} failed</span>
                  )}
                </span>
              </div>

              {jobs
                .filter((j) => j.status === 'done')
                .map((job) => (
                  <BatchResultCard
                    key={job.id}
                    job={job}
                    previewHtml={previewHtmls[job.id] || ''}
                    originalResume={originalResume!}
                    generatingCL={generatingCL === job.id}
                    onSetCurrent={handleSetCurrent}
                    onSaveSlot={handleSaveSlot}
                    onDownload={handleDownload}
                    onGenerateCL={handleGenerateCL}
                  />
                ))}

              {jobs
                .filter((j) => j.status === 'failed')
                .map((job) => (
                  <BatchFailedCard key={job.id} job={job} />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-bg">
        {step === 'jd' && (
          <button
            onClick={handleStart}
            disabled={!detectedJds.length}
            className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process{detectedJds.length > 0 ? ` (${detectedJds.length} jobs)` : ' All'}
          </button>
        )}
        {step === 'results' && (
          <button
            onClick={handleReset}
            className="w-full text-xs py-2.5 border border-border rounded-lg hover:bg-bg-hover cursor-pointer text-text-secondary"
          >
            New Batch
          </button>
        )}
      </div>
    </div>
  );
}
