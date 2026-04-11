import { type ReactNode, useMemo } from 'react';
import { useT } from '../../i18n';
import { AiEntryProvider } from './AiContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RepeatableSectionProps<T> {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  defaultItem: T;
  renderItem: (item: T, index: number, update: (index: number, item: T) => void) => ReactNode;
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

  // Stable IDs for dnd-kit (index-based since items have no id)
  // Stable IDs that follow items through reorder. Use content hash + index tiebreaker for duplicates.
  const ids = useMemo(() => {
    const seen = new Map<string, number>();
    return items.map((item) => {
      const base = JSON.stringify(item).slice(0, 64);
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      return `${base}::${count}`;
    });
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...items];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableCard
              key={ids[index]}
              id={ids[index]}
              index={index}
              onRemove={() => remove(index)}
            >
              <AiEntryProvider label={entryLabel ? entryLabel(item) : `#${index + 1}`}>
                {renderItem(item, index, update)}
              </AiEntryProvider>
            </SortableCard>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCard({
  id,
  index,
  onRemove,
  children,
}: {
  id: string;
  index: number;
  onRemove: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-lg p-3 mb-2 bg-bg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary touch-none"
            title="Drag to reorder"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="4" cy="2" r="1" />
              <circle cx="8" cy="2" r="1" />
              <circle cx="4" cy="6" r="1" />
              <circle cx="8" cy="6" r="1" />
              <circle cx="4" cy="10" r="1" />
              <circle cx="8" cy="10" r="1" />
            </svg>
          </button>
          <span className="text-xs text-text-muted">#{index + 1}</span>
        </div>
        <button
          onClick={onRemove}
          className="text-xs px-1.5 text-danger hover:opacity-80 cursor-pointer"
        >
          &times;
        </button>
      </div>
      {children}
    </div>
  );
}
