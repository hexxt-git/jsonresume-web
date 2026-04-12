import { useState } from 'react';
import { useAiStream } from '../shared/useAiStream';
import { CopyableOutput } from '../shared/CopyableOutput';
import {
  useAutomationStore,
  getPromptDirectives,
  getCoverLetterDirective,
  type Tone,
  type CoverLetterLength,
} from '../../../store/automationStore';
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
    <div className="space-y-4">
      {/* Inline settings */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
          Tone
        </span>
        {(['formal', 'professional', 'casual'] as Tone[]).map((t) => (
          <button
            key={t}
            onClick={() => setTone(t)}
            className={`text-[10px] px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
              tone === t
                ? 'bg-accent text-white'
                : 'border border-border text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        {tab === 'cover-letter' && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
              Length
            </span>
            {(['brief', 'standard', 'detailed'] as CoverLetterLength[]).map((l) => (
              <button
                key={l}
                onClick={() => setCoverLetterLength(l)}
                className={`text-[10px] px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                  coverLetterLength === l
                    ? 'bg-accent text-white'
                    : 'border border-border text-text-muted hover:text-text-secondary'
                }`}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`pb-2 text-xs cursor-pointer transition-colors ${
              tab === id
                ? 'text-accent border-b-2 border-accent font-medium'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-danger bg-danger/10 rounded-md px-3 py-2">{error}</div>
      )}

      {/* Cover Letter Tab */}
      {tab === 'cover-letter' && (
        <div className="space-y-4">
          {!coverLetter && !isRunning && (
            <p className="text-xs text-text-tertiary">
              Generate a cover letter tailored to this position and your resume.
            </p>
          )}
          {coverLetter && <CopyableOutput content={coverLetter} label="Cover Letter" />}
          <button
            onClick={handleCoverLetter}
            disabled={isRunning}
            className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? 'Generating...' : coverLetter ? 'Regenerate' : 'Generate Cover Letter'}
          </button>
        </div>
      )}

      {/* Questions Tab */}
      {tab === 'questions' && (
        <div className="space-y-4">
          <div className="border border-border-input bg-bg-input rounded-lg p-2 focus-within:ring-1 focus-within:ring-accent space-y-1.5">
            {questionList.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 bg-bg-tertiary rounded px-2 py-1.5 text-xs text-text"
              >
                <span className="flex-1">{q}</span>
                <button
                  type="button"
                  onClick={() => setQuestionList(questionList.filter((_, j) => j !== i))}
                  className="shrink-0 text-text-muted hover:text-text-secondary cursor-pointer"
                >
                  &times;
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
              className="w-full text-xs outline-none bg-transparent text-text px-1 py-0.5"
            />
          </div>
          {answers.length > 0 && (
            <div className="space-y-3">
              {answers.map((a, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-text mb-1">{a.question}</p>
                  <CopyableOutput content={a.answer} format="plain" />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleQuestions}
            disabled={!questionList.length || isRunning}
            className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? 'Generating...' : 'Generate Answers'}
          </button>
        </div>
      )}

      {/* Email Tab */}
      {tab === 'email' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {EMAIL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setEmailType(t)}
                className={`text-[10px] px-3 py-1 rounded-full cursor-pointer transition-colors ${
                  emailType === t
                    ? 'bg-accent text-white'
                    : 'border border-border text-text-secondary hover:bg-bg-hover'
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
            rows={2}
            className="w-full px-3 py-2 text-xs border border-border-input bg-bg-input text-text rounded-lg focus:outline-none focus:ring-1 focus:ring-accent resize-y"
          />
          {emailDraft && <CopyableOutput content={emailDraft} label="Email Draft" />}
          <button
            onClick={handleEmail}
            disabled={isRunning}
            className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? 'Drafting...' : emailDraft ? 'Redraft' : 'Draft Email'}
          </button>
        </div>
      )}
    </div>
  );
}
