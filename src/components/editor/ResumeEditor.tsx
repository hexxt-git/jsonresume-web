import { useState, lazy, Suspense, useRef, useEffect } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { EditorSection } from '../../store/resumeStore';
import { useT } from '../../i18n';

const AiChat = lazy(() => import('./AiChat'));
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
import { JsonEditor } from './JsonEditor';
import { ThemePicker } from '../themes/ThemePicker';
import { ThemeCustomizer } from '../themes/ThemeCustomizer';

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

type Tab = 'form' | 'json' | 'themes' | 'ai';

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
          {t('editor.ai')}
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
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  t: ReturnType<typeof useT>;
}) {
  const cls = (active: boolean) =>
    `px-4 py-2 text-xs font-medium cursor-pointer ${
      active ? 'text-accent-text border-b-2 border-accent' : 'text-text-tertiary hover:text-text'
    }`;
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
        {t('editor.ai')}
      </button>
    </div>
  );
}

/* ── Form content with sidebar (desktop) + prev/next ─── */

function FormContent({
  activeSection,
  setActiveSection,
  t,
  ActiveForm,
}: {
  activeSection: EditorSection;
  setActiveSection: (s: EditorSection) => void;
  t: ReturnType<typeof useT>;
  ActiveForm: React.FC;
}) {
  const idx = sectionIds.indexOf(activeSection);
  const prev = idx > 0 ? sectionIds[idx - 1] : null;
  const next = idx < sectionIds.length - 1 ? sectionIds[idx + 1] : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Desktop sidebar */}
      <nav className="hidden sm:block w-32 shrink-0 border-r border-border bg-bg-secondary overflow-y-auto">
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
            <span />
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
  const [tab, setTab] = useState<Tab>('form');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const ActiveForm = formMap[activeSection];

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
      <DesktopTabBar tab={tab} setTab={setTab} t={t} />

      {tab === 'ai' ? (
        <div className="flex-1 overflow-hidden">
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                Loading...
              </div>
            }
          >
            <AiChat />
          </Suspense>
        </div>
      ) : tab === 'json' ? (
        <div className="flex-1 overflow-hidden">
          <JsonEditor />
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
        />
      )}
    </div>
  );
}
