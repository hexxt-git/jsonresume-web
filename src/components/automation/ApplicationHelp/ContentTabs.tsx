type Tab = 'cover-letter' | 'questions' | 'email';

const TABS: [Tab, string][] = [
  ['cover-letter', 'Cover Letter'],
  ['questions', 'Questions'],
  ['email', 'Email'],
];

export function ContentTabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-4 border-b border-border">
      {TABS.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`pb-2 text-xs cursor-pointer transition-colors ${
            active === id
              ? 'text-accent border-b-2 border-accent font-medium'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
