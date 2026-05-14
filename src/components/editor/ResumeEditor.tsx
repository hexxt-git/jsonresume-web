import { useState, lazy, Suspense, useRef, useEffect, useCallback } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { EditorSection } from '../../store/resumeStore';
import { useSettingsStore, type EditorTab } from '../../store/settingsStore';
import { useT } from '../../i18n';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { Undo2, Redo2 } from 'lucide-react';

const AiChat = lazy(() => import('../ai/AiChat'));
const JsonEditor = lazy(() => import('./JsonEditor'));
const AutomationHub = lazy(() => import('../automation/AutomationHub'));
import { AiGate, AiProviderSettings } from '../ai/AiKeyGate';
import { ErrorBoundary } from '../ErrorBoundary';

function LazyFallback() {
  const t = useT();
  return (
    <div className="text-text-tertiary flex h-full items-center justify-center text-xs">
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
import { ThemePicker } from '../themes/ThemePicker';
import { ThemeCustomizer } from '../themes/ThemeCustomizer';

const Sparkle = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="-mt-0.5 ml-0.5 inline-block"
  >
    <path d="M12 0L14.5 7.5C15 9 15 9 16.5 9.5L24 12L16.5 14.5C15 15 15 15 14.5 16.5L12 24L9.5 16.5C9 15 9 15 7.5 14.5L0 12L7.5 9.5C9 9 9 9 9.5 7.5L12 0Z" />
  </svg>
);

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

  const tabCls = (active: boolean) =>
    `shrink-0 px-4 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap transition-all rounded-full ${
      active ? 'bg-accent text-white shadow-sm' : 'text-text-tertiary hover:bg-bg-hover'
    }`;

  const sectionCls = (active: boolean) =>
    `shrink-0 px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap transition-all rounded-full border ${
      active
        ? 'bg-accent text-white border-accent shadow-sm'
        : 'text-text-muted border hover:bg-bg-hover'
    }`;

  return (
    <div className="bg-bg shrink-0 sm:hidden">
      {/* Row 1: mode tabs */}
      <div className="border-border scrollbar-none bg-bg-secondary/30 flex gap-2 overflow-x-auto border-b p-2">
        <button onClick={() => setTab('form')} className={tabCls(tab === 'form')}>
          {t('editor.form')}
        </button>
        <button onClick={() => setTab('json')} className={tabCls(tab === 'json')}>
          {t('editor.json')}
        </button>
        <button onClick={() => setTab('themes')} className={tabCls(tab === 'themes')}>
          {t('editor.themes')}
        </button>
        <button onClick={() => setTab('ai')} className={tabCls(tab === 'ai')}>
          {t('editor.ai')} <Sparkle />
        </button>
        <button onClick={() => setTab('auto')} className={tabCls(tab === 'auto')}>
          {t('editor.auto')}
        </button>
        {onShowPreview && (
          <button
            onClick={onShowPreview}
            className="text-accent-text border-accent/20 hover:bg-bg-accent shrink-0 cursor-pointer rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all"
          >
            {t('app.preview')} &rarr;
          </button>
        )}
      </div>
      {/* Row 2: section pills (only in form mode) */}
      {tab === 'form' && (
        <div className="border-border bg-bg scrollbar-none flex gap-2 overflow-x-auto border-b p-2">
          {sectionIds.map((id) => {
            const active = id === activeSection;
            return (
              <button
                key={id}
                ref={active ? activeRef : undefined}
                onClick={() => setActiveSection(id)}
                className={sectionCls(active)}
              >
                {t(`section.${id}` as Parameters<typeof t>[0])}
              </button>
            );
          })}
        </div>
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
    `px-4 py-2 text-xs font-semibold cursor-pointer transition-all rounded-full ${
      active
        ? 'bg-accent text-white shadow-sm'
        : 'text-text-tertiary hover:text-text hover:bg-bg-hover'
    }`;
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
        {t('editor.ai')} <Sparkle />
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
      className="bg-bg flex flex-1 overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Desktop sidebar */}
      <nav
        className="bg-bg-secondary/50 hidden shrink-0 space-y-0.5 overflow-y-auto p-2 sm:block"
        style={{ width: `${pct}%` }}
      >
        {sectionIds.map((id) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full cursor-pointer rounded-full px-3 py-2 text-left text-xs font-medium transition-all ${
              activeSection === id
                ? 'bg-accent text-white shadow-md'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text'
            }`}
          >
            {t(`section.${id}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </nav>
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        className="bg-border/50 hover:bg-accent/30 hidden w-1 shrink-0 cursor-col-resize items-center justify-center transition-all sm:flex"
      />
      <div className="bg-bg flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-5">
          <ActiveForm />
        </div>
        <div className="flex items-center justify-between px-6 pt-4 pb-8">
          {prev ? (
            <button
              onClick={() => setActiveSection(prev)}
              className="border-border hover:bg-bg-hover text-text-secondary cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              &larr; {t(`section.${prev}` as Parameters<typeof t>[0])}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button
              onClick={() => setActiveSection(next)}
              className="border-border hover:bg-bg-hover text-text-secondary cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              {t(`section.${next}` as Parameters<typeof t>[0])} &rarr;
            </button>
          ) : (
            <button
              onClick={() => onSwitchTab('themes')}
              className="bg-accent cursor-pointer rounded-full px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-90"
            >
              {t('editor.themes')} &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main editor ──────────────────────────────────────── */

export function ResumeEditor({ onShowPreview }: { onShowPreview?: () => void }) {
  const t = useT();
  const activeSection = useResumeStore((s) => s.activeSection);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);
  const tab = useSettingsStore((s) => s.editorTab);
  const setTab = useSettingsStore((s) => s.setEditorTab);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState(false);
  const ActiveForm = formMap[activeSection];
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  return (
    <div className="flex h-full flex-col">
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
        <div className="flex flex-1 flex-col overflow-hidden">
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
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary label="automation">
              <Suspense fallback={<LazyFallback />}>
                <AutomationHub />
              </Suspense>
            </ErrorBoundary>
          </div>
        </AiGate>
      ) : tab === 'ai' ? (
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary label="ai-chat">
            <Suspense fallback={<LazyFallback />}>
              <AiChat />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : tab === 'json' ? (
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary label="json-editor">
            <Suspense fallback={<LazyFallback />}>
              <JsonEditor />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : tab === 'themes' ? (
        <div className="bg-bg flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="border-border bg-bg-secondary/20 mb-6 overflow-hidden rounded-2xl border">
              <button
                onClick={() => setCustomizeOpen(!customizeOpen)}
                className="text-text-secondary hover:bg-bg-hover flex w-full cursor-pointer items-center justify-between px-6 py-4 text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">{t('customize.title')}</span>
                <span
                  className="text-text-muted transition-transform duration-200"
                  style={{ transform: customizeOpen ? 'rotate(180deg)' : 'none' }}
                >
                  &#9662;
                </span>
              </button>
              {customizeOpen && (
                <div className="px-6 pb-6">
                  <ThemeCustomizer />
                </div>
              )}
            </div>
            <ThemePicker />
          </div>
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
