interface StepperProps {
  steps: string[];
  currentIndex: number;
  /** Fires when user clicks a completed (earlier) step to navigate back. */
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentIndex, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-text-muted">
      {steps.map((label, i) => {
        const reached = i <= currentIndex;
        const clickable = onStepClick && i < currentIndex;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className={`w-6 h-px ${reached ? 'bg-accent' : 'bg-border'}`} />}
            <button
              type="button"
              onClick={() => clickable && onStepClick(i)}
              className={`${reached ? 'text-accent font-medium' : ''} ${clickable ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
            >
              {i + 1}. {label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
