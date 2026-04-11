import type { ReactNode } from 'react';
import { ArrowLeft2 } from 'iconsax-react';

interface ToolShellProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  headerExtra?: ReactNode;
  /** Sticky footer content (e.g. main action button). Sticks to bottom, doesn't cover scroll content. */
  footer?: ReactNode;
}

export function ToolShell({ title, onBack, children, headerExtra, footer }: ToolShellProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <button
          onClick={onBack}
          className="p-1 text-text-muted hover:text-text-secondary cursor-pointer transition-colors rounded hover:bg-bg-hover"
        >
          <ArrowLeft2 size={16} variant="Bold" color="currentColor" />
        </button>
        <span className="text-xs font-medium text-text flex-1">{title}</span>
        {headerExtra}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      {footer && <div className="shrink-0 px-4 py-3 border-t border-border bg-bg">{footer}</div>}
    </div>
  );
}
