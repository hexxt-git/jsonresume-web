import type { TextItem, FeatureSet, SectionMap } from '../types';
import { findSectionByKeyword } from './lib/section-lookup';
import { DATE_FEATURES, containsDigit, matchesText, hasBoldFont } from './lib/features';
import { splitIntoGroups } from './lib/subsection-splitter';
import { selectBestMatch } from './lib/scoring';
import { extractBullets, findDescriptionStart } from './lib/bullets';

// prettier-ignore
const JOB_TITLES = ['Accountant','Administrator','Advisor','Agent','Analyst','Apprentice','Architect','Assistant','Associate','Auditor','Bartender','Biologist','Bookkeeper','Buyer','Carpenter','Cashier','CEO','Clerk','Co-op','Co-Founder','Consultant','Coordinator','CTO','Developer','Designer','Director','Driver','Editor','Electrician','Engineer','Extern','Founder','Freelancer','Head','Intern','Janitor','Journalist','Laborer','Lawyer','Lead','Manager','Mechanic','Member','Nurse','Officer','Operator','Operation','Photographer','President','Producer','Recruiter','Representative','Researcher','Sales','Server','Scientist','Specialist','Supervisor','Teacher','Technician','Trader','Trainee','Treasurer','Tutor','Vice','VP','Volunteer','Webmaster','Worker'];

function hasJobTitle(item: TextItem): boolean {
  return JOB_TITLES.some((title) =>
    item.text.split(/\s/).some((word) => word.toLowerCase() === title.toLowerCase()),
  );
}

function hasTooManyWords(item: TextItem): boolean {
  return item.text.split(/\s/).length > 5;
}

const TITLE_FEATURES: FeatureSet[] = [
  [hasJobTitle, 4],
  [containsDigit, -4],
  [hasTooManyWords, -2],
];

export function parseWork(sections: SectionMap) {
  const lines = findSectionByKeyword(sections, [
    'work',
    'experience',
    'employment',
    'history',
    'job',
  ]);
  const groups = splitIntoGroups(lines);

  const workExperiences = groups.map((group) => {
    const descStart = findDescriptionStart(group) ?? 2;
    const headerItems = group.slice(0, descStart).flat();

    const [date] = selectBestMatch(headerItems, DATE_FEATURES);
    const [jobTitle] = selectBestMatch(headerItems, TITLE_FEATURES);

    const companyFeatures: FeatureSet[] = [
      [hasBoldFont, 2],
      [matchesText(date), -4],
      [matchesText(jobTitle), -4],
    ];
    const [company] = selectBestMatch(headerItems, companyFeatures, false);
    const descriptions = extractBullets(group.slice(descStart));

    return { company, jobTitle, date, descriptions };
  });

  return { workExperiences };
}
