import { type ReactNode, useMemo } from 'react';
import { useT } from '../../i18n';
import { AiEntryProvider } from '../ai/AiContext';
import { Eye, EyeSlash, Trash } from 'iconsax-react';
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

  const toggleVisibility = (index: number) => {
    const item = items[index] as any;
    const isVisible = item.visible !== false;
    update(index, { ...item, visible: !isVisible });
  };

  const ids = useMemo(() => {
    const seen = new Map<string, number>();
    return items.map((item) => {
      // Create a stable key based on content and index
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text uppercase tracking-widest flex items-center gap-2">
          {title}
        </h3>
        <button
          onClick={add}
          className="text-[10px] font-black px-4 py-1.5 bg-accent text-white rounded-full hover:opacity-90 shadow-md transition-all cursor-pointer uppercase tracking-widest"
        >
          {t('repeatable.add')}
        </button>
      </div>
      {items.length === 0 && (
        <button
          onClick={add}
          className="w-full py-8 text-center bg-bg-secondary/20 rounded-3xl border border-dashed border-border/50 hover:bg-bg-secondary/40 transition-all cursor-pointer group"
        >
          <p className="text-xs text-text-muted italic group-hover:text-accent">
            {t('repeatable.empty')}
          </p>
        </button>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {items.map((item, index) => {
              const id = ids[index];
              const label = entryLabel ? entryLabel(item) : `Entry #${index + 1}`;
              const isVisible = (item as any).visible !== false;

              return (
                <SortableCard
                  key={id}
                  id={id}
                  label={label}
                  isVisible={isVisible}
                  onRemove={() => remove(index)}
                  onToggleVisibility={() => toggleVisibility(index)}
                >
                  <AiEntryProvider label={label}>{renderItem(item, index, update)}</AiEntryProvider>
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCard({
  id,
  label,
  isVisible,
  onRemove,
  onToggleVisibility,
  children,
}: {
  id: string;
  label: string;
  isVisible: boolean;
  onRemove: () => void;
  onToggleVisibility: () => void;
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
    <div
      ref={setNodeRef}
      style={style}
      className="border border-border/60 rounded-3xl bg-bg shadow-sm transition-all hover:shadow-md group/card"
    >
      <div className={`flex items-center justify-between p-4 pb-2 ${!isVisible ? 'p-4!' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-secondary text-text-muted hover:text-accent hover:bg-accent/5 cursor-grab active:cursor-grabbing touch-none transition-all shrink-0"
            title="Drag to reorder"
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="4" cy="2" r="1.2" />
              <circle cx="8" cy="2" r="1.2" />
              <circle cx="4" cy="6" r="1.2" />
              <circle cx="8" cy="6" r="1.2" />
              <circle cx="4" cy="10" r="1.2" />
              <circle cx="8" cy="10" r="1.2" />
            </svg>
          </button>
          <span
            className={`h-8 inline-flex items-center text-[10px] font-black text-text-muted uppercase tracking-widest bg-bg-secondary px-3 py-1 rounded-full truncate max-w-xs ${
              !isVisible ? 'line-through decoration-text-muted/50' : ''
            }`}
          >
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleVisibility}
            className={`w-8 h-8 flex items-center justify-center rounded-full bg-bg-secondary transition-all cursor-pointer ${
              isVisible ? 'text-text-muted hover:text-accent hover:bg-accent/5' : 'text-accent'
            }`}
            title={isVisible ? 'Collapse & Disable' : 'Expand & Enable'}
          >
            {isVisible ? (
              <Eye size={16} variant="Bold" color="currentColor" />
            ) : (
              <EyeSlash size={16} variant="Bold" color="currentColor" />
            )}
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-secondary text-text-muted hover:text-danger hover:bg-danger/5 transition-all cursor-pointer"
            title="Remove entry"
          >
            <Trash size={16} variant="Bold" color="currentColor" />
          </button>
        </div>
      </div>
      <div className={`p-4 pt-2 relative ${!isVisible ? 'hidden' : 'block'}`}>{children}</div>
    </div>
  );
}
