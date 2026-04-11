import { useState, lazy, Suspense, useRef, useEffect, useCallback } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { EditorSection } from '../../store/resumeStore';
import { useSettingsStore, type EditorTab } from '../../store/settingsStore';
import { useT } from '../../i18n';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { Undo2, Redo2 } from 'lucide-react';

const AiChat = lazy(() => import('./AiChat'));
const JsonEditor = lazy(() => import('./JsonEditor'));
const AutomationHub = lazy(() => import('../automation/AutomationHub'));
import { AiGate, AiProviderSettings } from './AiKeyGate';
import { ErrorBoundary } from '../ErrorBoundary';

function LazyFallback() {
  const t = useT();
  return (
    <div className="h-full flex items-center justify-center text-xs text-text-tertiary">
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
    className="inline-block ml-0.5 -mt-0.5"
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
    `shrink-0 px-2.5 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
      active ? 'text-accent-text border-b-2 border-accent' : 'text-text-tertiary'
    }`;

  const sectionCls = (active: boolean) =>
    `shrink-0 px-2 py-1.5 text-xs cursor-pointer whitespace-nowrap transition-colors ${
      active ? 'text-accent-text border-b-2 border-accent' : 'text-text-muted'
    }`;

  return (
    <div className="sm:hidden shrink-0">
      {/* Row 1: mode tabs */}
      <div className="flex border-b border-border">
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
          <>
            <div className="flex-1" />
            <button
              onClick={onShowPreview}
              className="shrink-0 px-2.5 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap text-accent-text"
            >
              {t('app.preview')} &rarr;
            </button>
          </>
        )}
      </div>
      {/* Row 2: section pills (only in form mode) */}
      {tab === 'form' && (
        <div className="flex overflow-x-auto border-b border-border bg-bg-secondary scrollbar-none">
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

/* ── Desktop tab bar (unchanged) ──────────────────────── */

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
    `px-4 py-2 text-xs font-medium cursor-pointer ${
      active ? 'text-accent-text border-b-2 border-accent' : 'text-text-tertiary hover:text-text'
    }`;
  const undoCls =
    'p-1.5 rounded hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default';
  return (
    <div className="hidden sm:flex border-b border-border shrink-0">
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
      <div className="flex items-center gap-0.5 pr-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={undoCls}
          title={`${t('undo.undo')} (Cmd+Z)`}
        >
          <Undo2 size={14} className="text-text-muted" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={undoCls}
          title={`${t('undo.redo')} (Cmd+Shift+Z)`}
        >
          <Redo2 size={14} className="text-text-muted" />
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
      className="flex flex-1 overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Desktop sidebar */}
      <nav
        className="hidden sm:block shrink-0 bg-bg-secondary overflow-y-auto"
        style={{ width: `${pct}%` }}
      >
        {sectionIds.map((id) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
              activeSection === id
                ? 'bg-bg text-accent-text font-semibold border-r-2 border-accent'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {t(`section.${id}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </nav>
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        className="hidden sm:flex w-1 shrink-0 cursor-col-resize items-center justify-center bg-border hover:bg-accent/30 transition-colors"
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <ActiveForm />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          {prev ? (
            <button
              onClick={() => setActiveSection(prev)}
              className="text-xs px-3 py-1.5 border border-border rounded hover:bg-bg-hover cursor-pointer text-text-secondary"
            >
              &larr; {t(`section.${prev}` as Parameters<typeof t>[0])}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button
              onClick={() => setActiveSection(next)}
              className="text-xs px-3 py-1.5 border border-border rounded hover:bg-bg-hover cursor-pointer text-text-secondary"
            >
              {t(`section.${next}` as Parameters<typeof t>[0])} &rarr;
            </button>
          ) : (
            <button
              onClick={() => onSwitchTab('themes')}
              className="text-xs px-3 py-1.5 border border-border rounded hover:bg-bg-hover cursor-pointer text-text-secondary"
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
    <div className="flex flex-col h-full">
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
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
            <span className="text-xs font-medium text-text">{t('ai.settings')}</span>
            <button
              onClick={() => setAiSettings(false)}
              className="text-xs text-accent hover:underline cursor-pointer"
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
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-border">
            <button
              onClick={() => setCustomizeOpen(!customizeOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-text-secondary hover:bg-bg-hover cursor-pointer transition-colors"
            >
              <span>{t('customize.title')}</span>
              <span className="text-text-muted">{customizeOpen ? '\u25B4' : '\u25BE'}</span>
            </button>
            {customizeOpen && (
              <div className="px-4 pb-4">
                <ThemeCustomizer />
              </div>
            )}
          </div>
          <ThemePicker />
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
