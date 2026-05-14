import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: TabsProps<T>) {
  return (
    <div
      className={cn(
        'bg-bg-secondary border-border/50 flex gap-1 rounded-full border p-1',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full font-bold transition-all outline-none',
              'focus:ring-accent/30 focus:border-accent focus:ring-3',
              size === 'sm' ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs',
              isActive
                ? 'bg-accent text-white shadow-md'
                : 'text-text-tertiary hover:bg-bg-hover hover:text-text',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
