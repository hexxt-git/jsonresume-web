import type { SectionMap } from '../types';
import { parseProfile } from './profile';
import { parseEducation } from './education';
import { parseWork } from './work';
import { parseProjects } from './projects';
import { parseSkills } from './skills';

export function extractAllSections(sections: SectionMap) {
  const { profile } = parseProfile(sections);
  const { educations } = parseEducation(sections);
  const { workExperiences } = parseWork(sections);
  const { projects } = parseProjects(sections);
  const { skills } = parseSkills(sections);

  return {
    profile,
    educations,
    workExperiences,
    projects,
    skills,
    custom: { descriptions: [] as string[] },
  };
}
