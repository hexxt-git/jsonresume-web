import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import type { EditorSection } from '../../store/resumeStore';
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

const sections: { id: EditorSection; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'work', label: 'Work' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'languages', label: 'Languages' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'awards', label: 'Awards' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'publications', label: 'Publications' },
  { id: 'interests', label: 'Interests' },
  { id: 'references', label: 'References' },
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
  const activeSection = useResumeStore((s) => s.activeSection);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);
  const [tab, setTab] = useState<'form' | 'json' | 'themes'>('form');
  const ActiveForm = formMap[activeSection];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setTab('form')}
          className={`px-4 py-2 text-xs font-medium cursor-pointer ${
            tab === 'form'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Form
        </button>
        <button
          onClick={() => setTab('json')}
          className={`px-4 py-2 text-xs font-medium cursor-pointer ${
            tab === 'json'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          JSON
        </button>
        <button
          onClick={() => setTab('themes')}
          className={`px-4 py-2 text-xs font-medium cursor-pointer ${
            tab === 'themes'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Themes
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
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <nav className="w-32 shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                  activeSection === s.id
                    ? 'bg-white text-blue-600 font-semibold border-r-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s.label}
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
