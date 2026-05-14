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
        className="hover:bg-bg-hover text-text-secondary flex max-w-[120px] cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase shadow-sm transition-all sm:max-w-[200px]"
      >
        <span className="truncate">
          {currentSlot ? slotDisplayName(currentSlot) : t('slots.resumes')}
        </span>
        <span className="text-accent shrink-0">({slots.length})</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setOpen(false)} />
          <div className="bg-bg border-border absolute top-full right-0 z-50 mt-2 w-80 space-y-1 overflow-hidden rounded-3xl border p-2 shadow-2xl">
            <div className="border-border mb-1 flex gap-2 border-b p-2">
              <button
                onClick={handleNew}
                className="bg-accent flex-1 cursor-pointer rounded-full px-3 py-2 text-[10px] font-bold tracking-widest text-white uppercase shadow-md transition-all hover:opacity-90"
              >
                {t('slots.new')}
              </button>
              <button
                onClick={handleDuplicate}
                className="border-border hover:bg-bg-hover text-text-secondary flex-1 cursor-pointer rounded-full border px-3 py-2 text-[10px] font-bold tracking-widest uppercase transition-all"
              >
                {t('slots.duplicate')}
              </button>
            </div>

            {slots.length === 0 ? (
              <div className="text-text-muted p-6 text-center text-xs italic">
                {t('slots.empty')}
              </div>
            ) : (
              <div className="max-h-72 space-y-1 overflow-y-auto rounded-2xl p-0.5">
                {[...slots]
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                        slot.id === activeSlotId
                          ? 'bg-bg-accent ring-accent/20 ring-1'
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
                          className="border-accent bg-bg-input text-text flex-1 rounded-full border px-3 py-1 text-xs shadow-sm outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => handleLoad(slot.id)}
                          className="group flex-1 cursor-pointer truncate text-left"
                        >
                          <div
                            className={`truncate text-xs font-bold ${slot.id === activeSlotId ? 'text-accent' : 'text-text'}`}
                          >
                            {slotDisplayName(slot)}
                          </div>
                          <div className="text-text-muted mt-0.5 text-[10px] font-medium">
                            {formatDate(slot.updatedAt)}
                          </div>
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartRename(slot.id, slotDisplayName(slot))}
                          className="text-text-muted hover:text-accent hover:bg-accent/5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all"
                          title={t('slots.rename')}
                        >
                          &#9998;
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="text-text-muted hover:text-danger hover:bg-danger/5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all"
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
