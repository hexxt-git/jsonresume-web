import type { ReactNode } from 'react';
import { useT } from '../../i18n';
import { AiEntryProvider } from './AiContext';

interface RepeatableSectionProps<T> {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  defaultItem: T;
  renderItem: (item: T, index: number, update: (index: number, item: T) => void) => ReactNode;
  /** Extract a label for AI context, e.g. "Frontend Engineer at Acme Corp" */
  entryLabel?: (item: T) => string;
}

export function RepeatableSection<T>({
  title,
  items,
  onChange,
  defaultItem,
  renderItem,
  entryLabel,
}: RepeatableSectionProps<T>) {
  const t = useT();
  const update = (index: number, item: T) => {
    const next = [...items];
    next[index] = item;
    onChange(next);
  };

  const add = () => onChange([...items, { ...defaultItem }]);
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };
  const moveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <button
          onClick={add}
          className="text-xs px-2.5 py-1 bg-bg-accent text-accent-text rounded hover:bg-bg-accent transition-colors cursor-pointer"
        >
          {t('repeatable.add')}
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-text-muted italic">{t('repeatable.empty')}</p>
      )}
      {items.map((item, index) => (
        <div key={index} className="border border-border rounded-lg p-3 mb-2 bg-bg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">#{index + 1}</span>
            <div className="flex gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-xs px-1.5 text-text-muted hover:text-text-secondary disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                &uarr;
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index >= items.length - 1}
                className="text-xs px-1.5 text-text-muted hover:text-text-secondary disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                &darr;
              </button>
              <button
                onClick={() => remove(index)}
                className="text-xs px-1.5 text-danger hover:opacity-80 cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>
          <AiEntryProvider label={entryLabel ? entryLabel(item) : `#${index + 1}`}>
            {renderItem(item, index, update)}
          </AiEntryProvider>
        </div>
      ))}
    </div>
  );
}
