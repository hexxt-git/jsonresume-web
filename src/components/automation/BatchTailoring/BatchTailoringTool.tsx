import { useState, useRef, useMemo } from 'react';
import { ToolShell } from '../shared/ToolShell';
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
import { Stepper } from '../shared/Stepper';
import { AutomationSettings, SettingsFooterButton } from '../shared/AutomationSettings';
import {
  getPromptDirectives,
  getSectionDirective,
  getCoverLetterDirective,
} from '../../../store/automationStore';
import type { BatchJob } from './types';
import { BatchInputStep } from './BatchInputStep';
import { BatchProcessing } from './BatchProcessing';
import { BatchResultCard } from './BatchResultCard';
import { BatchFailedCard } from './BatchFailedCard';

/* ── Helpers ──────────────────────────────────────────────── */

type Step = 'input' | 'processing' | 'results';

function splitJds(text: string): string[] {
  return text
    .split(/\n(?:---+|===+)\n|\n{3,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

/* ── Prompts ──────────────────────────────────────────────── */

const CURRENT_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const TAILOR_SYSTEM = `You are a resume tailoring expert. Today is ${CURRENT_DATE} (${new Date().getFullYear()}).
You will receive a resume and a job description.
Use your tools to tailor the resume. For replace_section, include ALL entries.
Focus on keywords, bullet points, and summary. Do NOT fabricate experience.`;

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

/* ── Component ────────────────────────────────────────────── */

export default function BatchTailoringTool({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('input');
  const [rawInput, setRawInput] = useState('');
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [originalResume, setOriginalResume] = useState<ResumeSchema | null>(null);
  const [generatingCL, setGeneratingCL] = useState<string | null>(null);
  const abortRef = useRef(false);
  const { run, error } = useAiStream();

  const detectedJds = rawInput.trim() ? splitJds(rawInput) : [];

  /* ── Preview HTML memoization ──────────────────────────── */

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

  /* ── Handlers ───────────────────────────────────────────── */

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
        let jobTitle = `Job ${i + 1}`;
        try {
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
          if (parsed.relevant === false) {
            throw new Error(parsed.reason || 'Job description is not relevant to your profile');
          }
          jobTitle = [parsed.title, parsed.company].filter(Boolean).join(' at ') || jobTitle;
        } catch (titleErr) {
          if (titleErr instanceof Error && titleErr.message.includes('not relevant'))
            throw titleErr;
        }

        const clonedResume = structuredClone(origResume);
        const messages: any[] = [
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
            messages,
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
                basics: { ...tailored.basics, [call.args.field as string]: call.args.value },
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
              ? { ...j, status: 'failed', error: err instanceof Error ? err.message : 'Failed' }
              : j,
          ),
        );
      }
    }
    setStep('results');
  };

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

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <ToolShell
      title="Batch Tailoring"
      onBack={onBack}
      headerExtra={<AutomationSettings />}
      footer={
        step === 'input' ? (
          <div className="flex gap-2">
            <SettingsFooterButton />
            <button
              onClick={handleStart}
              disabled={!detectedJds.length}
              className="flex-1 text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              Start Batch{detectedJds.length > 0 ? ` (${detectedJds.length})` : ''}
            </button>
          </div>
        ) : step === 'results' ? (
          <button
            onClick={() => {
              setStep('input');
              setJobs([]);
              setOriginalResume(null);
            }}
            className="w-full text-xs py-2.5 border border-border rounded-lg hover:bg-bg-hover cursor-pointer text-text-secondary"
          >
            New Batch
          </button>
        ) : undefined
      }
    >
      <div className="p-4 space-y-4">
        <Stepper
          steps={['Upload JDs', 'Processing', 'Results']}
          currentIndex={step === 'input' ? 0 : step === 'processing' ? 1 : 2}
        />

        {error && (
          <div className="text-xs text-danger bg-danger/10 rounded-md px-3 py-2">{error}</div>
        )}

        {step === 'input' && (
          <BatchInputStep
            rawInput={rawInput}
            onChange={setRawInput}
            detectedCount={detectedJds.length}
          />
        )}

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

        {step === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                <span style={{ color: 'var(--diff-add-text)' }}>{doneCount} succeeded</span>
                {failCount > 0 && (
                  <span style={{ color: 'var(--diff-rm-text)' }}> · {failCount} failed</span>
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
    </ToolShell>
  );
}
