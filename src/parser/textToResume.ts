import type { ResumeSchema } from '../types/resume';

const EMAIL_RE = /[\w.+-]+@[\w.-]+\.\w{2,}/;
const PHONE_RE = /[\+]?[\d\s\-().]{7,}/;
const URL_RE = /https?:\/\/[^\s,]+/g;
const LINKEDIN_RE = /linkedin\.com\/in\/([^\s/,]+)/i;

const SECTION_HEADERS: Record<string, string> = {
  experience: 'work',
  'work experience': 'work',
  'professional experience': 'work',
  employment: 'work',
  'work history': 'work',
  education: 'education',
  'academic background': 'education',
  skills: 'skills',
  'technical skills': 'skills',
  'core competencies': 'skills',
  technologies: 'skills',
  projects: 'projects',
  portfolio: 'projects',
  languages: 'languages',
  volunteer: 'volunteer',
  volunteering: 'volunteer',
  awards: 'awards',
  honors: 'awards',
  certifications: 'certificates',
  certificates: 'certificates',
  publications: 'publications',
  interests: 'interests',
  hobbies: 'interests',
  references: 'references',
  summary: 'summary',
  profile: 'summary',
  'about me': 'summary',
  objective: 'summary',
};

function detectSection(line: string): string | null {
  const clean = line
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .toLowerCase();
  return SECTION_HEADERS[clean] || null;
}

function parseDateRange(text: string): { startDate?: string; endDate?: string } {
  const datePattern =
    /(\w+\.?\s+\d{4}|\d{4}[-/]\d{1,2}|\d{4})\s*[-–—to]+\s*(\w+\.?\s+\d{4}|\d{4}[-/]\d{1,2}|\d{4}|present|current|now)/i;
  const match = text.match(datePattern);
  if (!match) return {};
  const start = normalizeDate(match[1]);
  const endRaw = match[2].toLowerCase();
  const end = ['present', 'current', 'now'].includes(endRaw) ? undefined : normalizeDate(match[2]);
  return { startDate: start, endDate: end };
}

function normalizeDate(d: string): string {
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
  const monthYear = d.match(/(\w+)\.?\s+(\d{4})/);
  if (monthYear) {
    const m = months[monthYear[1].toLowerCase()];
    if (m) return `${monthYear[2]}-${m}`;
  }
  const ymd = d.match(/(\d{4})[-/](\d{1,2})/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, '0')}`;
  const yearOnly = d.match(/(\d{4})/);
  if (yearOnly) return yearOnly[1];
  return d;
}

export function textToResume(text: string): ResumeSchema {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const resume: ResumeSchema = { basics: { profiles: [] } };

  // Extract contact info from early lines
  const headerLines: string[] = [];
  let sectionStart = -1;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    if (detectSection(lines[i])) {
      sectionStart = i;
      break;
    }
    headerLines.push(lines[i]);
  }
  if (sectionStart === -1) sectionStart = Math.min(5, lines.length);

  const headerText = headerLines.join(' ');
  const emailMatch = headerText.match(EMAIL_RE);
  if (emailMatch) resume.basics!.email = emailMatch[0];

  const phoneMatch = headerText.match(PHONE_RE);
  if (phoneMatch) resume.basics!.phone = phoneMatch[0].trim();

  const urls = headerText.match(URL_RE) || [];
  for (const url of urls) {
    const li = url.match(LINKEDIN_RE);
    if (li) {
      resume.basics!.profiles!.push({ network: 'LinkedIn', username: li[1], url });
    } else if (!resume.basics!.url) {
      resume.basics!.url = url;
    }
  }

  // First non-contact line is likely the name
  if (headerLines.length > 0) {
    resume.basics!.name = headerLines[0];
    if (headerLines.length > 1) {
      const secondLine = headerLines[1];
      if (!EMAIL_RE.test(secondLine) && !PHONE_RE.test(secondLine) && !URL_RE.test(secondLine)) {
        resume.basics!.label = secondLine;
      }
    }
  }

  // Parse sections
  let currentSection = '';
  let currentLines: string[] = [];
  const sectionBlocks: { type: string; lines: string[] }[] = [];

  for (let i = sectionStart; i < lines.length; i++) {
    const sec = detectSection(lines[i]);
    if (sec) {
      if (currentSection && currentLines.length) {
        sectionBlocks.push({ type: currentSection, lines: currentLines });
      }
      currentSection = sec;
      currentLines = [];
    } else {
      currentLines.push(lines[i]);
    }
  }
  if (currentSection && currentLines.length) {
    sectionBlocks.push({ type: currentSection, lines: currentLines });
  }

  for (const block of sectionBlocks) {
    switch (block.type) {
      case 'summary':
        resume.basics!.summary = block.lines.join(' ');
        break;
      case 'work':
        resume.work = parseWorkEntries(block.lines);
        break;
      case 'education':
        resume.education = parseEducationEntries(block.lines);
        break;
      case 'skills':
        resume.skills = parseSkills(block.lines);
        break;
      case 'projects':
        resume.projects = parseProjectEntries(block.lines);
        break;
      case 'languages':
        resume.languages = block.lines.map((l) => ({
          language: l.replace(/[-–—:,].*$/, '').trim(),
          fluency: (l.match(/[-–—:,]\s*(.+)/) || [])[1]?.trim(),
        }));
        break;
      case 'certificates':
        resume.certificates = block.lines.map((l) => ({ name: l }));
        break;
      case 'awards':
        resume.awards = block.lines.map((l) => ({ title: l }));
        break;
      case 'interests':
        resume.interests = block.lines.map((l) => ({ name: l }));
        break;
      case 'references':
        resume.references = block.lines.map((l) => ({ name: l }));
        break;
    }
  }

  return resume;
}

function parseWorkEntries(lines: string[]): ResumeSchema['work'] {
  const entries: NonNullable<ResumeSchema['work']> = [];
  let current: NonNullable<ResumeSchema['work']>[0] | null = null;

  for (const line of lines) {
    const dates = parseDateRange(line);
    const isBullet = /^[•\-\*\u2022\u2023\u25E6\u2043]/.test(line);

    if (dates.startDate && !isBullet) {
      if (current) entries.push(current);
      const cleaned = line
        .replace(
          /\d{4}[-/]?\d{0,2}\s*[-–—to]+\s*(\w+\.?\s+\d{4}|\d{4}[-/]?\d{0,2}|present|current|now)/gi,
          '',
        )
        .trim();
      const parts = cleaned.split(/\s+(?:at|@|-|,|–|—|\|)\s+/);
      current = {
        position: parts[0]?.trim() || line,
        name: parts[1]?.trim() || '',
        ...dates,
        highlights: [],
      };
    } else if (isBullet && current) {
      current.highlights!.push(line.replace(/^[•\-\*\u2022\u2023\u25E6\u2043]\s*/, ''));
    } else if (current && !dates.startDate) {
      // Could be company name or description on its own line
      if (!current.name) {
        current.name = line;
      } else {
        current.highlights!.push(line);
      }
    } else {
      if (current) entries.push(current);
      current = { position: line, highlights: [] };
    }
  }
  if (current) entries.push(current);
  return entries;
}

function parseEducationEntries(lines: string[]): ResumeSchema['education'] {
  const entries: NonNullable<ResumeSchema['education']> = [];
  let current: NonNullable<ResumeSchema['education']>[0] | null = null;

  for (const line of lines) {
    const dates = parseDateRange(line);
    if (dates.startDate || dates.endDate) {
      if (current) entries.push(current);
      const cleaned = line
        .replace(
          /\d{4}[-/]?\d{0,2}\s*[-–—to]+\s*(\w+\.?\s+\d{4}|\d{4}[-/]?\d{0,2}|present|current|now)/gi,
          '',
        )
        .trim();
      current = { institution: cleaned, ...dates };
    } else if (current) {
      if (!current.studyType) {
        current.studyType = line;
      } else if (!current.area) {
        current.area = line;
      }
    } else {
      current = { institution: line };
    }
  }
  if (current) entries.push(current);
  return entries;
}

function parseProjectEntries(lines: string[]): ResumeSchema['projects'] {
  const entries: NonNullable<ResumeSchema['projects']> = [];
  let current: NonNullable<ResumeSchema['projects']>[0] | null = null;

  for (const line of lines) {
    const isBullet = /^[•\-\*\u2022\u2023\u25E6\u2043]/.test(line);
    if (!isBullet && (URL_RE.test(line) || (!current && line.length < 80))) {
      if (current) entries.push(current);
      const urlMatch = line.match(URL_RE);
      current = {
        name:
          line
            .replace(URL_RE, '')
            .replace(/[-–—|,]\s*$/, '')
            .trim() || line,
        url: urlMatch?.[0],
        highlights: [],
      };
    } else if (isBullet && current) {
      current.highlights!.push(line.replace(/^[•\-\*\u2022\u2023\u25E6\u2043]\s*/, ''));
    } else if (current) {
      current.highlights!.push(line);
    } else {
      current = { name: line, highlights: [] };
    }
  }
  if (current) entries.push(current);
  return entries;
}

function parseSkills(lines: string[]): ResumeSchema['skills'] {
  const groups: NonNullable<ResumeSchema['skills']> = [];
  for (const line of lines) {
    const colonSplit = line.match(/^([^:]+):\s*(.+)/);
    if (colonSplit) {
      groups.push({
        name: colonSplit[1].trim(),
        keywords: colonSplit[2]
          .split(/[,;|]/)
          .map((k) => k.trim())
          .filter(Boolean),
      });
    } else {
      const keywords = line
        .split(/[,;|]/)
        .map((k) => k.trim())
        .filter(Boolean);
      if (keywords.length > 1) {
        groups.push({ name: 'General', keywords });
      } else if (keywords.length === 1 && groups.length > 0) {
        groups[groups.length - 1].keywords!.push(keywords[0]);
      } else if (keywords.length === 1) {
        groups.push({ name: 'General', keywords });
      }
    }
  }
  return groups;
}
