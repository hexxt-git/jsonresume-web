interface StepperProps {
  steps: string[];
  currentIndex: number;
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-text-muted">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <div className="w-6 h-px bg-border" />}
          <span className={i <= currentIndex ? 'text-accent font-medium' : ''}>
            {i + 1}. {label}
          </span>
        </div>
      ))}
    </div>
  );
}
