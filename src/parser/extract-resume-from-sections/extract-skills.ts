import type { ResumeSectionToLines } from '../types';
import { getSectionLinesByKeywords } from './lib/get-section-lines';
import { getBulletPointsFromLines, getDescriptionsLineIdx } from './lib/bullet-points';

/** Split skill values on commas/semicolons/pipes/and, preserving parenthetical groups */
function splitSkillKeywords(text: string): string[] {
  let depth = 0;
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '(') depth++;
    else if (chars[i] === ')') depth = Math.max(0, depth - 1);
    else if (depth > 0 && chars[i] === ',') chars[i] = '\x00';
  }
  return chars
    .join('')
    .split(/[,;|]|\band\b/i)
    .map((k) => k.replace(/\x00/g, ',').replace(/\.+$/, '').trim())
    .filter(Boolean);
}

export const extractSkills = (sections: ResumeSectionToLines) => {
  const lines = getSectionLinesByKeywords(sections, ['skill']);
  const descriptionsLineIdx = getDescriptionsLineIdx(lines) ?? 0;
  const descriptionsLines = lines.slice(descriptionsLineIdx);
  const descriptions = getBulletPointsFromLines(descriptionsLines);

  // Parse descriptions into structured skill groups
  const skillGroups: { name: string; keywords: string[] }[] = [];
  for (const line of descriptions) {
    const colonSplit = line.match(/^([^:]+):\s*(.+)/);
    if (colonSplit) {
      skillGroups.push({
        name: colonSplit[1].trim(),
        keywords: splitSkillKeywords(colonSplit[2]),
      });
    } else {
      const keywords = splitSkillKeywords(line);
      if (keywords.length > 1) {
        skillGroups.push({ name: 'General', keywords });
      } else if (keywords.length === 1 && skillGroups.length > 0) {
        skillGroups[skillGroups.length - 1].keywords.push(keywords[0]);
      } else if (keywords.length === 1) {
        skillGroups.push({ name: 'General', keywords });
      }
    }
  }

  // Featured skills from non-description lines
  const featuredSkills: { skill: string }[] = [];
  if (descriptionsLineIdx !== 0) {
    const featuredSkillsLines = lines.slice(0, descriptionsLineIdx);
    const featuredSkillsTextItems = featuredSkillsLines
      .flat()
      .filter((item) => item.text.trim())
      .slice(0, 6);
    for (const item of featuredSkillsTextItems) {
      featuredSkills.push({ skill: item.text });
    }
  }

  return {
    skills: {
      featuredSkills,
      descriptions,
      skillGroups,
    },
  };
};
