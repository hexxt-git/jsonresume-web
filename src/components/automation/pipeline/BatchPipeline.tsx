import { useState, useRef, useMemo } from 'react';
import { Stepper } from '../shared/Stepper';
import { JdInput } from '../shared/JdInput';
import { useAiStream } from '../shared/useAiStream';
import { useResumeStore, activeSlot } from '@/store/resumeStore';
import { captureBeforeDiscreteMutation } from '@/hooks/useUndoRedo';
import { getProvider } from '@/lib/ai';
import { useAiStore } from '@/store/aiStore';
import { resumeToolDeclarations } from '@/lib/ai/resume-tools';
import type { ResumeSchema } from '@/types/resume';
import type { ToolCall } from '@/lib/ai';
import { saveAs } from 'file-saver';
import YAML from 'yaml';
import { getThemeById } from '@/themes';
import { buildCustomCss } from '@/store/themeCustomStore';
import {
  useAutomationStore,
  getPromptDirectives,
  getSectionDirective,
  getCoverLetterDirective,
  ALL_SECTIONS,
  SECTION_DISPLAY,
  type Creativity,
} from '@/store/automationStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Checkbox } from '@/components/ui/Checkbox';
import { ScrollArea } from '@/components/ui/ScrollArea';
import type { BatchJob } from '../BatchTailoring/types';
import { BatchProcessing } from '../BatchTailoring/BatchProcessing';
import { BatchResultCard } from '../BatchTailoring/BatchResultCard';
import { BatchFailedCard } from '../BatchTailoring/BatchFailedCard';
import { splitJds } from '../shared/helpers';
import { filterVisible } from '@/utils/resume';

/* ── Constants ──────────────────────────────────────────── */

type Step = 'jd' | 'processing' | 'results';
const STEP_LABELS = ['Job Descriptions', 'Process', 'Results'];
const STEP_INDEX: Record<Step, number> = { jd: 0, processing: 1, results: 2 };

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
        map[job.id] = theme.render(filterVisible(job.result.tailoredResume), css);
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
        new Blob(
          [
            getThemeById(slot.themeId).render(
              filterVisible(resume),
              buildCustomCss(slot.customization),
            ),
          ],
          {
            type: 'text/html',
          },
        ),
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
    <div className="bg-bg flex h-full flex-col">
      {/* Header */}
      <div className="bg-bg-secondary/20 shrink-0 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <Stepper steps={STEP_LABELS} currentIndex={stepIndex} onStepClick={handleStepClick} />
          <Button
            variant="outline"
            size="sm"
            onClick={step === 'jd' ? onBack : handleReset}
            className="ml-4 shrink-0"
          >
            {step === 'jd' ? 'Back' : 'Start over'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          {error && (
            <Badge variant="danger" className="w-full justify-start rounded-2xl px-6 py-4 text-xs">
              {error}
            </Badge>
          )}

          {/* Step 1: JD Input */}
          {step === 'jd' && (
            <div className="space-y-6">
              <div className="bg-bg-secondary/30 border-border/50 space-y-4 rounded-2xl border p-5">
                <p className="text-text-secondary text-sm leading-relaxed font-medium">
                  Paste multiple job descriptions separated by{' '}
                  <code className="bg-bg-tertiary rounded-full px-2 py-0.5 text-[11px] font-bold">
                    ---
                  </code>{' '}
                  or blank lines. Each gets a tailored resume variant.
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
                  <div className="flex justify-center">
                    <Badge variant="accent" className="px-4 py-1">
                      {detectedJds.length} {detectedJds.length !== 1 ? 'positions' : 'position'}{' '}
                      detected
                    </Badge>
                  </div>
                )}
              </div>

              {/* Inline settings */}
              <div className="bg-bg-secondary/30 border-border/50 space-y-6 rounded-3xl border p-6">
                <div className="flex flex-wrap items-center gap-6">
                  <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
                    Approach
                  </span>
                  <Tabs
                    value={creativity}
                    onChange={(v) => setCreativity(v as Creativity)}
                    options={[
                      { value: 'conservative', label: 'conservative' },
                      { value: 'balanced', label: 'balanced' },
                      { value: 'creative', label: 'creative' },
                    ]}
                    size="sm"
                  />
                </div>

                <details className="group" open>
                  <summary className="text-text-muted hover:text-text-secondary flex cursor-pointer items-center gap-2 text-[10px] font-bold tracking-widest uppercase select-none">
                    Sections to modify
                  </summary>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 pl-3 sm:grid-cols-3 lg:grid-cols-4">
                    {ALL_SECTIONS.map((s) => (
                      <label
                        key={s}
                        className="text-text-secondary group/item hover:text-accent flex cursor-pointer items-center gap-2.5 text-[11px] font-medium transition-colors select-none"
                      >
                        <Checkbox
                          checked={sectionsToTailor.includes(s)}
                          onChange={() => toggleSection(s)}
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
                <span className="text-text-muted text-xs">
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
      </ScrollArea>

      {/* Footer */}
      <div className="bg-bg-secondary/10 shrink-0 border-t px-8 py-6">
        {step === 'jd' && (
          <Button
            onClick={handleStart}
            disabled={!detectedJds.length}
            size="lg"
            fullWidth
            className="font-bold tracking-widest uppercase disabled:opacity-30"
          >
            Process{detectedJds.length > 0 ? ` (${detectedJds.length} positions)` : ' All'}
          </Button>
        )}
        {step === 'results' && (
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleReset}
            className="text-text-secondary font-bold tracking-widest uppercase"
          >
            New Batch
          </Button>
        )}
      </div>
    </div>
  );
}
