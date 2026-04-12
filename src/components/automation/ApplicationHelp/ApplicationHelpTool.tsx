import { useState } from 'react';
import { ToolShell } from '../shared/ToolShell';
import { useAiStream } from '../shared/useAiStream';
import { AutomationSettings, SettingsFooterButton } from '../shared/AutomationSettings';
import { getPromptDirectives, getCoverLetterDirective } from '../../../store/automationStore';
import { Stepper } from '../shared/Stepper';
import { JdContextStep } from './JdContextStep';
import { ContentTabs } from './ContentTabs';
import { CoverLetterTab } from './CoverLetterTab';
import { QuestionsTab } from './QuestionsTab';
import { EmailTab } from './EmailTab';

type Tab = 'cover-letter' | 'questions' | 'email';
type Phase = 'context' | 'questions';

const CURRENT_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

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
      `You are an expert cover letter writer. Today is ${CURRENT_DATE} (${new Date().getFullYear()}). Write a cover letter for the job below based on the candidate's resume. Write flowing paragraphs, not bullet points. No markdown headers.${getCoverLetterDirective()}${getPromptDirectives()}\n\nResume:\n${resumeCtx()}`,
      `Job Description:\n${jd}\n\nWrite the cover letter.`,
      (text) => setCoverLetter(text),
    );
  };

  const handleQuestions = async () => {
    setAnswers([]);
    setError(null);
    try {
      const result = await run(
        `You are a career consultant. Today is ${CURRENT_DATE} (${new Date().getFullYear()}). Answer application questions based on the candidate's resume and job description. Return ONLY valid JSON array (no markdown fences): [{"question":"...","answer":"..."},...].${getPromptDirectives()}\n\nResume:\n${resumeCtx()}\n\nJob Description:\n${jd}`,
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
      `You are a professional email writer. Today is ${CURRENT_DATE} (${new Date().getFullYear()}). Draft a ${emailType.toLowerCase()} email related to a job application. Base it on the candidate's resume and job description. Keep it concise and professional.${getPromptDirectives()}\n\nResume:\n${resumeCtx()}\n\nJob Description:\n${jd}`,
      `Write a ${emailType.toLowerCase()} email.${emailContext ? `\n\nAdditional context: ${emailContext}` : ''}`,
      (text) => setEmailDraft(text),
    );
  };

  const actionButton =
    phase === 'context' ? (
      <button
        onClick={() => setPhase('questions')}
        disabled={!jd.trim()}
        className="flex-1 text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
      >
        Continue
      </button>
    ) : tab === 'cover-letter' ? (
      <button
        onClick={handleCoverLetter}
        disabled={isRunning}
        className="flex-1 text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
      >
        {isRunning ? 'Generating...' : 'Generate Cover Letter'}
      </button>
    ) : tab === 'questions' ? (
      <button
        onClick={handleQuestions}
        disabled={!questionList.length || isRunning}
        className="flex-1 text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
      >
        {isRunning ? 'Generating...' : 'Generate Answers'}
      </button>
    ) : (
      <button
        onClick={handleEmail}
        disabled={isRunning}
        className="flex-1 text-xs py-2.5 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50"
      >
        {isRunning ? 'Drafting...' : 'Draft Email'}
      </button>
    );

  const footerButton = (
    <div className="flex gap-2">
      <SettingsFooterButton />
      {actionButton}
    </div>
  );

  return (
    <ToolShell
      title="Application Help"
      onBack={phase === 'questions' ? () => setPhase('context') : onBack}
      headerExtra={<AutomationSettings />}
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

        {phase === 'context' && <JdContextStep jd={jd} onChange={setJd} />}

        {phase === 'questions' && (
          <>
            <ContentTabs active={tab} onChange={setTab} />
            {tab === 'cover-letter' && <CoverLetterTab content={coverLetter} />}
            {tab === 'questions' && (
              <QuestionsTab
                questionList={questionList}
                questionInput={questionInput}
                answers={answers}
                onAddQuestion={(q) => {
                  setQuestionList([...questionList, q]);
                  setQuestionInput('');
                }}
                onRemoveQuestion={(i) => setQuestionList(questionList.filter((_, j) => j !== i))}
                onInputChange={setQuestionInput}
              />
            )}
            {tab === 'email' && (
              <EmailTab
                emailType={emailType}
                emailContext={emailContext}
                emailDraft={emailDraft}
                onTypeChange={setEmailType}
                onContextChange={setEmailContext}
              />
            )}
          </>
        )}
      </div>
    </ToolShell>
  );
}
