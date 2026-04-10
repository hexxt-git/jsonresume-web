import type { TextItem, Lines, Sections, FeatureSet } from './types';
import type { ResumeSchema } from '../types/resume';
import {
  getTextWithHighestScore,
  isBold,
  isAllUpper,
  hasNumber,
  hasComma,
  hasAt,
  hasParenthesis,
  hasSlash,
  hasLetter,
  has4PlusWords,
  BULLET_RE,
  isBullet,
} from './scoring';

// --- Helpers ---

function flattenLines(lines: Lines): TextItem[] {
  return lines.flat();
}

function lineText(line: TextItem[]): string {
  return line
    .map((i) => i.text)
    .join(' ')
    .trim();
}

function getSectionLines(sections: Sections, ...keywords: string[]): Lines | null {
  for (const [key, lines] of Object.entries(sections)) {
    const lower = key.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) return lines;
  }
  return null;
}

/** Split a section into subsections using line gap analysis */
function divideIntoSubsections(lines: Lines): Lines[] {
  if (lines.length <= 1) return [lines];

  // Compute gaps
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const prevY = lines[i - 1][0]?.y ?? 0;
    const curY = lines[i][0]?.y ?? 0;
    gaps.push(Math.abs(prevY - curY));
  }

  // Find typical gap
  const rounded = gaps.map((g) => Math.round(g * 2) / 2);
  const gapCounts = new Map<number, number>();
  for (const g of rounded) gapCounts.set(g, (gapCounts.get(g) || 0) + 1);
  const typicalGap = [...gapCounts].sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
  const threshold = typicalGap * 1.4;

  // Primary: split by large gaps
  const subsections: Lines[] = [];
  let current: Lines = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    if (threshold > 0 && gaps[i - 1] > threshold) {
      subsections.push(current);
      current = [];
    }
    current.push(lines[i]);
  }
  if (current.length) subsections.push(current);

  if (subsections.length > 1) return subsections;

  // Fallback: split by bold lines
  const result: Lines[] = [];
  current = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const curBold = lines[i][0] && /bold/i.test(lines[i][0].fontName);
    const prevBold = lines[i - 1][0] && /bold/i.test(lines[i - 1][0].fontName);
    const curIsBullet = lines[i][0] && isBullet(lines[i][0].text);

    if (curBold && !prevBold && !curIsBullet) {
      result.push(current);
      current = [];
    }
    current.push(lines[i]);
  }
  if (current.length) result.push(current);

  return result.length > 1 ? result : [lines];
}

/** Extract bullet-point descriptions from lines */
function getDescriptions(lines: Lines): string[] {
  if (!lines.length) return [];

  // Find where descriptions start (first bullet or long line)
  let descStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const text = lineText(lines[i]);
    if (BULLET_RE.test(text)) {
      descStart = i;
      break;
    }
    if (lines[i].length === 1 && text.split(/\s+/).filter((w) => !/^\d+$/.test(w)).length >= 8) {
      descStart = i;
      break;
    }
  }
  if (descStart === -1) return [];

  const descLines = lines.slice(descStart);
  const allText = descLines.map((l) => lineText(l)).join(' ');

  // Find most common bullet character
  const bulletCounts = new Map<string, number>();
  for (const ch of allText) {
    if (BULLET_RE.test(ch)) bulletCounts.set(ch, (bulletCounts.get(ch) || 0) + 1);
  }

  if (bulletCounts.size === 0) {
    // No bullet points; return each line as a description
    return descLines.map((l) => lineText(l)).filter(Boolean);
  }

  const topBullet = [...bulletCounts].sort((a, b) => b[1] - a[1])[0][0];
  const startIdx = allText.indexOf(topBullet);
  return allText
    .slice(startIdx)
    .split(topBullet)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Find the line index where descriptions start */
function getDescriptionStartIndex(lines: Lines): number {
  for (let i = 0; i < lines.length; i++) {
    const text = lineText(lines[i]);
    if (BULLET_RE.test(text)) return i;
    if (lines[i].length === 1 && text.split(/\s+/).filter((w) => !/^\d+$/.test(w)).length >= 8)
      return i;
  }
  return lines.length;
}

// --- Date features (shared) ---

const DATE_FEATURES: FeatureSet[] = [
  [(item) => /(?:19|20)\d{2}/.test(item.text), 1],
  [(item) => /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(item.text), 1],
  [(item) => /summer|fall|spring|winter/i.test(item.text), 1],
  [(item) => /present|current/i.test(item.text), 1],
  [hasComma, -1],
];

function extractDate(items: TextItem[]): string {
  return getTextWithHighestScore(items, DATE_FEATURES);
}

function parseDateRange(text: string): { startDate?: string; endDate?: string } {
  const months: Record<string, string> = {
    jan: '01',
    january: '01',
    feb: '02',
    february: '02',
    mar: '03',
    march: '03',
    apr: '04',
    april: '04',
    may: '05',
    jun: '06',
    june: '06',
    jul: '07',
    july: '07',
    aug: '08',
    august: '08',
    sep: '09',
    sept: '09',
    september: '09',
    oct: '10',
    october: '10',
    nov: '11',
    november: '11',
    dec: '12',
    december: '12',
  };

  function normalize(d: string): string | undefined {
    const trimmed = d.trim();
    if (/present|current|now/i.test(trimmed)) return undefined;
    const monthYear = trimmed.match(/(\w+)\.?\s+(\d{4})/);
    if (monthYear) {
      const m = months[monthYear[1].toLowerCase()];
      if (m) return `${monthYear[2]}-${m}`;
    }
    const yearMonth = trimmed.match(/(\d{4})[-/](\d{1,2})/);
    if (yearMonth) return `${yearMonth[1]}-${yearMonth[2].padStart(2, '0')}`;
    const yearOnly = trimmed.match(/((?:19|20)\d{2})/);
    if (yearOnly) return yearOnly[1];
    return undefined;
  }

  const rangePat = /(.+?)\s*[-–—]\s*(.+)/;
  const match = text.match(rangePat);
  if (match) {
    return { startDate: normalize(match[1]), endDate: normalize(match[2]) };
  }
  const single = normalize(text);
  return single ? { startDate: single } : {};
}

// --- Profile extraction ---

export function extractProfile(sections: Sections): ResumeSchema['basics'] {
  const profileLines = sections['profile'];
  if (!profileLines?.length) return {};

  const items = flattenLines(profileLines);

  const name = getTextWithHighestScore(items, [
    [
      (i) => (/^[a-zA-Z\s.]+$/.test(i.text) ? ([i.text] as unknown as RegExpMatchArray) : null),
      3,
      true,
    ],
    [isBold, 2],
    [isAllUpper, 2],
    [hasAt, -4],
    [hasNumber, -4],
    [hasParenthesis, -4],
    [hasComma, -4],
    [hasSlash, -4],
    [has4PlusWords, -2],
  ]);

  const email = getTextWithHighestScore(items, [
    [(i) => i.text.match(/\S+@\S+\.\S+/), 4, true],
    [isBold, -1],
    [isAllUpper, -1],
    [hasParenthesis, -4],
    [hasComma, -4],
    [hasSlash, -4],
    [has4PlusWords, -4],
  ]);

  const phone = getTextWithHighestScore(items, [
    [(i) => i.text.match(/[+(]?\d[\d\s\-.()+]{7,}\d/), 4, true],
    [(i) => i.text.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/), 3, true],
    [hasLetter, -4],
  ]);

  const location = getTextWithHighestScore(items, [
    [(i) => i.text.match(/[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b/), 4, true],
    [(i) => i.text.match(/[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z]+/), 2, true],
    [isBold, -1],
    [hasAt, -4],
    [hasParenthesis, -3],
    [hasSlash, -4],
  ]);

  const url = getTextWithHighestScore(items, [
    [(i) => i.text.match(/\S+\.[a-z]+\/\S+/), 4, true],
    [(i) => i.text.match(/https?:\/\/\S+\.\S+/), 3, true],
    [(i) => i.text.match(/www\.\S+\.\S+/), 3, true],
    [isBold, -1],
    [hasAt, -4],
    [hasParenthesis, -3],
    [hasComma, -4],
    [has4PlusWords, -4],
  ]);

  const summary = getTextWithHighestScore(
    items,
    [
      [has4PlusWords, 4],
      [isBold, -1],
      [hasAt, -4],
      [hasParenthesis, -3],
      [(i) => /[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}/.test(i.text), -4],
    ],
    { concatenateTied: true },
  );

  // Check for dedicated summary/objective section
  const summarySection = getSectionLines(sections, 'summary', 'objective', 'profile');
  const dedicatedSummary = summarySection
    ? summarySection
        .map((l) => lineText(l))
        .join(' ')
        .trim()
    : '';

  const profiles: NonNullable<NonNullable<ResumeSchema['basics']>['profiles']> = [];
  const linkedinMatch = items
    .map((i) => i.text)
    .join(' ')
    .match(/linkedin\.com\/in\/([^\s/,]+)/i);
  if (linkedinMatch) {
    profiles.push({
      network: 'LinkedIn',
      username: linkedinMatch[1],
      url: `https://www.linkedin.com/in/${linkedinMatch[1]}`,
    });
  }

  const locationParts = location.split(',').map((s) => s.trim());

  return {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    url: url.trim(),
    summary: dedicatedSummary || summary.trim(),
    location: location
      ? {
          city: locationParts[0] || '',
          region: locationParts[1] || '',
        }
      : undefined,
    profiles: profiles.length ? profiles : undefined,
  };
}

// --- Work Experience extraction ---

const JOB_TITLE_KEYWORDS = [
  'accountant',
  'admin',
  'analyst',
  'architect',
  'assistant',
  'associate',
  'consultant',
  'coordinator',
  'designer',
  'developer',
  'director',
  'editor',
  'engineer',
  'executive',
  'fellow',
  'founder',
  'head',
  'intern',
  'lead',
  'manager',
  'officer',
  'operator',
  'president',
  'producer',
  'programmer',
  'representative',
  'researcher',
  'scientist',
  'specialist',
  'strategist',
  'supervisor',
  'teacher',
  'technician',
  'vice',
  'volunteer',
  'worker',
];

export function extractWork(sections: Sections): ResumeSchema['work'] {
  const lines = getSectionLines(sections, 'experience', 'work', 'employment', 'history', 'job');
  if (!lines?.length) return undefined;

  const subsections = divideIntoSubsections(lines);
  const work: NonNullable<ResumeSchema['work']> = [];

  for (const sub of subsections) {
    const descStart = getDescriptionStartIndex(sub);
    const headerItems = flattenLines(sub.slice(0, descStart));
    const highlights = getDescriptions(sub);

    const date = extractDate(headerItems);
    const dates = parseDateRange(date);

    const jobTitle = getTextWithHighestScore(headerItems, [
      [
        (i) => {
          const lower = i.text.toLowerCase();
          return JOB_TITLE_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower));
        },
        4,
      ],
      [hasNumber, -4],
      [(i) => i.text.split(/\s+/).length > 5, -2],
    ]);

    const company = getTextWithHighestScore(
      headerItems,
      [
        [isBold, 2],
        [(i) => i.text === date, -4],
        [(i) => i.text === jobTitle, -4],
      ],
      { returnEmptyIfNotPositive: false },
    );

    work.push({
      position: jobTitle.trim(),
      name: company.trim(),
      ...dates,
      highlights: highlights.length ? highlights : undefined,
    });
  }

  return work.length ? work : undefined;
}

// --- Education extraction ---

const SCHOOL_KEYWORDS = ['college', 'university', 'institute', 'school', 'academy'];
const DEGREE_KEYWORDS = [
  'associate',
  'bachelor',
  'master',
  'phd',
  'ph.d',
  'doctorate',
  'diploma',
  'certificate',
];

export function extractEducation(sections: Sections): ResumeSchema['education'] {
  const lines = getSectionLines(sections, 'education');
  if (!lines?.length) return undefined;

  const subsections = divideIntoSubsections(lines);
  const education: NonNullable<ResumeSchema['education']> = [];

  for (const sub of subsections) {
    const headerItems = flattenLines(sub);

    const institution = getTextWithHighestScore(
      headerItems,
      [
        [(i) => SCHOOL_KEYWORDS.some((kw) => i.text.toLowerCase().includes(kw)), 4],
        [(i) => DEGREE_KEYWORDS.some((kw) => i.text.toLowerCase().includes(kw)), -4],
        [hasNumber, -4],
      ],
      { returnEmptyIfNotPositive: false },
    );

    const degree = getTextWithHighestScore(headerItems, [
      [(i) => DEGREE_KEYWORDS.some((kw) => i.text.toLowerCase().includes(kw)), 4],
      [(i) => /[ABM][A-Z.]/.test(i.text), 3],
      [(i) => SCHOOL_KEYWORDS.some((kw) => i.text.toLowerCase().includes(kw)), -4],
      [hasNumber, -3],
    ]);

    const gpa = getTextWithHighestScore(headerItems, [
      [(i) => i.text.match(/[0-4]\.\d{1,2}/), 4, true],
      [hasComma, -3],
      [hasLetter, -4],
    ]);

    const date = extractDate(headerItems);
    const dates = parseDateRange(date);

    education.push({
      institution: institution.trim(),
      studyType: degree.trim() || undefined,
      score: gpa.trim() || undefined,
      ...dates,
    });
  }

  return education.length ? education : undefined;
}

// --- Projects extraction ---

export function extractProjects(sections: Sections): ResumeSchema['projects'] {
  const lines = getSectionLines(sections, 'project');
  if (!lines?.length) return undefined;

  const subsections = divideIntoSubsections(lines);
  const projects: NonNullable<ResumeSchema['projects']> = [];

  for (const sub of subsections) {
    const descStart = getDescriptionStartIndex(sub);
    const headerItems = flattenLines(sub.slice(0, descStart));
    const highlights = getDescriptions(sub);

    const date = extractDate(headerItems);
    const dates = parseDateRange(date);

    const name = getTextWithHighestScore(
      headerItems,
      [
        [isBold, 2],
        [(i) => i.text === date, -4],
      ],
      { returnEmptyIfNotPositive: false },
    );

    const urlMatch = headerItems
      .map((i) => i.text)
      .join(' ')
      .match(/https?:\/\/\S+/);

    projects.push({
      name: name.trim(),
      url: urlMatch?.[0],
      ...dates,
      highlights: highlights.length ? highlights : undefined,
    });
  }

  return projects.length ? projects : undefined;
}

// --- Skills extraction ---

export function extractSkills(sections: Sections): ResumeSchema['skills'] {
  const lines = getSectionLines(sections, 'skill', 'competenc', 'technolog');
  if (!lines?.length) return undefined;

  const skills: NonNullable<ResumeSchema['skills']> = [];

  for (const line of lines) {
    const text = lineText(line);
    // Try "Category: keyword1, keyword2, ..." pattern
    const colonSplit = text.match(/^([^:]+):\s*(.+)/);
    if (colonSplit) {
      skills.push({
        name: colonSplit[1].trim(),
        keywords: colonSplit[2]
          .split(/[,;|]/)
          .map((k) => k.trim())
          .filter(Boolean),
      });
    } else {
      // Comma-separated list
      const keywords = text
        .split(/[,;|]/)
        .map((k) => k.trim())
        .filter(Boolean);
      if (keywords.length > 1) {
        skills.push({ name: 'General', keywords });
      } else if (keywords.length === 1 && skills.length > 0) {
        skills[skills.length - 1].keywords!.push(keywords[0]);
      } else if (keywords.length === 1) {
        skills.push({ name: 'General', keywords });
      }
    }
  }

  return skills.length ? skills : undefined;
}

// --- Languages extraction ---

export function extractLanguages(sections: Sections): ResumeSchema['languages'] {
  const lines = getSectionLines(sections, 'language');
  if (!lines?.length) return undefined;

  const languages: NonNullable<ResumeSchema['languages']> = [];
  for (const line of lines) {
    const text = lineText(line);
    const parts = text
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of parts) {
      const fluencyMatch = part.match(/^(.+?)\s*[-–—:(]\s*(.+?)\)?$/);
      if (fluencyMatch) {
        languages.push({ language: fluencyMatch[1].trim(), fluency: fluencyMatch[2].trim() });
      } else {
        languages.push({ language: part });
      }
    }
  }
  return languages.length ? languages : undefined;
}

// --- Volunteer, Awards, Certificates, etc. ---

export function extractVolunteer(sections: Sections): ResumeSchema['volunteer'] {
  const lines = getSectionLines(sections, 'volunteer', 'involvement');
  if (!lines?.length) return undefined;

  const subsections = divideIntoSubsections(lines);
  const result: NonNullable<ResumeSchema['volunteer']> = [];
  for (const sub of subsections) {
    const headerItems = flattenLines(sub.slice(0, getDescriptionStartIndex(sub)));
    const highlights = getDescriptions(sub);
    const date = extractDate(headerItems);
    const dates = parseDateRange(date);
    const org = getTextWithHighestScore(
      headerItems,
      [
        [isBold, 2],
        [(i) => i.text === date, -4],
      ],
      { returnEmptyIfNotPositive: false },
    );

    result.push({
      organization: org.trim(),
      ...dates,
      highlights: highlights.length ? highlights : undefined,
    });
  }
  return result.length ? result : undefined;
}

export function extractAwards(sections: Sections): ResumeSchema['awards'] {
  const lines = getSectionLines(sections, 'award', 'honor');
  if (!lines?.length) return undefined;
  return lines.map((l) => ({ title: lineText(l) }));
}

export function extractCertificates(sections: Sections): ResumeSchema['certificates'] {
  const lines = getSectionLines(sections, 'certif');
  if (!lines?.length) return undefined;
  return lines.map((l) => ({ name: lineText(l) }));
}

export function extractInterests(sections: Sections): ResumeSchema['interests'] {
  const lines = getSectionLines(sections, 'interest', 'hobbi');
  if (!lines?.length) return undefined;
  return lines.map((l) => ({ name: lineText(l) }));
}

export function extractReferences(sections: Sections): ResumeSchema['references'] {
  const lines = getSectionLines(sections, 'reference');
  if (!lines?.length) return undefined;
  return lines.map((l) => ({ name: lineText(l) }));
}

export function extractPublications(sections: Sections): ResumeSchema['publications'] {
  const lines = getSectionLines(sections, 'publication');
  if (!lines?.length) return undefined;
  return lines.map((l) => ({ name: lineText(l) }));
}
