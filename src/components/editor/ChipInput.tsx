import { useState, useMemo, type KeyboardEvent } from 'react';
import { useT } from '../../i18n';
import { AiWritingTools } from './AiWritingTools';
import { useAiContext } from './AiContext';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ChipInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function ChipInput({ label, items, onChange, placeholder }: ChipInputProps) {
  const t = useT();
  const aiContext = useAiContext(label);
  const resolvedPlaceholder = placeholder || t('chip.placeholder');
  const [input, setInput] = useState('');

  const ids = useMemo(() => {
    const seen = new Map<string, number>();
    return items.map((item) => {
      const count = seen.get(item) || 0;
      seen.set(item, count + 1);
      return `${item}::${count}`;
    });
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addItem = () => {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInput('');
    }
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItem();
    } else if (e.key === 'Backspace' && !input && items.length) {
      onChange(items.slice(0, -1));
    }
  };

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
      <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      <AiWritingTools mode="list" items={items} onChange={onChange} context={aiContext}>
        <div className="flex flex-wrap gap-1.5 p-2 pr-8 border border-border-input bg-bg-input rounded-md focus-within:ring-1 focus-within:ring-accent focus-within:border-accent min-h-[36px]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
              {items.map((item, i) => (
                <SortableChip
                  key={ids[i]}
                  id={ids[i]}
                  text={item}
                  onRemove={() => onChange(items.filter((_, j) => j !== i))}
                />
              ))}
            </SortableContext>
          </DndContext>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onBlur={addItem}
            placeholder={items.length === 0 ? resolvedPlaceholder : ''}
            className="flex-1 min-w-[80px] text-sm outline-none bg-transparent text-text"
          />
        </div>
      </AiWritingTools>
    </div>
  );
}

function SortableChip({ id, text, onRemove }: { id: string; text: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <span
      ref={setNodeRef}
      style={style}
      className="inline-flex items-center gap-1 bg-bg-tertiary text-text text-xs px-2 py-0.5 rounded cursor-grab active:cursor-grabbing touch-none"
      {...attributes}
      {...listeners}
    >
      {text}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-text-muted hover:text-text-secondary cursor-pointer"
      >
        &times;
      </button>
    </span>
  );
}
