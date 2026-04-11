import { useState } from 'react';
import { useSlotsStore, slotDisplayName } from '../../store/slotsStore';
import { useResumeStore } from '../../store/resumeStore';
import { useAiStore } from '../../store/aiStore';
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
  const slots = useSlotsStore((s) => s.slots);
  const activeSlotId = useSlotsStore((s) => s.activeSlotId);
  const saveSlot = useSlotsStore((s) => s.saveSlot);
  const updateSlot = useSlotsStore((s) => s.updateSlot);
  const deleteSlot = useSlotsStore((s) => s.deleteSlot);
  const renameSlot = useSlotsStore((s) => s.renameSlot);
  const setActiveSlotId = useSlotsStore((s) => s.setActiveSlotId);

  const resume = useResumeStore((s) => s.resume);
  const themeId = useResumeStore((s) => s.selectedThemeId);
  const customization = useResumeStore((s) => s.customization);
  const setResume = useResumeStore((s) => s.setResume);
  const setTheme = useResumeStore((s) => s.setTheme);
  const setFullCustomization = useResumeStore((s) => s.setFullCustomization);
  const resetCustomization = useResumeStore((s) => s.resetCustomization);
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleNew = () => {
    // Save current slot before switching (including chat history)
    if (activeSlotId) {
      const chatHistory = useAiStore.getState().messages;
      updateSlot(activeSlotId, resume, themeId, customization, chatHistory);
    }
    const emptyResume = { basics: { name: '', label: '', summary: '' } };
    saveSlot('', emptyResume, 'modern');
    setResume(emptyResume);
    setTheme('modern');
    resetCustomization();
    useAiStore.getState().clearMessages();
    setOpen(false);
  };

  const handleDuplicate = () => {
    // Save current first
    if (activeSlotId) {
      const chatHistory = useAiStore.getState().messages;
      updateSlot(activeSlotId, resume, themeId, customization, chatHistory);
    }
    const chatHistory = structuredClone(useAiStore.getState().messages);
    saveSlot('', structuredClone(resume), themeId, { ...customization }, chatHistory);
    setOpen(false);
  };

  const handleLoad = (id: string) => {
    if (id === activeSlotId) return;
    // Auto-save current slot before switching (including chat history)
    if (activeSlotId) {
      const chatHistory = useAiStore.getState().messages;
      updateSlot(activeSlotId, resume, themeId, customization, chatHistory);
    }
    const slot = useSlotsStore.getState().getSlot(id);
    if (slot) {
      setResume(slot.resume);
      setTheme(slot.themeId);
      setFullCustomization(slot.customization);
      useAiStore.getState().setMessages(slot.chatHistory || []);
      setActiveSlotId(id);
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    const wasActive = id === activeSlotId;
    deleteSlot(id);
    if (wasActive) {
      const state = useSlotsStore.getState();
      if (state.activeSlotId) {
        const next = state.getSlot(state.activeSlotId);
        if (next) {
          setResume(next.resume);
          setTheme(next.themeId);
          useAiStore.getState().setMessages(next.chatHistory || []);
        }
      } else {
        const emptyResume = { basics: { name: '', label: '', summary: '' } };
        saveSlot('', emptyResume, 'modern');
        setResume(emptyResume);
        setTheme('modern');
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

  const activeSlot = activeSlotId ? slots.find((s) => s.id === activeSlotId) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-2 py-1 border border-border rounded hover:bg-bg-hover transition-colors cursor-pointer text-text flex items-center gap-1 max-w-[100px] sm:max-w-[160px]"
      >
        <span className="truncate">
          {activeSlot ? slotDisplayName(activeSlot) : t('slots.resumes')}
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
