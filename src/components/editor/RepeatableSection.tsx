import type { ReactNode } from 'react';

interface RepeatableSectionProps<T> {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  defaultItem: T;
  renderItem: (item: T, index: number, update: (index: number, item: T) => void) => ReactNode;
}

export function RepeatableSection<T>({
  title,
  items,
  onChange,
  defaultItem,
  renderItem,
}: RepeatableSectionProps<T>) {
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
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <button
          onClick={add}
          className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors cursor-pointer"
        >
          + Add
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-gray-400 italic">No entries yet. Click "+ Add" to create one.</p>
      )}
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">#{index + 1}</span>
            <div className="flex gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-xs px-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                &uarr;
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index >= items.length - 1}
                className="text-xs px-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                &darr;
              </button>
              <button
                onClick={() => remove(index)}
                className="text-xs px-1.5 text-red-400 hover:text-red-600 cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>
          {renderItem(item, index, update)}
        </div>
      ))}
    </div>
  );
}
