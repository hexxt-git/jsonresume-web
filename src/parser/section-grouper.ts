import type { Line, Lines, SectionMap } from './types';
import { hasBoldFont, isAllCaps, isAlphaOnly } from './extractors/lib/features';

export const HEADER_KEY = 'profile';

const SECTION_KEYWORDS = [
  'experience',
  'education',
  'project',
  'skill',
  'course',
  'extracurricular',
  'objective',
  'summary',
  'award',
  'honor',
  'project',
  'job',
  'certification',
  'certificate',
  'volunteer',
  'interest',
  'language',
  'reference',
  'publication',
  'involvement',
  'activity',
];

export function groupIntoSections(lines: Lines): SectionMap {
  const sections: SectionMap = {};
  let currentKey = HEADER_KEY;
  let currentLines: Lines = [];

  lines.forEach((line, idx) => {
    if (detectSectionTitle(line, idx)) {
      sections[currentKey] = [...currentLines];
      currentKey = line[0].text.trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  });

  if (currentLines.length > 0) sections[currentKey] = [...currentLines];
  return sections;
}

// ── Internals ───────────────────────────────────────────────────────

function detectSectionTitle(line: Line, lineIdx: number): boolean {
  if (lineIdx < 2 || line.length !== 1 || line.length === 0) return false;

  const item = line[0];

  // Strong signal: bold + all uppercase
  if (hasBoldFont(item) && isAllCaps(item)) return true;

  // Weak signal: keyword match + structural cues
  const text = item.text.trim();
  const wordCount = text.split(' ').filter((w) => w !== '&').length;

  return (
    wordCount <= 2 &&
    isAlphaOnly(item) &&
    /[A-Z]/.test(text[0]) &&
    SECTION_KEYWORDS.some((kw) => text.toLowerCase().includes(kw))
  );
}
