import type { TextItem, FeatureSet, ResumeSectionToLines } from '../types';
import { getSectionLinesByKeywords } from './lib/get-section-lines';
import { divideSectionIntoSubsections } from './lib/subsections';
import { DATE_FEATURE_SETS, hasComma, hasLetter, hasNumber } from './lib/common-features';
import { getTextWithHighestFeatureScore } from './lib/feature-scoring-system';
import { getBulletPointsFromLines, getDescriptionsLineIdx } from './lib/bullet-points';

// prettier-ignore
const SCHOOLS = ['College', 'University', 'Institute', 'School', 'Academy', 'BASIS', 'Magnet']
const hasSchool = (item: TextItem) => SCHOOLS.some((school) => item.text.includes(school));
// prettier-ignore
const DEGREES = ["Associate", "Bachelor", "Master", "PhD", "Ph."];
const hasDegree = (item: TextItem) =>
  DEGREES.some((degree) => item.text.includes(degree)) || /[ABM][A-Z\.]/.test(item.text);
const matchGPA = (item: TextItem) => item.text.match(/[0-4]\.\d{1,2}/);
const matchGrade = (item: TextItem) => {
  const grade = parseFloat(item.text);
  if (Number.isFinite(grade) && grade <= 110) {
    return [String(grade)] as RegExpMatchArray;
  }
  return null;
};

const SCHOOL_FEATURE_SETS: FeatureSet[] = [
  [hasSchool, 4],
  [hasDegree, -4],
  [hasNumber, -4],
];

const DEGREE_FEATURE_SETS: FeatureSet[] = [
  [hasDegree, 4],
  [hasSchool, -4],
  [hasNumber, -3],
];

const GPA_FEATURE_SETS: FeatureSet[] = [
  [matchGPA, 4, true],
  [matchGrade, 3, true],
  [hasComma, -3],
  [hasLetter, -4],
];

export const extractEducation = (sections: ResumeSectionToLines) => {
  const educations: {
    school: string;
    degree: string;
    gpa: string;
    date: string;
    descriptions: string[];
  }[] = [];
  const educationsScores: any[] = [];
  const lines = getSectionLinesByKeywords(sections, ['education']);
  const subsections = divideSectionIntoSubsections(lines);
  for (const subsectionLines of subsections) {
    const textItems = subsectionLines.flat();
    const [school, schoolScores] = getTextWithHighestFeatureScore(textItems, SCHOOL_FEATURE_SETS);
    const [degree, degreeScores] = getTextWithHighestFeatureScore(textItems, DEGREE_FEATURE_SETS);
    const [gpa, gpaScores] = getTextWithHighestFeatureScore(textItems, GPA_FEATURE_SETS);
    const [date, dateScores] = getTextWithHighestFeatureScore(textItems, DATE_FEATURE_SETS);

    let descriptions: string[] = [];
    const descriptionsLineIdx = getDescriptionsLineIdx(subsectionLines);
    if (descriptionsLineIdx !== undefined) {
      const descriptionsLines = subsectionLines.slice(descriptionsLineIdx);
      descriptions = getBulletPointsFromLines(descriptionsLines);
    }

    educations.push({ school, degree, gpa, date, descriptions });
    educationsScores.push({ schoolScores, degreeScores, gpaScores, dateScores });
  }

  if (educations.length !== 0) {
    const coursesLines = getSectionLinesByKeywords(sections, ['course']);
    if (coursesLines.length !== 0) {
      educations[0].descriptions.push(
        'Courses: ' +
          coursesLines
            .flat()
            .map((item) => item.text)
            .join(' '),
      );
    }
  }

  return { educations, educationsScores };
};
