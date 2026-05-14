import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'accent' | 'outline' | 'danger';
  icon?: ReactNode;
}

export function Badge({ className, variant = 'default', icon, children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-bg-secondary text-text-muted',
    secondary: 'bg-bg-tertiary text-text-secondary',
    accent: 'bg-accent/10 text-accent',
    outline: 'border border-border/50 text-text-muted',
    danger: 'bg-danger/10 text-danger',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
