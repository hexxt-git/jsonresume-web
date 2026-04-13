import type { FeatureSet, ResumeSectionToLines } from '../types';
import { getSectionLinesByKeywords } from './lib/get-section-lines';
import { DATE_FEATURE_SETS, getHasText, isBold } from './lib/common-features';
import { divideSectionIntoSubsections } from './lib/subsections';
import { getTextWithHighestFeatureScore } from './lib/feature-scoring-system';
import { getBulletPointsFromLines, getDescriptionsLineIdx } from './lib/bullet-points';

export const extractProject = (sections: ResumeSectionToLines) => {
  const projects: { project: string; date: string; descriptions: string[]; url: string }[] = [];
  const projectsScores: any[] = [];
  const lines = getSectionLinesByKeywords(sections, ['project']);
  const subsections = divideSectionIntoSubsections(lines);

  for (const subsectionLines of subsections) {
    const descriptionsLineIdx = getDescriptionsLineIdx(subsectionLines) ?? 1;

    const subsectionInfoTextItems = subsectionLines.slice(0, descriptionsLineIdx).flat();
    const [date, dateScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      DATE_FEATURE_SETS,
    );
    const PROJECT_FEATURE_SET: FeatureSet[] = [
      [isBold, 2],
      [getHasText(date), -4],
    ];
    const [project, projectScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      PROJECT_FEATURE_SET,
      false,
    );

    const descriptionsLines = subsectionLines.slice(descriptionsLineIdx);
    const descriptions = getBulletPointsFromLines(descriptionsLines);

    // Extract URL from header items
    const headerText = subsectionInfoTextItems.map((i) => i.text).join(' ');
    const urlMatch =
      headerText.match(/https?:\/\/\S+/) ||
      headerText.match(/(?:[\w-]+\.)+(?:com|org|io|dev|me|net|co|dz|fr|de|uk)(?:\/\S*)?/);

    projects.push({ project, date, descriptions, url: urlMatch?.[0] || '' });
    projectsScores.push({ projectScores, dateScores });
  }
  return { projects, projectsScores };
};
