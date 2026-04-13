import type { FeatureSet, SectionMap } from '../types';
import { findSectionByKeyword } from './lib/section-lookup';
import { DATE_FEATURES, matchesText, hasBoldFont } from './lib/features';
import { splitIntoGroups } from './lib/subsection-splitter';
import { selectBestMatch } from './lib/scoring';
import { extractBullets, findDescriptionStart } from './lib/bullets';

const DOMAIN_RE = /(?:[\w-]+\.)+(?:com|org|io|dev|me|net|co|dz|fr|de|uk)(?:\/\S*)?/;
const HTTP_RE = /https?:\/\/\S+/;

export function parseProjects(sections: SectionMap) {
  const lines = findSectionByKeyword(sections, ['project']);
  const groups = splitIntoGroups(lines);

  const projects = groups.map((group) => {
    const descStart = findDescriptionStart(group) ?? 1;
    const headerItems = group.slice(0, descStart).flat();

    const [date] = selectBestMatch(headerItems, DATE_FEATURES);

    const nameFeatures: FeatureSet[] = [
      [hasBoldFont, 2],
      [matchesText(date), -4],
    ];
    const [project] = selectBestMatch(headerItems, nameFeatures, false);
    const descriptions = extractBullets(group.slice(descStart));

    const headerText = headerItems.map((i) => i.text).join(' ');
    const urlMatch = headerText.match(HTTP_RE) ?? headerText.match(DOMAIN_RE);

    return { project, date, descriptions, url: urlMatch?.[0] ?? '' };
  });

  return { projects };
}
