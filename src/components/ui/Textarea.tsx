import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'border-border-input bg-bg-input text-text placeholder:text-text-muted min-h-[100px] w-full resize-y rounded-2xl border px-4 py-2 text-sm transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50',
          'focus:ring-accent/30 focus:border-accent focus:ring-3',
          variant === 'error' && 'border-danger focus:ring-danger/30 focus:border-danger',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
