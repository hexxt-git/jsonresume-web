import { CopyableOutput } from '../shared/CopyableOutput';

interface Props {
  questionList: string[];
  questionInput: string;
  answers: { question: string; answer: string }[];
  onAddQuestion: (q: string) => void;
  onRemoveQuestion: (index: number) => void;
  onInputChange: (v: string) => void;
}

export function QuestionsTab({
  questionList,
  questionInput,
  answers,
  onAddQuestion,
  onRemoveQuestion,
  onInputChange,
}: Props) {
  return (
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
              onClick={() => onRemoveQuestion(i)}
              className="shrink-0 text-text-muted hover:text-text-secondary cursor-pointer"
            >
              &times;
            </button>
          </div>
        ))}
        <input
          value={questionInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && questionInput.trim()) {
              e.preventDefault();
              onAddQuestion(questionInput.trim());
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
  );
}
