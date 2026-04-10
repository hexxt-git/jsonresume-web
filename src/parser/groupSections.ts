import type { Line, Lines, Sections } from './types';

const SECTION_KEYWORDS_PRIMARY = ['experience', 'education', 'project', 'skill'];
const SECTION_KEYWORDS_SECONDARY = [
  'course',
  'extracurricular',
  'objective',
  'summary',
  'award',
  'honor',
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
const ALL_KEYWORDS = [...SECTION_KEYWORDS_PRIMARY, ...SECTION_KEYWORDS_SECONDARY];

function isBold(fontName: string): boolean {
  return /bold|semibold|demi|600|700|800|900/i.test(fontName);
}

function isAllUppercase(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  return letters.length > 0 && letters === letters.toUpperCase();
}

function isSectionTitle(line: Line, lineIndex: number): boolean {
  // First 2 lines are always profile
  if (lineIndex < 2) return false;
  // Section titles are a single text item on a line
  if (line.length !== 1) return false;

  const item = line[0];
  const text = item.text.trim();
  if (!text) return false;

  // Primary: bold AND all uppercase
  if (isBold(item.fontName) && isAllUppercase(text)) return true;

  // Fallback: keyword-based
  const words = text.split(/\s+/).filter((w) => w !== '&');
  if (words.length > 3) return false;
  if (!/^[A-Za-z\s&]+$/.test(text)) return false;
  if (!/^[A-Z]/.test(text)) return false;

  const lower = text.toLowerCase();
  const lowerWords = lower.split(/\s+/);
  const hasKeyword = ALL_KEYWORDS.some((kw) =>
    lowerWords.some((w) => w === kw || w.startsWith(kw)),
  );
  if (!hasKeyword) return false;

  // If text is all uppercase + keyword match, strong signal even without bold
  if (isAllUppercase(text)) return true;

  // If bold + keyword match, also accept
  if (isBold(item.fontName)) return true;

  // Capitalized keyword with 1-2 words (e.g., "Experience", "Skills")
  return words.length <= 2;
}

export function groupLinesIntoSections(lines: Lines): Sections {
  const sections: Sections = {};
  let currentSection = 'profile';
  let currentLines: Lines = [];

  for (let i = 0; i < lines.length; i++) {
    if (isSectionTitle(lines[i], i)) {
      if (currentLines.length) {
        sections[currentSection] = currentLines;
      }
      currentSection = lines[i][0].text.trim();
      currentLines = [];
    } else {
      currentLines.push(lines[i]);
    }
  }

  if (currentLines.length) {
    sections[currentSection] = currentLines;
  }

  return sections;
}
