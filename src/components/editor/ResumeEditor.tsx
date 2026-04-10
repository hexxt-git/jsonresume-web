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
  const ActiveForm = formMap[activeSection];

  return (
    <div className="flex h-full">
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
  );
}
