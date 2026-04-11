import { useState, useRef } from 'react';
import { ToolShell } from '../shared/ToolShell';
import { useAiStream } from '../shared/useAiStream';
import { CopyableOutput } from '../shared/CopyableOutput';
import { BlockDiffView } from '../../editor/DiffView';
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

interface BatchJob {
  id: string;
  jdText: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  result?: { jobTitle: string; tailoredResume: ResumeSchema };
  coverLetter?: string;
  error?: string;
}

type Step = 'input' | 'processing' | 'results';

function splitJds(text: string): string[] {
  return text
    .split(/\n(?:---+|===+)\n|\n{3,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

import { JdInput } from '../shared/JdInput';
import { Stepper } from '../shared/Stepper';

const TAILOR_SYSTEM = `You are a resume tailoring expert. You will receive a resume and a job description.
Use your tools to tailor the resume. For replace_section, include ALL entries.
Focus on keywords, bullet points, and summary. Do NOT fabricate experience.`;

const TITLE_SYSTEM = `Extract the job title and company from this job description. Return ONLY JSON: {"title":"...","company":"..."}. No markdown.`;

export default function BatchTailoringTool({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('input');
  const [rawInput, setRawInput] = useState('');
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingCL, setGeneratingCL] = useState<string | null>(null);
  const abortRef = useRef(false);
  const { run, error } = useAiStream();

  const detectedJds = rawInput.trim() ? splitJds(rawInput) : [];

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
    const originalResume = structuredClone(slot.resume);
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
            TITLE_SYSTEM,
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
          jobTitle = [parsed.title, parsed.company].filter(Boolean).join(' at ') || jobTitle;
        } catch {
          /* default title */
        }

        const clonedResume = structuredClone(originalResume);
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
            TAILOR_SYSTEM + `\n\nResume:\n\`\`\`json\n${JSON.stringify(tailored, null, 2)}\n\`\`\``,
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
        `Write a professional cover letter for this job based on the candidate's tailored resume. No markdown headers.\n\nResume:\n${JSON.stringify(job.result.tailoredResume, null, 2)}`,
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

  return (
    <ToolShell
      title="Batch Tailoring"
      onBack={onBack}
      footer={
        step === 'input' ? (
          <button
            onClick={handleStart}
            disabled={!detectedJds.length}
            className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            Start Batch{detectedJds.length > 0 ? ` (${detectedJds.length})` : ''}
          </button>
        ) : step === 'results' ? (
          <button
            onClick={() => {
              setStep('input');
              setJobs([]);
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

        {/* Input */}
        {step === 'input' && (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Paste or upload multiple job descriptions separated by --- or blank lines. Each will
              be tailored as a separate resume.
            </p>
            <JdInput
              value={rawInput}
              onChange={setRawInput}
              rows={10}
              label="Job Descriptions"
              placeholder={
                'Paste multiple job descriptions.\nSeparate them with --- or === or blank lines.'
              }
            />
            {detectedJds.length > 0 && (
              <p className="text-[10px] text-text-muted">
                <span className="text-accent font-medium">{detectedJds.length}</span> job
                description{detectedJds.length !== 1 ? 's' : ''} detected
              </p>
            )}
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                Processing {doneCount + failCount} of {jobs.length}...
              </span>
              <button
                onClick={() => {
                  abortRef.current = true;
                }}
                className="text-[10px] text-danger hover:underline cursor-pointer"
              >
                Stop
              </button>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${((doneCount + failCount) / jobs.length) * 100}%` }}
              />
            </div>
            <div className="space-y-1">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md text-xs"
                >
                  {job.status === 'pending' && (
                    <span className="w-2 h-2 rounded-full bg-border shrink-0" />
                  )}
                  {job.status === 'processing' && (
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
                  )}
                  {job.status === 'done' && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: 'var(--diff-add-text)' }}
                    />
                  )}
                  {job.status === 'failed' && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: 'var(--diff-rm-text)' }}
                    />
                  )}
                  <span className="text-text-secondary truncate flex-1">
                    {job.result?.jobTitle || job.jdText.slice(0, 60) + '...'}
                  </span>
                  {job.status === 'failed' && (
                    <span className="text-[10px]" style={{ color: 'var(--diff-rm-text)' }}>
                      failed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                <span style={{ color: 'var(--diff-add-text)' }}>{doneCount} succeeded</span>
                {failCount > 0 && (
                  <span style={{ color: 'var(--diff-rm-text)' }}> · {failCount} failed</span>
                )}
              </span>
              <span className="text-[10px] text-text-muted">&nbsp;</span>
            </div>

            {jobs
              .filter((j) => j.status === 'done')
              .map((job) => (
                <div key={job.id} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary">
                    <span className="text-xs font-medium text-text">{job.result!.jobTitle}</span>
                  </div>
                  <div className="px-3 py-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                      className="text-[10px] px-2 py-1 bg-bg-tertiary rounded text-text-muted hover:text-text-secondary cursor-pointer"
                    >
                      {expandedId === job.id ? 'Hide diff' : 'Preview'}
                    </button>
                    {['json', 'yaml', 'html'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() =>
                          handleDownload(job.result!.tailoredResume, job.result!.jobTitle, fmt)
                        }
                        className="text-[10px] px-2 py-1 bg-bg-tertiary rounded text-text-muted hover:text-text-secondary cursor-pointer uppercase"
                      >
                        {fmt}
                      </button>
                    ))}
                    <button
                      onClick={() => handleSetCurrent(job.result!.tailoredResume)}
                      className="text-[10px] px-2 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer"
                    >
                      Set as current
                    </button>
                    <button
                      onClick={() => handleSaveSlot(job)}
                      className="text-[10px] px-2 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer"
                    >
                      Save as slot
                    </button>
                    <button
                      onClick={() => handleGenerateCL(job)}
                      disabled={generatingCL === job.id}
                      className="text-[10px] px-2 py-1 bg-bg-tertiary rounded text-text-muted hover:text-text-secondary cursor-pointer disabled:opacity-50"
                    >
                      {generatingCL === job.id
                        ? '...'
                        : job.coverLetter
                          ? 'Redo CL'
                          : 'Cover letter'}
                    </button>
                  </div>
                  {expandedId === job.id && (
                    <div className="px-3 pb-3">
                      <BlockDiffView
                        oldText={JSON.stringify(
                          activeSlot(useResumeStore.getState()).resume,
                          null,
                          2,
                        )}
                        newText={JSON.stringify(job.result!.tailoredResume, null, 2)}
                      />
                    </div>
                  )}
                  {job.coverLetter && (
                    <div className="px-3 pb-3">
                      <CopyableOutput content={job.coverLetter} label="Cover Letter" />
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
