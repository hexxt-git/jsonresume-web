import { useState } from 'react';
import { useResumeStore, slotDisplayName } from '../../store/resumeStore';
import { useAiStore } from '../../store/aiStore';
import { useUndoStore } from '../../store/undoStore';
import { useT } from '../../i18n';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SlotsPicker() {
  const t = useT();
  const slots = useResumeStore((s) => s.slots);
  const activeSlotId = useResumeStore((s) => s.activeSlotId);
  const saveSlot = useResumeStore((s) => s.saveSlot);
  const duplicateSlot = useResumeStore((s) => s.duplicateSlot);
  const deleteSlot = useResumeStore((s) => s.deleteSlot);
  const renameSlot = useResumeStore((s) => s.renameSlot);
  const setActiveSlotId = useResumeStore((s) => s.setActiveSlotId);
  const updateSlotChatHistory = useResumeStore((s) => s.updateSlotChatHistory);

  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleNew = () => {
    // Save current chat history before switching
    if (activeSlotId) {
      updateSlotChatHistory(activeSlotId, useAiStore.getState().messages);
    }
    saveSlot('');
    useAiStore.getState().clearMessages();
    setOpen(false);
  };

  const handleDuplicate = () => {
    if (activeSlotId) {
      updateSlotChatHistory(activeSlotId, useAiStore.getState().messages);
    }
    duplicateSlot(useAiStore.getState().messages);
    setOpen(false);
  };

  const handleLoad = (id: string) => {
    if (id === activeSlotId) return;
    // Save current chat before switching
    if (activeSlotId) {
      updateSlotChatHistory(activeSlotId, useAiStore.getState().messages);
    }
    // Switch slot — resume data is already in the slot
    setActiveSlotId(id);
    // Load chat history for new slot
    const slot = useResumeStore.getState().getSlot(id);
    useAiStore.getState().setMessages(slot?.chatHistory || []);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    const wasActive = id === activeSlotId;
    deleteSlot(id);
    useUndoStore.getState().deleteSlotHistory(id);
    if (wasActive) {
      const state = useResumeStore.getState();
      if (state.activeSlotId) {
        const next = state.getSlot(state.activeSlotId);
        useAiStore.getState().setMessages(next?.chatHistory || []);
      } else {
        saveSlot('');
        useAiStore.getState().clearMessages();
      }
    }
  };

  const handleStartRename = (id: string, currentName: string) => {
    setRenaming(id);
    setRenameValue(currentName);
  };

  const handleFinishRename = () => {
    if (renaming) {
      renameSlot(renaming, renameValue);
    }
    setRenaming(null);
  };

  const currentSlot = activeSlotId ? slots.find((s) => s.id === activeSlotId) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-2 py-1 border border-border rounded hover:bg-bg-hover transition-colors cursor-pointer text-text flex items-center gap-1 max-w-[100px] sm:max-w-[160px]"
      >
        <span className="truncate">
          {currentSlot ? slotDisplayName(currentSlot) : t('slots.resumes')}
        </span>
        <span className="text-text-muted shrink-0">({slots.length})</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-bg border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-border flex gap-1">
              <button
                onClick={handleNew}
                className="flex-1 text-xs px-2 py-1.5 bg-accent text-white rounded hover:opacity-90 cursor-pointer"
              >
                {t('slots.new')}
              </button>
              <button
                onClick={handleDuplicate}
                className="flex-1 text-xs px-2 py-1.5 border border-border rounded hover:bg-bg-hover cursor-pointer text-text-secondary"
              >
                {t('slots.duplicate')}
              </button>
            </div>

            {slots.length === 0 ? (
              <div className="p-4 text-xs text-text-muted text-center">{t('slots.empty')}</div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {[...slots]
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center gap-2 px-3 py-2 text-xs border-b border-border hover:bg-bg-hover ${
                        slot.id === activeSlotId ? 'bg-bg-accent' : ''
                      }`}
                    >
                      {renaming === slot.id ? (
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={handleFinishRename}
                          onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                          autoFocus
                          className="flex-1 px-1 py-0.5 text-xs border border-accent rounded outline-none bg-bg-input text-text"
                        />
                      ) : (
                        <button
                          onClick={() => handleLoad(slot.id)}
                          className="flex-1 text-left truncate cursor-pointer"
                        >
                          <span
                            className={`font-medium ${slot.id === activeSlotId ? 'text-accent-text' : 'text-text'}`}
                          >
                            {slotDisplayName(slot)}
                          </span>
                          <span className="text-text-muted ml-2">{formatDate(slot.updatedAt)}</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleStartRename(slot.id, slotDisplayName(slot))}
                        className="text-text-muted hover:text-text-secondary cursor-pointer px-1"
                        title={t('slots.rename')}
                      >
                        &#9998;
                      </button>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        className="text-text-muted hover:text-danger cursor-pointer px-1"
                        title={t('slots.delete')}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
