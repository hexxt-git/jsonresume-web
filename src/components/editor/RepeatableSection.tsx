import { type ReactNode, useMemo } from 'react';
import { useT } from '@/i18n';
import { AiEntryProvider } from '@/components/ai/AiContext';
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
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { DragHandleIcon } from '@/assets/Icons';

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
      <div className="flex items-start justify-between">
        <h3 className="text-text flex items-center gap-2 text-lg font-medium tracking-tighter capitalize">
          {title}
        </h3>
        <Button onClick={add} size="sm">
          {t('repeatable.add')}
        </Button>
      </div>
      {items.length === 0 && (
        <Button
          variant="dashed"
          onClick={add}
          className="group w-full rounded-3xl py-12 text-center"
        >
          <p className="text-text-muted group-hover:text-accent text-xs italic">
            {t('repeatable.empty')}
          </p>
        </Button>
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
      className="border-border/60 bg-bg group/card rounded-3xl border transition-all"
    >
      <div className={`flex items-center justify-between p-4 pb-2 ${!isVisible ? 'p-4!' : ''}`}>
        <div className="flex min-w-0 items-center gap-3">
          <Button
            {...attributes}
            {...listeners}
            variant="secondary"
            size="icon"
            leftIcon={<DragHandleIcon />}
            className="hover:text-accent hover:bg-accent/5 cursor-grab touch-none active:cursor-grabbing"
            title="Drag to reorder"
          />
          <Badge
            variant="default"
            className={cn(
              'h-8 max-w-xs truncate px-3',
              !isVisible && 'decoration-text-muted/50 line-through',
            )}
          >
            {label}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            onClick={onToggleVisibility}
            className={cn(!isVisible ? 'text-accent' : 'hover:text-accent hover:bg-accent/5')}
            title={isVisible ? 'Collapse & Disable' : 'Expand & Enable'}
            leftIcon={
              isVisible ? (
                <Eye size={16} variant="Bold" color="currentColor" />
              ) : (
                <EyeSlash size={16} variant="Bold" color="currentColor" />
              )
            }
          />
          <Button
            variant="secondary"
            size="icon"
            onClick={onRemove}
            className="hover:text-danger hover:bg-danger/5"
            title="Remove entry"
            leftIcon={<Trash size={16} variant="Bold" color="currentColor" />}
          />
        </div>
      </div>
      <div className={`relative p-4 pt-2 ${!isVisible ? 'hidden' : 'block'}`}>{children}</div>
    </div>
  );
}
