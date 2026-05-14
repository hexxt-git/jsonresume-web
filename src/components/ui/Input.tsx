import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'border-border-input bg-bg-input text-text placeholder:text-text-muted w-full rounded-full border px-4 py-2 text-sm transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50',
          'focus:ring-accent/30 focus:border-accent focus:ring-3',
          variant === 'error' && 'border-danger focus:ring-danger/30 focus:border-danger',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export { Input };
