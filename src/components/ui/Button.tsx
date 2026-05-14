import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dashed' | 'accent-ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth,
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary: 'bg-accent text-white shadow-md hover:opacity-90 border-transparent',
      secondary:
        'bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text border-transparent',
      outline: 'border-border-input bg-transparent hover:bg-bg-hover text-text border',
      ghost: 'hover:bg-bg-hover text-text-muted hover:text-text border-transparent',
      'accent-ghost': 'text-accent bg-accent/5 hover:bg-accent/10 border-transparent',
      danger: 'bg-danger/10 text-danger hover:bg-danger hover:text-white border-transparent',
      dashed:
        'bg-bg-secondary/20 border-border/50 border-dashed border hover:bg-bg-secondary/40 text-text-muted',
    };

    const sizes = {
      xs: 'px-2.5 h-6 text-[10px] font-black tracking-widest uppercase',
      sm: 'px-4 h-8 text-xs font-bold',
      md: 'px-5 h-10 text-sm font-medium',
      lg: 'px-6 h-12 text-base font-medium',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full transition-all outline-none disabled:pointer-events-none disabled:opacity-50',
          'focus:ring-accent/30 focus:border-accent focus:ring-3 active:scale-[0.98]',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
