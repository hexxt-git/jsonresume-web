import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { ResumeEditor } from './components/editor/ResumeEditor';
import { ResumePreview } from './components/preview/ResumePreview';
import { ImportDialog } from './components/import-export/ImportDialog';
import { ExportDialog } from './components/import-export/ExportDialog';
import { useResumeStore, activeSlot } from './store/resumeStore';

import { SlotsPicker } from './components/slots/SlotsPicker';
import { sampleResume } from './utils/sample';
import { parseResumeFile } from './parser';
import { useSettingsStore, type ColorMode } from './store/settingsStore';
import { useT, locales, type Locale } from './i18n';
import { Select } from './components/ui/Select';
import { OnboardingDialog } from './components/OnboardingDialog';
import { useUndoRedo } from './hooks/useUndoRedo';
import { Sun1, Moon, Monitor } from 'iconsax-react';

const colorModeOptions = [
  { value: 'light', label: 'Light', icon: <Sun1 size={12} variant="Bold" color="currentColor" /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={12} variant="Bold" color="currentColor" /> },
  {
    value: 'system',
    label: 'System',
    icon: <Monitor size={12} variant="Bold" color="currentColor" />,
  },
];

function ColorModeToggle() {
  const mode = useSettingsStore((s) => s.colorMode);
  const setMode = useSettingsStore((s) => s.setColorMode);
  return (
    <Select
      value={mode}
      onValueChange={(v) => setMode(v as ColorMode)}
      options={colorModeOptions}
      size="sm"
    />
  );
}

function LocalePicker() {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
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

const colorModes: { value: ColorMode; label: string; icon: ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun1 size={14} variant="Bold" color="currentColor" /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={14} variant="Bold" color="currentColor" /> },
  {
    value: 'system',
    label: 'System',
    icon: <Monitor size={14} variant="Bold" color="currentColor" />,
  },
];

function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded overflow-hidden border border-border">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1 cursor-pointer transition-colors ${
            value === o.value
              ? 'bg-accent text-white'
              : 'bg-bg text-text-secondary hover:bg-bg-hover'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MobileMenu({
  reset,
  onImport,
  undo,
  redo,
  canUndo,
  canRedo,
}: {
  reset: () => void;
  onImport: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const colorMode = useSettingsStore((s) => s.colorMode);
  const setColorMode = useSettingsStore((s) => s.setColorMode);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  return (
    <div className="relative sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-1.5 py-1 border border-border rounded hover:bg-bg-hover cursor-pointer text-text-secondary"
      >
        &#8943;
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-bg border border-border rounded-lg shadow-lg p-2 space-y-2">
            <div className="flex gap-1">
              <button
                onClick={() => {
                  undo();
                  setOpen(false);
                }}
                disabled={!canUndo}
                className="flex-1 text-xs px-2 py-1.5 text-text-secondary hover:bg-bg-hover rounded cursor-pointer disabled:opacity-30 disabled:cursor-default"
              >
                {t('undo.undo')}
              </button>
              <button
                onClick={() => {
                  redo();
                  setOpen(false);
                }}
                disabled={!canRedo}
                className="flex-1 text-xs px-2 py-1.5 text-text-secondary hover:bg-bg-hover rounded cursor-pointer disabled:opacity-30 disabled:cursor-default"
              >
                {t('undo.redo')}
              </button>
            </div>
            <div className="border-t border-border pt-2">
              <button
                onClick={() => {
                  onImport();
                  setOpen(false);
                }}
                className="w-full text-xs px-2 py-1.5 text-left text-text-secondary hover:bg-bg-hover rounded cursor-pointer"
              >
                {t('app.import')}
              </button>
            </div>
            <div className="border-t border-border pt-2">
              <ButtonGroup options={colorModes} value={colorMode} onChange={setColorMode} />
            </div>
            <ButtonGroup
              options={locales.map((l) => ({ value: l.id, label: l.label }))}
              value={locale}
              onChange={(v) => setLocale(v as Locale)}
            />
            <div className="border-t border-border pt-2">
              <button
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                className="w-full text-xs px-2 py-1.5 text-left text-danger hover:bg-bg-hover rounded cursor-pointer"
              >
                {t('app.reset')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SplitPane({
  mobileView,
  setMobileView,
  children,
}: {
  mobileView: 'editor' | 'preview';
  setMobileView: (v: 'editor' | 'preview') => void;
  children: React.ReactNode;
}) {
  const t = useT();
  const splitPct = useSettingsStore((s) => s.splitPct);
  const setSplitPct = useSettingsStore((s) => s.setSplitPct);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(80, Math.max(20, pct)));
    },
    [setSplitPct],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const pct = Math.min(80, Math.max(20, splitPct));

  return (
    <div
      ref={containerRef}
      className="flex-1 flex min-h-0"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Inject dynamic split width via media query so mobile stays full-width */}
      <style>{`@media(min-width:640px){.split-editor{width:${pct}% !important}}`}</style>

      <div
        className={`split-editor h-full overflow-hidden shrink-0 ${
          mobileView === 'preview' ? 'hidden sm:block' : ''
        }`}
        style={{ width: '100%' }}
      >
        <ResumeEditor onShowPreview={() => setMobileView('preview')} />
      </div>
      {/* Drag handle — desktop only */}
      <div
        onPointerDown={onPointerDown}
        className="hidden sm:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-border hover:bg-accent/30 transition-colors"
      >
        <div className="w-0.5 h-8 rounded-full bg-text-muted/40" />
      </div>
      <div
        className={`h-full overflow-hidden flex-col flex-1 min-w-0 ${
          mobileView === 'editor' ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Mobile: back to editor button */}
        <button
          onClick={() => setMobileView('editor')}
          className="sm:hidden flex items-center gap-1 px-3 py-1.5 text-xs text-accent-text border-b border-border shrink-0 cursor-pointer hover:bg-bg-hover"
        >
          &larr; {t('app.editor')}
        </button>
        {children}
      </div>
    </div>
  );
}

function App() {
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('preview');
  const t = useT();
  const slot = useResumeStore((s) => activeSlot(s));
  const resume = slot.resume;
  const setResume = useResumeStore((s) => s.setResume);
  const reset = useResumeStore((s) => s.reset);
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const slots = useResumeStore((s) => s.slots);
  const saveSlot = useResumeStore((s) => s.saveSlot);

  // Bootstrap: ensure at least one slot always exists
  useEffect(() => {
    if (useResumeStore.getState().slots.length === 0) {
      saveSlot('');
    }
  }, [slots.length, saveSlot]);

  const isEmpty =
    !resume.basics?.name &&
    !resume.basics?.email &&
    !resume.work?.length &&
    !resume.education?.length &&
    !resume.skills?.length &&
    !resume.projects?.length;

  return (
    <div className="h-screen flex flex-col bg-bg">
      <header className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-bg shrink-0 gap-1">
        <h1 className="text-sm font-bold text-text tracking-tight shrink-0">{t('app.title')}</h1>
        <div className="flex items-center gap-1 shrink-0">
          <SlotsPicker />
          <button
            onClick={() => setImportOpen(true)}
            className="hidden sm:inline-flex text-xs px-2 py-1 border border-border rounded hover:bg-bg-hover transition-colors cursor-pointer text-text-secondary"
          >
            {t('app.import')}
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="text-xs px-2 py-1 bg-accent text-white rounded hover:opacity-90 transition-colors cursor-pointer"
            >
              {t('app.export')}
            </button>
            <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
          </div>
          <div className="hidden sm:flex items-center gap-1 ml-0.5">
            <ColorModeToggle />
            <LocalePicker />
            <button
              onClick={reset}
              className="text-xs px-2 py-1 border border-border rounded hover:bg-bg-hover transition-colors cursor-pointer text-danger"
            >
              {t('app.reset')}
            </button>
          </div>
          <MobileMenu
            reset={reset}
            onImport={() => setImportOpen(true)}
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      </header>

      <SplitPane mobileView={mobileView} setMobileView={setMobileView}>
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
      </SplitPane>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <OnboardingDialog />
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
