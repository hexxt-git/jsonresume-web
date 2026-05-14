import type { ReactNode } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { ArrowDown2, TickCircle } from 'iconsax-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  size = 'md',
  className,
}: SelectProps) {
  const trigger = size === 'sm' ? 'text-xs px-4 py-1.5 gap-2' : 'text-xs px-5 py-2.5 gap-2.5';
  const selected = options.find((o) => o.value === value);

  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        className={`bg-bg text-text-secondary hover:bg-bg-hover data-placeholder:text-text-muted inline-flex cursor-pointer items-center justify-between rounded-full border transition-colors outline-none ${trigger} ${className}`}
      >
        <span className="flex items-center gap-2">
          {selected?.icon}
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon className="text-text-muted">
          <ArrowDown2 size={14} variant="Bold" color="currentColor" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className="bg-bg z-50 overflow-hidden rounded-2xl border shadow-xl"
          position="popper"
          sideOffset={8}
          align="start"
        >
          <RadixSelect.Viewport className="p-2">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className="text-text-secondary data-[highlighted]:bg-bg-hover data-[highlighted]:text-text data-[state=checked]:text-accent-text flex cursor-pointer items-center gap-2.5 rounded-xl px-4 py-2 text-xs outline-none select-none data-[state=checked]:font-medium"
              >
                <RadixSelect.ItemIndicator className="text-accent w-4">
                  <TickCircle size={14} variant="Bold" color="currentColor" />
                </RadixSelect.ItemIndicator>
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
