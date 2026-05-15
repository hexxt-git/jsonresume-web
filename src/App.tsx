import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { ResumeEditor } from '@/components/editor/ResumeEditor';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ImportDialog } from '@/components/import-export/ImportDialog';
import { ExportDialog } from '@/components/import-export/ExportDialog';
import { useResumeStore, activeSlot } from '@/store/resumeStore';

import { SlotsPicker } from '@/components/slots/SlotsPicker';
import { sampleResume } from '@/utils/sample';
import { parseResumeFile } from '@/parser';
import { useSettingsStore, type ColorMode } from '@/store/settingsStore';
import { useT, locales, type Locale } from '@/i18n';
import { Select } from '@/components/ui/Select';
import { OnboardingDialog } from '@/components/OnboardingDialog';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { Sun1, Moon, Monitor } from 'iconsax-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { Tabs } from '@/components/ui/Tabs';

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
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="px-2.5">
        &#8943;
      </Button>
      {open && (
        <>
          <div
            className="animate-in fade-in fixed inset-0 z-40 bg-black/5"
            onClick={() => setOpen(false)}
          />
          <div className="bg-bg animate-dropdown absolute top-full right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-xs space-y-3 rounded-2xl border p-3 shadow-xl">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  undo();
                  setOpen(false);
                }}
                disabled={!canUndo}
                className="flex-1 py-2 text-xs"
              >
                {t('undo.undo')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  redo();
                  setOpen(false);
                }}
                disabled={!canRedo}
                className="flex-1 py-2 text-xs"
              >
                {t('undo.redo')}
              </Button>
            </div>
            <div className="border-border border-t pt-3">
              <div className="flex flex-col gap-2">
                <div className="text-text-muted px-1 text-[10px] font-bold tracking-wider uppercase">
                  {t('slots.resumes')}
                </div>
                <SlotsPicker fullWidth />
              </div>
            </div>
            <div className="border-border border-t pt-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  onImport();
                  setOpen(false);
                }}
                className="justify-start px-3 text-xs"
              >
                {t('app.import')}
              </Button>
            </div>
            <div className="border-border space-y-3 border-t pt-3">
              <Tabs
                options={colorModes}
                value={colorMode}
                onChange={setColorMode}
                size="sm"
                className="w-full"
              />
              <Tabs
                options={locales.map((l) => ({ value: l.id, label: l.label }))}
                value={locale}
                onChange={(v) => setLocale(v as Locale)}
                size="sm"
                className="w-full"
              />
            </div>
            <div className="border-border border-t pt-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                className="border-danger/30 text-danger hover:bg-danger/10 justify-start px-3 text-xs"
              >
                {t('app.reset')}
              </Button>
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
      className="flex min-h-0 flex-1 overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Inject dynamic split width via media query so mobile stays full-width */}
      <style>{`@media(min-width:640px){.split-editor{width:${pct}% !important}}`}</style>

      <div
        className={cn(
          'split-editor h-full min-h-0 shrink-0 overflow-hidden',
          mobileView === 'preview' ? 'hidden sm:block' : '',
        )}
        style={{ width: '100%' }}
      >
        <ResumeEditor onShowPreview={() => setMobileView('preview')} />
      </div>
      {/* Drag handle — desktop only */}
      <div
        onPointerDown={onPointerDown}
        className="bg-border hover:bg-accent/30 hidden w-1.5 shrink-0 cursor-col-resize items-center justify-center transition-colors sm:flex"
      >
        <div className="bg-text-muted/40 h-8 w-0.5 rounded-full" />
      </div>
      <div
        className={cn(
          'min-w-0 flex-1 flex-col overflow-hidden',
          mobileView === 'editor' ? 'hidden sm:flex' : 'flex',
        )}
      >
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
    <div className="bg-bg fixed inset-0 flex flex-col overflow-hidden">
      <header className="border-border bg-bg flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3">
        <h1 className="text-text shrink-0 text-sm font-bold tracking-tight">{t('app.title')}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <div className="ml-1 hidden items-center gap-2 sm:flex">
            <ColorModeToggle />
            <LocalePicker />
          </div>
          <div className="hidden sm:block">
            <SlotsPicker />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="hidden sm:inline-flex"
          >
            {t('app.import')}
          </Button>
          <div className="relative">
            <Button size="sm" onClick={() => setExportOpen(!exportOpen)}>
              {t('app.export')}
            </Button>
            <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
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
          <ErrorBoundary label="preview">
            <ResumePreview onBack={() => setMobileView('editor')} />
          </ErrorBoundary>
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
    <div className="bg-bg animate-in fade-in flex flex-1 items-center justify-center p-6 duration-200">
      <div className="animate-in slide-up w-full max-w-lg space-y-6 text-center delay-100 duration-200">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'cursor-pointer rounded-3xl border-2 border-dashed p-12 transition-all',
            dragging ? 'border-accent bg-bg-accent' : 'hover:border-accent hover:bg-bg-hover',
          )}
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
          <div className="text-text-faint mb-4 text-4xl">+</div>
          <div className="text-text-secondary mb-2 text-base font-medium">{t('empty.drop')}</div>
          <div className="text-text-muted text-xs">{t('empty.formats')}</div>
        </div>
        <div className="text-text-muted before:bg-border after:bg-border flex items-center gap-4 text-xs before:h-px before:flex-1 after:h-px after:flex-1">
          {t('empty.or')}
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="md" onClick={onSample}>
            {t('empty.loadSample')}
          </Button>
          <Button variant="outline" size="md" onClick={onImport}>
            {t('empty.pasteJson')}
          </Button>
        </div>
        <p className="text-text-faint text-xs italic">{t('empty.hint')}</p>
      </div>
    </div>
  );
}

export default App;
