import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => {
  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'peer border-border-input bg-bg-input checked:border-accent checked:bg-accent h-4 w-4 cursor-pointer appearance-none rounded border transition-all outline-none',
          'focus:ring-accent/30 focus:border-accent focus:ring-3',
          className,
        )}
        {...props}
      />
      <svg
        className="pointer-events-none absolute top-0 left-0 h-4 w-4 stroke-white opacity-0 transition-opacity peer-checked:opacity-100"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="4"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
