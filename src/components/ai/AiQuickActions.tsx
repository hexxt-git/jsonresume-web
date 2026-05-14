import { useT } from '@/i18n';
import { Button } from '@/components/ui/Button';

interface Props {
  onAction: (prompt: string) => void;
  disabled: boolean;
}

const actions = [
  {
    key: 'ai.improveSum' as const,
    prompt:
      'Improve my professional summary. Make it compelling and achievement-oriented while keeping it concise.',
  },
  {
    key: 'ai.genHighlights' as const,
    prompt: 'Suggest stronger, quantified achievement bullet points for each work role.',
  },
  {
    key: 'ai.suggestSkills' as const,
    prompt: 'Suggest additional relevant skills based on my experience, organized by category.',
  },
  {
    key: 'ai.review' as const,
    prompt:
      'Review my entire resume and provide specific, actionable feedback on content, structure, and impact.',
  },
];

export function AiQuickActions({ onAction, disabled }: Props) {
  const t = useT();
  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto border-t px-4 py-2">
      {actions.map((a) => (
        <Button
          key={a.key}
          variant="outline"
          onClick={() => onAction(a.prompt)}
          disabled={disabled}
          className="shrink-0 px-3 py-1 text-xs"
        >
          {t(a.key)}
        </Button>
      ))}
    </div>
  );
}
