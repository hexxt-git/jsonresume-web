import { useState } from 'react';
import { ToolShell } from '../shared/ToolShell';
import { useAiStream } from '../shared/useAiStream';
import { CopyableOutput } from '../shared/CopyableOutput';
import { JdInput } from '../shared/JdInput';
import { Stepper } from '../shared/Stepper';

type Tab = 'cover-letter' | 'questions' | 'email';
type Phase = 'context' | 'questions';

const EMAIL_TYPES = ['Follow-up', 'Thank You', 'Inquiry', 'Negotiation'];

export default function ApplicationHelpTool({ onBack }: { onBack: () => void }) {
  const { run, runStreaming, isRunning, error, setError } = useAiStream();
  const [phase, setPhase] = useState<Phase>('context');
  const [tab, setTab] = useState<Tab>('cover-letter');
  const [jd, setJd] = useState('');

  const [coverLetter, setCoverLetter] = useState('');
  const [questionList, setQuestionList] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [emailType, setEmailType] = useState('Follow-up');
  const [emailContext, setEmailContext] = useState('');
  const [emailDraft, setEmailDraft] = useState('');

  const resumeCtx = useAiStream().getResumeContext;

  const handleCoverLetter = async () => {
    setCoverLetter('');
    setError(null);
    await runStreaming(
      `You are an expert cover letter writer. Write a cover letter for the job below based on the candidate's resume. Write flowing paragraphs, not bullet points. No markdown headers.\n\nResume:\n${resumeCtx()}`,
      `Job Description:\n${jd}\n\nWrite the cover letter.`,
      (text) => setCoverLetter(text),
    );
  };

  const handleQuestions = async () => {
    setAnswers([]);
    setError(null);
    try {
      const result = await run(
        `You are a career consultant. Answer application questions based on the candidate's resume and job description. Return ONLY valid JSON array (no markdown fences): [{"question":"...","answer":"..."},...].\n\nResume:\n${resumeCtx()}\n\nJob Description:\n${jd}`,
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
      `You are a professional email writer. Draft a ${emailType.toLowerCase()} email related to a job application. Base it on the candidate's resume and job description. Keep it concise and professional.\n\nResume:\n${resumeCtx()}\n\nJob Description:\n${jd}`,
      `Write a ${emailType.toLowerCase()} email.${emailContext ? `\n\nAdditional context: ${emailContext}` : ''}`,
      (text) => setEmailDraft(text),
    );
  };

  const footerButton =
    phase === 'context' ? (
      <button
        onClick={() => setPhase('questions')}
        disabled={!jd.trim()}
        className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
      >
        Continue
      </button>
    ) : tab === 'cover-letter' ? (
      <button
        onClick={handleCoverLetter}
        disabled={isRunning}
        className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
      >
        {isRunning ? 'Generating...' : 'Generate Cover Letter'}
      </button>
    ) : tab === 'questions' ? (
      <button
        onClick={handleQuestions}
        disabled={!questionList.length || isRunning}
        className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
      >
        {isRunning ? 'Generating...' : 'Generate Answers'}
      </button>
    ) : (
      <button
        onClick={handleEmail}
        disabled={isRunning}
        className="w-full text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
      >
        {isRunning ? 'Drafting...' : 'Draft Email'}
      </button>
    );

  return (
    <ToolShell
      title="Application Help"
      onBack={phase === 'questions' ? () => setPhase('context') : onBack}
      footer={footerButton}
    >
      <div className="p-4 space-y-5">
        <Stepper
          steps={['Job Description', 'Questions']}
          currentIndex={phase === 'context' ? 0 : 1}
        />

        {error && (
          <div className="text-xs text-danger bg-danger/10 rounded-md px-3 py-2">{error}</div>
        )}

        {/* Step 1: Context */}
        {phase === 'context' && (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Provide the job description for the position you're applying to. This helps generate
              more relevant and targeted content.
            </p>
            <JdInput value={jd} onChange={setJd} rows={10} />
          </div>
        )}

        {/* Step 2: Generate */}
        {phase === 'questions' && (
          <>
            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
              {(
                [
                  ['cover-letter', 'Cover Letter'],
                  ['questions', 'Questions'],
                  ['email', 'Email'],
                ] as const
              ).map(([id, label]) => (
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

            {/* Cover Letter */}
            {tab === 'cover-letter' && (
              <div className="space-y-4">
                {!coverLetter && (
                  <p className="text-xs text-text-tertiary">
                    A cover letter introduces you to the employer, highlights your fit for the role,
                    and shows personality beyond your resume. Click generate below to create one
                    tailored to the job.
                  </p>
                )}
                {coverLetter && <CopyableOutput content={coverLetter} label="Cover Letter" />}
              </div>
            )}

            {/* Questions */}
            {tab === 'questions' && (
              <div className="space-y-4">
                <div className="border border-border-input bg-bg-input rounded-lg p-2 focus-within:ring-1 focus-within:ring-accent focus-within:border-accent space-y-1.5">
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
              </div>
            )}

            {/* Email */}
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
              </div>
            )}
          </>
        )}
      </div>
    </ToolShell>
  );
}
