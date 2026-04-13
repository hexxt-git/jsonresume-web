import type { ResumeSectionToLines } from '../types';
import { extractProfile } from './extract-profile';
import { extractEducation } from './extract-education';
import { extractWorkExperience } from './extract-work-experience';
import { extractProject } from './extract-project';
import { extractSkills } from './extract-skills';

export const extractResumeFromSections = (sections: ResumeSectionToLines) => {
  const { profile } = extractProfile(sections);
  const { educations } = extractEducation(sections);
  const { workExperiences } = extractWorkExperience(sections);
  const { projects } = extractProject(sections);
  const { skills } = extractSkills(sections);

  return {
    profile,
    educations,
    workExperiences,
    projects,
    skills,
    custom: {
      descriptions: [],
    },
  };
};
