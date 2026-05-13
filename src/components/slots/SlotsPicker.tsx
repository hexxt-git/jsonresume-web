import { useState } from 'react';
import { useResumeStore, slotDisplayName } from '../../store/resumeStore';
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

  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleNew = () => {
    saveSlot('');
    setOpen(false);
  };

  const handleDuplicate = () => {
    duplicateSlot();
    setOpen(false);
  };

  const handleLoad = (id: string) => {
    if (id === activeSlotId) return;
    setActiveSlotId(id);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    const wasActive = id === activeSlotId;
    deleteSlot(id);
    useUndoStore.getState().deleteSlotHistory(id);
    if (wasActive && !useResumeStore.getState().activeSlotId) {
      saveSlot('');
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
        className="text-[10px] font-bold px-3 py-1.5 border border-border rounded-full hover:bg-bg-hover transition-all cursor-pointer text-text-secondary flex items-center gap-2 max-w-[120px] sm:max-w-[200px] shadow-sm uppercase tracking-wider"
      >
        <span className="truncate">
          {currentSlot ? slotDisplayName(currentSlot) : t('slots.resumes')}
        </span>
        <span className="text-accent shrink-0">({slots.length})</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-bg border border-border rounded-3xl shadow-2xl overflow-hidden p-2 space-y-1">
            <div className="p-2 border-b border-border flex gap-2 mb-1">
              <button
                onClick={handleNew}
                className="flex-1 text-[10px] font-bold px-3 py-2 bg-accent text-white rounded-full hover:opacity-90 cursor-pointer shadow-md transition-all uppercase tracking-widest"
              >
                {t('slots.new')}
              </button>
              <button
                onClick={handleDuplicate}
                className="flex-1 text-[10px] font-bold px-3 py-2 border border-border rounded-full hover:bg-bg-hover cursor-pointer text-text-secondary transition-all uppercase tracking-widest"
              >
                {t('slots.duplicate')}
              </button>
            </div>

            {slots.length === 0 ? (
              <div className="p-6 text-xs text-text-muted text-center italic">
                {t('slots.empty')}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1 rounded-2xl">
                {[...slots]
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                        slot.id === activeSlotId
                          ? 'bg-bg-accent ring-1 ring-accent/20'
                          : 'hover:bg-bg-hover'
                      }`}
                    >
                      {renaming === slot.id ? (
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={handleFinishRename}
                          onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                          autoFocus
                          className="flex-1 px-3 py-1 text-xs border border-accent rounded-full outline-none bg-bg-input text-text shadow-sm"
                        />
                      ) : (
                        <button
                          onClick={() => handleLoad(slot.id)}
                          className="flex-1 text-left truncate cursor-pointer group"
                        >
                          <div
                            className={`text-xs font-bold truncate ${slot.id === activeSlotId ? 'text-accent' : 'text-text'}`}
                          >
                            {slotDisplayName(slot)}
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5 font-medium">
                            {formatDate(slot.updatedAt)}
                          </div>
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartRename(slot.id, slotDisplayName(slot))}
                          className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/5 rounded-full cursor-pointer transition-all"
                          title={t('slots.rename')}
                        >
                          &#9998;
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/5 rounded-full cursor-pointer transition-all"
                          title={t('slots.delete')}
                        >
                          &times;
                        </button>
                      </div>
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
