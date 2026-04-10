import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { EditorSection } from '../../store/resumeStore';
import { useT } from '../../i18n';
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

export function ResumeEditor() {
  const t = useT();
  const activeSection = useResumeStore((s) => s.activeSection);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);
  const [tab, setTab] = useState<'form' | 'json' | 'themes' | 'style'>('form');
  const ActiveForm = formMap[activeSection];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setTab('form')}
          className={`px-4 py-2 text-xs font-medium cursor-pointer ${
            tab === 'form'
              ? 'text-accent-text border-b-2 border-accent'
              : 'text-text-tertiary hover:text-text'
          }`}
        >
          {t('editor.form')}
        </button>
        <button
          onClick={() => setTab('json')}
          className={`px-4 py-2 text-xs font-medium cursor-pointer ${
            tab === 'json'
              ? 'text-accent-text border-b-2 border-accent'
              : 'text-text-tertiary hover:text-text'
          }`}
        >
          {t('editor.json')}
        </button>
        <button
          onClick={() => setTab('themes')}
          className={`px-4 py-2 text-xs font-medium cursor-pointer ${
            tab === 'themes'
              ? 'text-accent-text border-b-2 border-accent'
              : 'text-text-tertiary hover:text-text'
          }`}
        >
          {t('editor.themes')}
        </button>
        <button
          onClick={() => setTab('style')}
          className={`px-4 py-2 text-xs font-medium cursor-pointer ${
            tab === 'style'
              ? 'text-accent-text border-b-2 border-accent'
              : 'text-text-tertiary hover:text-text'
          }`}
        >
          Style
        </button>
      </div>

      {tab === 'json' ? (
        <div className="flex-1 overflow-hidden">
          <JsonEditor />
        </div>
      ) : tab === 'themes' ? (
        <div className="flex-1 overflow-y-auto">
          <ThemePicker />
        </div>
      ) : tab === 'style' ? (
        <div className="flex-1 overflow-y-auto p-4">
          <ThemeCustomizer />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <nav className="w-32 shrink-0 border-r border-border bg-bg-secondary overflow-y-auto">
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
          <div className="flex-1 overflow-y-auto p-4">
            <ActiveForm />
          </div>
        </div>
      )}
    </div>
  );
}
