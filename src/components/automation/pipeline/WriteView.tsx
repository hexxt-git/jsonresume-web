import { useState } from 'react';
import { useAiStream } from '../shared/useAiStream';
import { CopyableOutput } from '../shared/CopyableOutput';
import { CloseCircle } from 'iconsax-react';
import {
  useAutomationStore,
  getPromptDirectives,
  getCoverLetterDirective,
  type Tone,
  type CoverLetterLength,
} from '@/store/automationStore';
import type { CombinedAnalysis } from './types';

/* ── Constants ──────────────────────────────────────────── */

type Tab = 'cover-letter' | 'questions' | 'email';
const TABS: [Tab, string][] = [
  ['cover-letter', 'Cover Letter'],
  ['questions', 'Questions'],
  ['email', 'Email'],
];
const EMAIL_TYPES = ['Follow-up', 'Thank You', 'Inquiry', 'Negotiation'];

const CURRENT_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/* ── Component ──────────────────────────────────────────── */

interface Props {
  jd: string;
  analysis: CombinedAnalysis;
}

export function WriteView({ jd, analysis }: Props) {
  const { run, runStreaming, isRunning, error, setError, getResumeContext } = useAiStream();
  const [tab, setTab] = useState<Tab>('cover-letter');

  // Cover letter
  const [coverLetter, setCoverLetter] = useState('');

  // Questions
  const [questionList, setQuestionList] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);

  // Email
  const [emailType, setEmailType] = useState('Follow-up');
  const [emailContext, setEmailContext] = useState('');
  const [emailDraft, setEmailDraft] = useState('');

  // Settings
  const tone = useAutomationStore((s) => s.tone);
  const setTone = useAutomationStore((s) => s.setTone);
  const coverLetterLength = useAutomationStore((s) => s.coverLetterLength);
  const setCoverLetterLength = useAutomationStore((s) => s.setCoverLetterLength);

  const strengthsContext =
    analysis.match.matchingKeywords.length > 0
      ? `\nThe candidate's key strengths for this role: ${analysis.match.matchingKeywords.slice(0, 10).join(', ')}.`
      : '';

  /* ── Handlers ─────────────────────────────────────────── */

  const handleCoverLetter = async () => {
    setCoverLetter('');
    setError(null);
    await runStreaming(
      `You are an expert cover letter writer. Today is ${CURRENT_DATE} (${new Date().getFullYear()}). Write a cover letter for the job below based on the candidate's resume. Write flowing paragraphs, not bullet points. No markdown headers.${strengthsContext}${getCoverLetterDirective()}${getPromptDirectives()}\n\nResume:\n${getResumeContext()}`,
      `Job Description:\n${jd}\n\nWrite the cover letter.`,
      (text) => setCoverLetter(text),
    );
  };

  const handleQuestions = async () => {
    setAnswers([]);
    setError(null);
    try {
      const result = await run(
        `You are a career consultant. Today is ${CURRENT_DATE} (${new Date().getFullYear()}). Answer application questions based on the candidate's resume and job description. Return ONLY valid JSON array (no markdown fences): [{"question":"...","answer":"..."},...].${getPromptDirectives()}\n\nResume:\n${getResumeContext()}\n\nJob Description:\n${jd}`,
        `Answer these application questions:\n${questionList.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
      );
      const cleaned = result.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) setAnswers(parsed);
    } catch {
      setError('Failed to parse answers. Try again.');
    }
  };

  const handleEmail = async () => {
    setEmailDraft('');
    setError(null);
    await runStreaming(
      `You are a professional email writer. Today is ${CURRENT_DATE} (${new Date().getFullYear()}). Draft a ${emailType.toLowerCase()} email related to a job application. Base it on the candidate's resume and job description. Keep it concise and professional.${getPromptDirectives()}\n\nResume:\n${getResumeContext()}\n\nJob Description:\n${jd}`,
      `Write a ${emailType.toLowerCase()} email.${emailContext ? `\n\nAdditional context: ${emailContext}` : ''}`,
      (text) => setEmailDraft(text),
    );
  };

  /* ── Render ───────────────────────────────────────────── */

  return (
    <div className="space-y-6 p-4">
      {/* Inline settings */}
      <div className="bg-bg-secondary/30 border-border/50 space-y-6 rounded-2xl border p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
              Tone
            </span>
            <div className="bg-bg border-border/50 flex gap-2 rounded-full border p-1">
              {(['formal', 'professional', 'casual'] as Tone[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-bold tracking-tight uppercase transition-all ${
                    tone === t
                      ? 'bg-accent text-white'
                      : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {tab === 'cover-letter' && (
            <div className="border-border/50 flex items-center gap-2 border-l pl-6">
              <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
                Length
              </span>
              <div className="bg-bg border-border/50 flex gap-2 rounded-full border p-1">
                {(['brief', 'standard', 'detailed'] as CoverLetterLength[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setCoverLetterLength(l)}
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-bold tracking-tight uppercase transition-all ${
                      coverLetterLength === l
                        ? 'bg-accent text-white'
                        : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-bg-secondary/50 border-border/50 flex gap-2 rounded-full border p-1">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 cursor-pointer rounded-full py-2 text-xs font-bold tracking-widest uppercase transition-all ${
              tab === id
                ? 'bg-bg text-accent border-accent/10 border'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-danger bg-danger/10 border-danger/20 rounded-2xl border px-6 py-4 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Cover Letter Tab */}
      {tab === 'cover-letter' && (
        <div className="space-y-6">
          {!coverLetter && !isRunning && (
            <div className="bg-bg-secondary/20 border-border/50 rounded-3xl border border-dashed py-10 text-center">
              <p className="text-text-muted text-sm font-medium italic">
                Generate a cover letter tailored to this position and your resume.
              </p>
            </div>
          )}
          {coverLetter && <CopyableOutput content={coverLetter} label="Cover Letter" />}
          <button
            onClick={handleCoverLetter}
            disabled={isRunning}
            className="bg-accent w-full cursor-pointer rounded-full py-3.5 text-xs font-bold tracking-widest text-white uppercase transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isRunning
              ? 'Generating...'
              : coverLetter
                ? 'Regenerate Cover Letter'
                : 'Generate Cover Letter'}
          </button>
        </div>
      )}

      {/* Questions Tab */}
      {tab === 'questions' && (
        <div className="space-y-6">
          <div className="border-border bg-bg-input focus-within:ring-accent/10 focus-within:border-accent space-y-3 rounded-2xl border p-4 transition-all focus-within:ring-4">
            {questionList.map((q, i) => (
              <div
                key={i}
                className="bg-bg border-border/50 text-text-secondary group flex items-start gap-3 rounded-xl border px-4 py-3 text-xs font-medium transition-all"
              >
                <span className="flex-1 leading-relaxed">{q}</span>
                <button
                  type="button"
                  onClick={() => setQuestionList(questionList.filter((_, j) => j !== i))}
                  className="bg-bg-secondary text-text-muted hover:text-danger flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all"
                >
                  <CloseCircle size={14} variant="Bold" color="currentColor" />
                </button>
              </div>
            ))}
            <input
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && questionInput.trim()) {
                  e.preventDefault();
                  setQuestionList([...questionList, questionInput.trim()]);
                  setQuestionInput('');
                }
              }}
              placeholder={
                questionList.length === 0
                  ? 'Type a question and press Enter...'
                  : 'Add another question...'
              }
              className="text-text placeholder:text-text-muted/50 w-full bg-transparent px-2 py-1 text-sm font-medium outline-none"
            />
          </div>
          {answers.length > 0 && (
            <div className="space-y-6">
              {answers.map((a, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-text ml-1 text-xs font-bold tracking-widest uppercase">
                    {a.question}
                  </p>
                  <CopyableOutput content={a.answer} format="plain" />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleQuestions}
            disabled={!questionList.length || isRunning}
            className="bg-accent w-full cursor-pointer rounded-full py-3.5 text-xs font-bold tracking-widest text-white uppercase transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isRunning ? 'Generating...' : 'Generate Answers'}
          </button>
        </div>
      )}

      {/* Email Tab */}
      {tab === 'email' && (
        <div className="space-y-6">
          <div className="bg-bg-secondary/30 border-border/50 scrollbar-none flex gap-2 overflow-x-auto rounded-full border p-2">
            {EMAIL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setEmailType(t)}
                className={`cursor-pointer rounded-full px-5 py-2 text-[10px] font-bold tracking-tight whitespace-nowrap uppercase transition-all ${
                  emailType === t
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            value={emailContext}
            onChange={(e) => setEmailContext(e.target.value)}
            placeholder="Additional context (optional)..."
            rows={3}
            className="bg-bg-input text-text focus:ring-accent/10 focus:border-accent w-full resize-y rounded-2xl border px-5 py-4 text-sm font-medium transition-all focus:ring-4 focus:outline-none"
          />
          {emailDraft && <CopyableOutput content={emailDraft} label="Email Draft" />}
          <button
            onClick={handleEmail}
            disabled={isRunning}
            className="bg-accent w-full cursor-pointer rounded-full py-3.5 text-xs font-bold tracking-widest text-white uppercase transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isRunning ? 'Drafting...' : emailDraft ? 'Redraft Email' : 'Draft Email'}
          </button>
        </div>
      )}
    </div>
  );
}
