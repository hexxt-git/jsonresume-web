import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  countryControl: ReactNode;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder,
  countryControl,
  className,
}: PhoneInputProps) {
  return (
    <div className={cn('group flex transition-all', className)}>
      <div className="flex shrink-0 items-stretch">{countryControl}</div>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'border-border-input bg-bg-input text-text placeholder:text-text-muted focus:ring-accent focus:border-accent min-w-0 flex-1 rounded-r-full border border-l-0 px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        )}
      />
    </div>
  );
}
