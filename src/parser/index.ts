import type { ResumeSchema } from '../types/resume';
import type { TextItems } from './types';
import { extractTextFromDocx } from './docxParser';
import { textToResume } from './textToResume';
import YAML from 'yaml';

// Open-resume pipeline
import { readPdf } from './read-pdf';
import { groupTextItemsIntoLines } from './group-text-items-into-lines';
import { groupLinesIntoSections } from './group-lines-into-sections';
import { extractResumeFromSections } from './extract-resume-from-sections';
import { extractTextItemsFromHtml } from './extract-text-items-from-html';

// ── Date parsing ────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
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

function normalizeDate(d: string): string | undefined {
  const trimmed = d.trim();
  if (/present|current|now/i.test(trimmed)) return undefined;
  const monthYear = trimmed.match(/(\w+)\.?\s+(\d{4})/);
  if (monthYear) {
    const m = MONTHS[monthYear[1].toLowerCase()];
    if (m) return `${monthYear[2]}-${m}`;
  }
  const yearMonth = trimmed.match(/(\d{4})[-/](\d{1,2})/);
  if (yearMonth) return `${yearMonth[1]}-${yearMonth[2].padStart(2, '0')}`;
  const yearOnly = trimmed.match(/((?:19|20)\d{2})/);
  if (yearOnly) return yearOnly[1];
  return undefined;
}

function parseDateRange(text: string): { startDate?: string; endDate?: string } {
  if (!text) return {};
  const match = text.match(/(.+?)\s*[-–—]\s*(.+)/);
  if (match) {
    return { startDate: normalizeDate(match[1]), endDate: normalizeDate(match[2]) };
  }
  const single = normalizeDate(text);
  return single ? { startDate: single } : {};
}

// ── Adapter: open-resume result → ResumeSchema ─────────────────────

function openResumeToSchema(result: ReturnType<typeof extractResumeFromSections>): ResumeSchema {
  const { profile, workExperiences, educations, projects, skills } = result;

  const locationParts = profile.location
    ? profile.location.split(',').map((s: string) => s.trim())
    : [];

  const profiles: NonNullable<NonNullable<ResumeSchema['basics']>['profiles']> = [];
  if (profile.linkedin) {
    profiles.push({
      network: 'LinkedIn',
      username: profile.linkedin.username,
      url: profile.linkedin.url,
    });
  }

  const basics: ResumeSchema['basics'] = {
    name: profile.name || undefined,
    email: profile.email || undefined,
    phone: profile.phone || undefined,
    url: profile.url || undefined,
    summary: profile.summary || undefined,
    location: profile.location
      ? { city: locationParts[0] || '', region: locationParts[1] || '' }
      : undefined,
    profiles: profiles.length ? profiles : undefined,
  };

  const work: ResumeSchema['work'] = workExperiences.length
    ? workExperiences.map((w) => ({
        name: w.company || undefined,
        position: w.jobTitle || undefined,
        ...parseDateRange(w.date),
        highlights: w.descriptions.length ? w.descriptions : undefined,
      }))
    : undefined;

  const education: ResumeSchema['education'] = educations.length
    ? educations.map((e) => ({
        institution: e.school || undefined,
        studyType: e.degree || undefined,
        score: e.gpa || undefined,
        ...parseDateRange(e.date),
        courses: e.descriptions.length ? e.descriptions : undefined,
      }))
    : undefined;

  const projectsList: ResumeSchema['projects'] = projects.length
    ? projects.map((p) => ({
        name: p.project || undefined,
        url: p.url || undefined,
        ...parseDateRange(p.date),
        highlights: p.descriptions.length ? p.descriptions : undefined,
      }))
    : undefined;

  const skillsList: ResumeSchema['skills'] = skills.skillGroups?.length
    ? skills.skillGroups.map((g) => ({
        name: g.name,
        keywords: g.keywords,
      }))
    : undefined;

  return {
    basics,
    work,
    education,
    projects: projectsList,
    skills: skillsList,
  };
}

// ── Shared pipeline: TextItems → ResumeSchema ──────────────────────

function runPipeline(textItems: TextItems): ResumeSchema {
  const lines = groupTextItemsIntoLines(textItems);
  const sections = groupLinesIntoSections(lines);
  const resume = extractResumeFromSections(sections);
  return openResumeToSchema(resume);
}

// ── PDF pipeline ────────────────────────────────────────────────────

async function parseResumeFromPdf(file: File): Promise<ResumeSchema> {
  const fileUrl = URL.createObjectURL(file);
  try {
    const textItems = await readPdf(fileUrl);
    return runPipeline(textItems);
  } finally {
    URL.revokeObjectURL(fileUrl);
  }
}

// ── DOCX pipeline: mammoth → HTML → DOM layout → TextItems ─────────

async function parseResumeFromDocx(file: File): Promise<ResumeSchema> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const textItems = await extractTextItemsFromHtml(result.value);
  return runPipeline(textItems);
}

// ── Public entry point ──────────────────────────────────────────────

export async function parseResumeFile(file: File): Promise<ResumeSchema> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const text = await file.text();
    return JSON.parse(text) as ResumeSchema;
  }

  if (ext === 'yaml' || ext === 'yml') {
    const text = await file.text();
    return YAML.parse(text) as ResumeSchema;
  }

  if (ext === 'pdf') {
    return parseResumeFromPdf(file);
  }

  if (ext === 'docx' || ext === 'doc') {
    return parseResumeFromDocx(file);
  }

  // Plain text: no formatting info available, use keyword-based heuristic parser
  const rawText = await file.text();
  return textToResume(rawText);
}
