interface StepperProps {
  steps: string[];
  currentIndex: number;
  /** Fires when user clicks a completed (earlier) step to navigate back. */
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentIndex, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
      {steps.map((label, i) => {
        const reached = i <= currentIndex;
        const active = i === currentIndex;
        const clickable = onStepClick && i < currentIndex;
        return (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && (
              <div className={`w-8 h-0.5 rounded-full ${reached ? 'bg-accent' : 'bg-border/50'}`} />
            )}
            <button
              type="button"
              onClick={() => clickable && onStepClick(i)}
              className={`flex items-center gap-2 transition-all ${
                active
                  ? 'text-accent'
                  : reached
                    ? 'text-text-secondary hover:text-accent'
                    : 'text-text-muted opacity-50'
              } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  active
                    ? 'bg-accent border-accent text-white shadow-md'
                    : reached
                      ? 'border-accent text-accent'
                      : 'border-border text-text-muted'
                }`}
              >
                {i + 1}
              </span>
              <span className={active ? 'font-black' : 'font-bold'}>{label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
