import type { TextItem, FeatureSet, SectionMap } from '../types';
import { findSectionByKeyword } from './lib/section-lookup';
import { splitIntoGroups } from './lib/subsection-splitter';
import { DATE_FEATURES, containsComma, containsLetter, containsDigit } from './lib/features';
import { selectBestMatch } from './lib/scoring';
import { extractBullets, findDescriptionStart } from './lib/bullets';

// prettier-ignore
const SCHOOL_NAMES = ['College', 'University', 'Institute', 'School', 'Academy', 'BASIS', 'Magnet'];
// prettier-ignore
const DEGREE_NAMES = ['Associate', 'Bachelor', 'Master', 'PhD', 'Ph.'];

function hasSchoolName(item: TextItem): boolean {
  return SCHOOL_NAMES.some((s) => item.text.includes(s));
}

function hasDegreeName(item: TextItem): boolean {
  return DEGREE_NAMES.some((d) => item.text.includes(d)) || /[ABM][A-Z.]/.test(item.text);
}

function matchGpa(item: TextItem) {
  return item.text.match(/[0-4]\.\d{1,2}/);
}

function matchNumericGrade(item: TextItem) {
  const val = parseFloat(item.text);
  return Number.isFinite(val) && val <= 110 ? ([String(val)] as RegExpMatchArray) : null;
}

const SCHOOL_FEATURES: FeatureSet[] = [
  [hasSchoolName, 4],
  [hasDegreeName, -4],
  [containsDigit, -4],
];

const DEGREE_FEATURES: FeatureSet[] = [
  [hasDegreeName, 4],
  [hasSchoolName, -4],
  [containsDigit, -3],
];

const GPA_FEATURES: FeatureSet[] = [
  [matchGpa, 4, true],
  [matchNumericGrade, 3, true],
  [containsComma, -3],
  [containsLetter, -4],
];

export function parseEducation(sections: SectionMap) {
  const lines = findSectionByKeyword(sections, ['education']);
  const groups = splitIntoGroups(lines);

  const educations = groups.map((group) => {
    const items = group.flat();
    const [school] = selectBestMatch(items, SCHOOL_FEATURES);
    const [degree] = selectBestMatch(items, DEGREE_FEATURES);
    const [gpa] = selectBestMatch(items, GPA_FEATURES);
    const [date] = selectBestMatch(items, DATE_FEATURES);

    const descStart = findDescriptionStart(group);
    const descriptions = descStart !== undefined ? extractBullets(group.slice(descStart)) : [];

    return { school, degree, gpa, date, descriptions };
  });

  // Append dedicated courses section to first education entry
  const courseLines = findSectionByKeyword(sections, ['course']);
  if (educations.length > 0 && courseLines.length > 0) {
    const courseText =
      'Courses: ' +
      courseLines
        .flat()
        .map((i) => i.text)
        .join(' ');
    educations[0].descriptions.push(courseText);
  }

  return { educations };
}
