import { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeEditor } from './components/editor/ResumeEditor';
import { ResumePreview } from './components/preview/ResumePreview';
import { ImportDialog } from './components/import-export/ImportDialog';
import { ExportDialog } from './components/import-export/ExportDialog';
import { useResumeStore } from './store/resumeStore';
import { SlotsPicker } from './components/slots/SlotsPicker';
import { sampleResume } from './utils/sample';
import { parseResumeFile } from './parser';
import { useDarkModeStore } from './store/darkModeStore';
import { useSlotsStore } from './store/slotsStore';
import { useT, useI18nStore, locales, type Locale } from './i18n';
import { Select } from './components/ui/Select';

const darkModeOptions = [
  { value: 'light', label: '\u2600 Light' },
  { value: 'dark', label: '\u263E Dark' },
  { value: 'system', label: '\u25D0 System' },
];

function DarkModeToggle() {
  const mode = useDarkModeStore((s) => s.mode);
  const setMode = useDarkModeStore((s) => s.setMode);
  return (
    <Select
      value={mode}
      onValueChange={(v) => setMode(v as 'light' | 'dark' | 'system')}
      options={darkModeOptions}
      size="sm"
    />
  );
}

function LocalePicker() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const options = locales.map((l) => ({ value: l.id, label: l.label }));
  return (
    <Select
      value={locale}
      onValueChange={(v) => setLocale(v as Locale)}
      options={options}
      size="sm"
    />
  );
}

function App() {
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const t = useT();
  const resume = useResumeStore((s) => s.resume);
  const setResume = useResumeStore((s) => s.setResume);
  const themeId = useResumeStore((s) => s.selectedThemeId);
  const reset = useResumeStore((s) => s.reset);
  const custom = useResumeStore((s) => s.customization);
  const activeSlotId = useSlotsStore((s) => s.activeSlotId);
  const updateSlot = useSlotsStore((s) => s.updateSlot);
  const saveSlot = useSlotsStore((s) => s.saveSlot);
  const slots = useSlotsStore((s) => s.slots);

  // Bootstrap: ensure at least one slot always exists
  useEffect(() => {
    if (slots.length === 0) {
      saveSlot('Resume 1', resume, themeId);
    }
  }, [slots.length, saveSlot, resume, themeId]);

  useEffect(() => {
    if (!activeSlotId) return;
    const timer = setTimeout(() => updateSlot(activeSlotId, resume, themeId, custom), 500);
    return () => clearTimeout(timer);
  }, [resume, themeId, custom, activeSlotId, updateSlot]);

  const isEmpty =
    !resume.basics?.name &&
    !resume.basics?.email &&
    !resume.work?.length &&
    !resume.education?.length &&
    !resume.skills?.length &&
    !resume.projects?.length;

  const handlePrint = useCallback(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Resume Preview"]');
    iframe?.contentWindow?.print();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-bg">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-text tracking-tight">{t('app.title')}</h1>
          <span className="hidden sm:inline text-xs text-text-muted">{t('app.subtitle')}</span>
          <DarkModeToggle />
          <LocalePicker />
        </div>
        <div className="flex items-center gap-2">
          <SlotsPicker />
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 border border-border rounded-md hover:bg-bg-hover transition-colors cursor-pointer text-danger"
          >
            {t('app.reset')}
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="text-xs px-3 py-1.5 border border-border rounded-md hover:bg-bg-hover transition-colors cursor-pointer text-text-secondary"
          >
            {t('app.import')}
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="text-xs px-3 py-1.5 bg-accent text-white rounded-md hover:opacity-90 transition-colors cursor-pointer"
            >
              {t('app.export')}
            </button>
            <ExportDialog
              open={exportOpen}
              onClose={() => setExportOpen(false)}
              onPrint={handlePrint}
            />
          </div>
        </div>
      </header>

      <div className="sm:hidden flex border-b border-border shrink-0">
        <button
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 text-xs font-medium text-center cursor-pointer ${mobileView === 'editor' ? 'text-accent-text border-b-2 border-accent' : 'text-text-muted'}`}
        >
          {t('app.editor')}
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 text-xs font-medium text-center cursor-pointer ${mobileView === 'preview' ? 'text-accent-text border-b-2 border-accent' : 'text-text-muted'}`}
        >
          {t('app.preview')}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`w-full sm:w-1/2 border-r border-border overflow-hidden ${mobileView === 'preview' ? 'hidden sm:block' : ''}`}
        >
          <ResumeEditor />
        </div>
        <div
          className={`w-full sm:w-1/2 overflow-hidden flex-col ${mobileView === 'editor' ? 'hidden sm:flex' : 'flex'}`}
        >
          {isEmpty ? (
            <EmptyState
              onImport={() => setImportOpen(true)}
              onSample={() => setResume(sampleResume)}
              onFile={async (file) => {
                const parsed = await parseResumeFile(file);
                setResume(parsed);
              }}
            />
          ) : (
            <ResumePreview />
          )}
        </div>
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function EmptyState({
  onImport,
  onSample,
  onFile,
}: {
  onImport: () => void;
  onSample: () => void;
  onFile: (file: File) => void;
}) {
  const t = useT();
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-bg">
      <div className="max-w-md w-full text-center">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 cursor-pointer transition-colors ${
            dragging
              ? 'border-accent bg-bg-accent'
              : 'border-border hover:border-text-muted hover:bg-bg-hover'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".json,.yaml,.yml,.pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onFile(e.target.files[0]);
            }}
          />
          <div className="text-3xl text-text-faint mb-4">+</div>
          <div className="text-sm text-text-tertiary mb-1">{t('empty.drop')}</div>
          <div className="text-xs text-text-muted">{t('empty.formats')}</div>
        </div>
        <div className="mt-6 text-xs text-text-muted">{t('empty.or')}</div>
        <div className="mt-4 flex gap-3 justify-center">
          <button
            onClick={onSample}
            className="text-xs px-4 py-2 border border-border rounded-md hover:bg-bg-hover cursor-pointer text-text-secondary"
          >
            {t('empty.loadSample')}
          </button>
          <button
            onClick={onImport}
            className="text-xs px-4 py-2 border border-border rounded-md hover:bg-bg-hover cursor-pointer text-text-secondary"
          >
            {t('empty.pasteJson')}
          </button>
        </div>
        <p className="mt-6 text-xs text-text-faint">{t('empty.hint')}</p>
      </div>
    </div>
  );
}

export default App;
