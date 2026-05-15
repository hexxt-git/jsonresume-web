import { type ReactNode, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { CloseIcon } from '@/assets/Icons';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
}

export function Dialog({ open, onClose, children, className, overlayClassName }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-150',
        overlayClassName,
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-bg animate-in slide-down mx-4 w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl transition-all duration-150',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface DialogHeaderProps {
  title: string;
  onClose?: () => void;
  className?: string;
}

export function DialogHeader({ title, onClose, className }: DialogHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-center justify-between', className)}>
      <h2 className="text-text text-xl font-bold tracking-tight">{title}</h2>
      {onClose && (
        <Button
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="text-text-muted hover:text-danger h-8 w-8 rounded-full"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
