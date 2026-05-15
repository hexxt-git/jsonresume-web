import { useState, lazy, Suspense, useRef, useEffect, useCallback } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import type { EditorSection } from '@/store/resumeStore';
import { useSettingsStore, type EditorTab } from '@/store/settingsStore';
import { useT } from '@/i18n';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { SparkleIcon } from '@/assets/Icons';
import { Setting } from 'iconsax-react';

const AiChat = lazy(() => import('@/components/ai/AiChat'));
const JsonEditor = lazy(() => import('./JsonEditor'));
const AutomationHub = lazy(() => import('@/components/automation/AutomationHub'));
import { AiGate, AiProviderSettings } from '@/components/ai/AiKeyGate';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function LazyFallback() {
  const t = useT();
  return (
    <div className="text-text-tertiary flex h-full w-full items-center justify-center text-xs">
      {t('ui.loading')}
    </div>
  );
}

import { BasicsForm } from './BasicsForm';
import { WorkForm } from './WorkForm';
import { EducationForm } from './EducationForm';
import { SkillsForm } from './SkillsForm';
import { ProjectsForm } from './ProjectsForm';
import {
  VolunteerForm,
  AwardsForm,
  CertificatesForm,
  PublicationsForm,
  LanguagesForm,
  InterestsForm,
  ReferencesForm,
} from './OtherSections';
import { ThemePicker } from '@/components/themes/ThemePicker';
import { ThemeCustomizer } from '@/components/themes/ThemeCustomizer';
import { ScrollArea } from '@/components/ui/ScrollArea';

const sectionIds: EditorSection[] = [
  'basics',
  'work',
  'education',
  'skills',
  'projects',
  'languages',
  'volunteer',
  'awards',
  'certificates',
  'publications',
  'interests',
  'references',
];

const formMap: Record<EditorSection, React.FC> = {
  basics: BasicsForm,
  work: WorkForm,
  education: EducationForm,
  skills: SkillsForm,
  projects: ProjectsForm,
  languages: LanguagesForm,
  volunteer: VolunteerForm,
  awards: AwardsForm,
  certificates: CertificatesForm,
  publications: PublicationsForm,
  interests: InterestsForm,
  references: ReferencesForm,
};

type Tab = EditorTab;

/* ── Mobile: single unified scrollable tab bar ────────── */

function MobileTabBar({
  tab,
  setTab,
  activeSection,
  setActiveSection,
  onShowPreview,
  t,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  activeSection: EditorSection;
  setActiveSection: (s: EditorSection) => void;
  onShowPreview?: () => void;
  t: ReturnType<typeof useT>;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active item into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeSection, tab]);

  return (
    <div className="bg-bg shrink-0 sm:hidden">
      {/* Row 1: mode tabs */}
      <div className="border-border bg-bg-secondary/30 flex items-center border-b">
        <ScrollArea className="max-w-full flex-1 mask-[linear-gradient(to_right,black_calc(100%-64px),transparent_100%)]">
          <div className="flex w-max gap-2 p-2">
            <button
              onClick={() => setTab('form')}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                tab === 'form' ? 'bg-accent text-white' : 'text-text-tertiary hover:bg-bg-hover',
              )}
            >
              {t('editor.form')}
            </button>
            <button
              onClick={() => setTab('json')}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                tab === 'json' ? 'bg-accent text-white' : 'text-text-tertiary hover:bg-bg-hover',
              )}
            >
              {t('editor.json')}
            </button>
            <button
              onClick={() => setTab('themes')}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                tab === 'themes' ? 'bg-accent text-white' : 'text-text-tertiary hover:bg-bg-hover',
              )}
            >
              {t('editor.themes')}
            </button>
            <button
              onClick={() => setTab('ai')}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                tab === 'ai' ? 'bg-accent text-white' : 'text-text-tertiary hover:bg-bg-hover',
              )}
            >
              {t('editor.ai')} <SparkleIcon className="-mt-0.5 ml-0.5 inline-block" />
            </button>
            <button
              onClick={() => setTab('auto')}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                tab === 'auto' ? 'bg-accent text-white' : 'text-text-tertiary hover:bg-bg-hover',
              )}
            >
              {t('editor.auto')}
            </button>
          </div>
        </ScrollArea>
        {onShowPreview && (
          <div className="p-2 pr-3">
            <button
              onClick={onShowPreview}
              className="text-accent-text border-accent/20 hover:bg-bg-accent shrink-0 cursor-pointer rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all"
            >
              {t('app.preview')} &rarr;
            </button>
          </div>
        )}
      </div>
      {/* Row 2: section pills (only in form mode) */}
      {tab === 'form' && (
        <ScrollArea className="border-border bg-bg max-w-full border-b">
          <div className="flex w-max gap-2 p-2">
            {sectionIds.map((id) => {
              const active = id === activeSection;
              return (
                <button
                  key={id}
                  ref={active ? activeRef : undefined}
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all',
                    active
                      ? 'bg-accent border-accent text-white'
                      : 'text-text-muted border-border hover:bg-bg-hover',
                  )}
                >
                  {t(`section.${id}` as Parameters<typeof t>[0])}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

/* ── Desktop tab bar ──────────────────────── */

function DesktopTabBar({
  tab,
  setTab,
  t,
  undo,
  redo,
  canUndo,
  canRedo,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  t: ReturnType<typeof useT>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const cls = (active: boolean) =>
    cn(
      'px-4 py-2 text-xs font-semibold cursor-pointer transition-all rounded-full',
      active ? 'bg-accent text-white' : 'text-text-tertiary hover:text-text hover:bg-bg-hover',
    );
  const undoCls =
    'p-2 rounded-full hover:bg-bg-hover transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default border border-transparent hover:border-border';
  return (
    <div className="border-border hidden shrink-0 items-center gap-2 border-b p-2 sm:flex">
      <button onClick={() => setTab('form')} className={cls(tab === 'form')}>
        {t('editor.form')}
      </button>
      <button onClick={() => setTab('json')} className={cls(tab === 'json')}>
        {t('editor.json')}
      </button>
      <button onClick={() => setTab('themes')} className={cls(tab === 'themes')}>
        {t('editor.themes')}
      </button>
      <button onClick={() => setTab('ai')} className={cls(tab === 'ai')}>
        {t('editor.ai')} <SparkleIcon className="-mt-0.5 ml-0.5 inline-block" />
      </button>
      <button onClick={() => setTab('auto')} className={cls(tab === 'auto')}>
        {t('editor.auto')}
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2 pr-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={undoCls}
          title={`${t('undo.undo')} (Cmd+Z)`}
        >
          <Undo2 size={16} className="text-text-muted" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={undoCls}
          title={`${t('undo.redo')} (Cmd+Shift+Z)`}
        >
          <Redo2 size={16} className="text-text-muted" />
        </button>
      </div>
    </div>
  );
}

/* ── Form content with sidebar (desktop) + prev/next ─── */

function FormContent({
  activeSection,
  setActiveSection,
  t,
  ActiveForm,
  onSwitchTab,
}: {
  activeSection: EditorSection;
  setActiveSection: (s: EditorSection) => void;
  t: ReturnType<typeof useT>;
  ActiveForm: React.FC;
  onSwitchTab: (tab: Tab) => void;
}) {
  const idx = sectionIds.indexOf(activeSection);
  const prev = idx > 0 ? sectionIds[idx - 1] : null;
  const next = idx < sectionIds.length - 1 ? sectionIds[idx + 1] : null;

  const sidebarPct = useSettingsStore((s) => s.sidebarPct);
  const setSidebarPct = useSettingsStore((s) => s.setSidebarPct);
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
      setSidebarPct(Math.min(50, Math.max(15, pct)));
    },
    [setSidebarPct],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const pct = Math.min(50, Math.max(15, sidebarPct));

  return (
    <div
      ref={containerRef}
      className="bg-bg flex min-h-0 flex-1 overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Desktop sidebar */}
      <ScrollArea
        className="bg-bg-secondary/50 hidden shrink-0 sm:block"
        style={{ width: `${pct}%` }}
      >
        <nav className="space-y-0.5 p-2">
          {sectionIds.map((id) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'w-full cursor-pointer rounded-full px-3 py-2 text-left text-xs font-medium transition-all',
                activeSection === id
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text',
              )}
            >
              {t(`section.${id}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </nav>
      </ScrollArea>
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        className="bg-border/50 hover:bg-accent/30 hidden w-1 shrink-0 cursor-col-resize items-center justify-center transition-all sm:flex"
      />
      <ScrollArea className="bg-bg min-h-0 flex-1">
        <div className="mx-auto max-w-3xl p-5">
          <ActiveForm />
        </div>
        <div className="flex items-center justify-between px-6 pt-4 pb-8">
          {prev ? (
            <Button
              variant="outline"
              onClick={() => setActiveSection(prev)}
              className="px-4 py-2 font-semibold"
            >
              &larr; {t(`section.${prev}` as Parameters<typeof t>[0])}
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button
              variant="outline"
              onClick={() => setActiveSection(next)}
              className="px-4 py-2 font-semibold"
            >
              {t(`section.${next}` as Parameters<typeof t>[0])} &rarr;
            </Button>
          ) : (
            <Button onClick={() => onSwitchTab('themes')} className="px-4 py-2">
              {t('editor.themes')} &rarr;
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── Main editor ──────────────────────────────────────── */

export function ResumeEditor({ onShowPreview }: { onShowPreview?: () => void }) {
  const t = useT();
  const activeSection = useResumeStore((s) => s.activeSection);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);
  const resetCustomization = useResumeStore((s) => s.resetCustomization);
  const tab = useSettingsStore((s) => s.editorTab);
  const setTab = useSettingsStore((s) => s.setEditorTab);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState(false);
  const ActiveForm = formMap[activeSection];
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <MobileTabBar
        tab={tab}
        setTab={setTab}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onShowPreview={onShowPreview}
        t={t}
      />
      <DesktopTabBar
        tab={tab}
        setTab={setTab}
        t={t}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {aiSettings && (tab === 'ai' || tab === 'auto') ? (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-2">
            <span className="text-text text-xs font-medium">{t('ai.settings')}</span>
            <button
              onClick={() => setAiSettings(false)}
              className="text-accent cursor-pointer text-xs hover:underline"
            >
              {t('ai.back')}
            </button>
          </div>
          <AiProviderSettings />
        </div>
      ) : tab === 'auto' ? (
        <AiGate onSetup={() => setAiSettings(true)}>
          <div className="flex min-h-0 w-full flex-1 overflow-hidden">
            <ErrorBoundary label="automation">
              <Suspense fallback={<LazyFallback />}>
                <AutomationHub />
              </Suspense>
            </ErrorBoundary>
          </div>
        </AiGate>
      ) : tab === 'ai' ? (
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">
          <ErrorBoundary label="ai-chat">
            <Suspense fallback={<LazyFallback />}>
              <AiChat />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : tab === 'json' ? (
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">
          <ErrorBoundary label="json-editor">
            <Suspense fallback={<LazyFallback />}>
              <JsonEditor />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : tab === 'themes' ? (
        <div className="bg-bg flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <ScrollArea className="min-h-0 w-full flex-1">
            <div className="p-4">
              <div
                className={cn(
                  'border-border mx-auto mb-8 w-full max-w-3xl overflow-hidden rounded-3xl border transition-all duration-150',
                  customizeOpen ? 'bg-bg' : 'bg-bg-secondary/30 hover:bg-bg-secondary/50',
                )}
              >
                <div
                  onClick={() => setCustomizeOpen(!customizeOpen)}
                  className="flex w-full cursor-pointer items-center justify-between px-6 py-5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300',
                        customizeOpen
                          ? 'bg-accent rotate-90 text-white'
                          : 'bg-bg-tertiary text-text-muted',
                      )}
                    >
                      <Setting size={24} variant={customizeOpen ? 'Bold' : 'Linear'} />
                    </div>
                    <div>
                      <h3 className="text-text text-sm font-bold">Style Overrides</h3>
                      <p className="text-text-muted mt-0.5 text-[11px] font-medium">
                        Personalize colors, fonts, and spacing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {customizeOpen && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetCustomization();
                        }}
                        className="bg-danger/10 text-danger border-danger/30 hover:bg-danger/20 animate-in fade-in zoom-in-95 flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-150"
                        title={t('customize.reset')}
                      >
                        <span>&#8634;</span>
                        <span className="hidden sm:inline">Reset</span>
                      </button>
                    )}
                    <div
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors duration-150',
                        customizeOpen ? 'bg-accent' : 'bg-text-faint',
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                          customizeOpen && 'translate-x-5',
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid-collapsible" data-open={customizeOpen}>
                  <div className="grid-collapsible-content">
                    <div className="border-border/40 border-t px-6 pt-8 pb-10">
                      <ThemeCustomizer />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mx-auto w-full max-w-3xl">
                <ThemePicker />
              </div>
            </div>
          </ScrollArea>
        </div>
      ) : (
        <FormContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          t={t}
          ActiveForm={ActiveForm}
          onSwitchTab={setTab}
        />
      )}
    </div>
  );
}
