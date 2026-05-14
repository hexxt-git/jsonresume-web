import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from 'react';
import { useT } from '../../i18n';
import { AiWritingTools } from '../ai/AiWritingTools';
import { useAiContext } from '../ai/AiContext';
import { CloseCircle } from 'iconsax-react';
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

  const handleFinishEdit = (index: number, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) {
      onChange(items.filter((_, j) => j !== index));
    } else if (trimmed !== items[index]) {
      const isDuplicate = items.some((existing, j) => j !== index && existing === trimmed);
      if (!isDuplicate) {
        const next = [...items];
        next[index] = trimmed;
        onChange(next);
      }
    }
    setEditingIndex(null);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-text-secondary ml-1 block text-xs font-medium">{label}</label>
      <AiWritingTools mode="list" items={items} onChange={onChange} context={aiContext}>
        <div className="border-border-input bg-bg-input focus-within:ring-accent focus-within:border-accent relative flex min-h-[42px] flex-wrap gap-2 rounded-3xl border p-3 pr-10 transition-all focus-within:ring-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => setEditingIndex(null)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
              {items.map((item, i) => (
                <SortableChip
                  key={ids[i]}
                  id={ids[i]}
                  text={item}
                  isEditing={editingIndex === i}
                  onStartEdit={() => setEditingIndex(i)}
                  onFinishEdit={(newText) => handleFinishEdit(i, newText)}
                  onCancelEdit={() => setEditingIndex(null)}
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
            className="text-text min-w-[100px] flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </AiWritingTools>
    </div>
  );
}

function SortableChip({
  id,
  text,
  isEditing,
  onStartEdit,
  onFinishEdit,
  onCancelEdit,
  onRemove,
}: {
  id: string;
  text: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onFinishEdit: (newText: string) => void;
  onCancelEdit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isEditing,
  });
  const [editValue, setEditValue] = useState(text);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    if (isDragging) didDrag.current = true;
  }, [isDragging]);

  useEffect(() => {
    if (isEditing) {
      setEditValue(text);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing, text]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    onStartEdit();
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      onFinishEdit(editValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <span
        ref={setNodeRef}
        style={style}
        className="bg-bg-tertiary text-text ring-accent inline-flex min-w-[60px] items-center rounded-2xl px-2 py-1 text-xs ring-1"
      >
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={() => onFinishEdit(editValue)}
          className="text-text w-full resize-none bg-transparent text-xs outline-none"
          rows={1}
          style={{ minHeight: '1.2em' }}
        />
      </span>
    );
  }

  return (
    <span
      ref={setNodeRef}
      style={style}
      className="bg-bg-tertiary text-text hover:bg-bg-hover border-border/50 inline-flex max-w-full cursor-grab touch-none items-center gap-2 rounded-full border px-2 py-1 text-xs transition-colors active:cursor-grabbing"
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-text-muted hover:text-danger shrink-0 cursor-pointer transition-colors"
      >
        <CloseCircle size={14} variant="Bold" color="currentColor" />
      </button>
    </span>
  );
}
