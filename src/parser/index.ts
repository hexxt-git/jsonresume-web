import type { ResumeSchema } from '../types/resume';
import type { TextItems } from './types';
import YAML from 'yaml';
import { extractPdfTextItems } from './pdf-reader';
import { groupIntoLines } from './line-grouper';
import { groupIntoSections } from './section-grouper';
import { extractAllSections } from './extractors';
import { extractHtmlTextItems } from './html-reader';
import { textToResume } from './textToResume';

// ── Public entry point ──────────────────────────────────────────────

export async function parseResumeFile(file: File): Promise<ResumeSchema> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return parsePdf(file);
    case 'docx':
    case 'doc':
      return parseDocx(file);
    case 'json': {
      const raw = await file.text();
      return JSON.parse(raw) as ResumeSchema;
    }
    case 'yaml':
    case 'yml': {
      const raw = await file.text();
      return YAML.parse(raw) as ResumeSchema;
    }
    default:
      return textToResume(await file.text());
  }
}

// ── Format-specific pipelines ───────────────────────────────────────

async function parsePdf(file: File): Promise<ResumeSchema> {
  const url = URL.createObjectURL(file);
  try {
    return toSchema(runPipeline(await extractPdfTextItems(url)));
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function parseDocx(file: File): Promise<ResumeSchema> {
  const mammoth = await import('mammoth');
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  return toSchema(runPipeline(await extractHtmlTextItems(html)));
}

// ── Shared pipeline ─────────────────────────────────────────────────

function runPipeline(items: TextItems) {
  return extractAllSections(groupIntoSections(groupIntoLines(items)));
}

// ── Schema adapter ──────────────────────────────────────────────────

function toSchema(result: ReturnType<typeof extractAllSections>): ResumeSchema {
  const { profile, workExperiences, educations, projects, skills } = result;
  const locParts = profile.location?.split(',').map((s) => s.trim()) ?? [];

  return {
    basics: {
      name: profile.name || undefined,
      email: profile.email || undefined,
      phone: profile.phone || undefined,
      url: profile.url || undefined,
      summary: profile.summary || undefined,
      location: profile.location
        ? { city: locParts[0] ?? '', region: locParts[1] ?? '' }
        : undefined,
      profiles: profile.linkedin
        ? [{ network: 'LinkedIn', username: profile.linkedin.username, url: profile.linkedin.url }]
        : undefined,
    },
    work: mapOrUndefined(workExperiences, (w) => ({
      name: w.company || undefined,
      position: w.jobTitle || undefined,
      ...splitDateRange(w.date),
      highlights: w.descriptions.length ? w.descriptions : undefined,
    })),
    education: mapOrUndefined(educations, (e) => ({
      institution: e.school || undefined,
      studyType: e.degree || undefined,
      score: e.gpa || undefined,
      ...splitDateRange(e.date),
      courses: e.descriptions.length ? e.descriptions : undefined,
    })),
    projects: mapOrUndefined(projects, (p) => ({
      name: p.project || undefined,
      url: p.url || undefined,
      ...splitDateRange(p.date),
      highlights: p.descriptions.length ? p.descriptions : undefined,
    })),
    skills: skills.skillGroups?.length
      ? skills.skillGroups.map((g) => ({ name: g.name, keywords: g.keywords }))
      : undefined,
  };
}

// ── Date helpers ────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
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

function normalizeDate(raw: string): string | undefined {
  const d = raw.trim();
  if (/present|current|now/i.test(d)) return undefined;

  const monthYear = d.match(/(\w+)\.?\s+(\d{4})/);
  if (monthYear) {
    const m = MONTH_MAP[monthYear[1].toLowerCase()];
    if (m) return `${monthYear[2]}-${m}`;
  }

  const isoish = d.match(/(\d{4})[-/](\d{1,2})/);
  if (isoish) return `${isoish[1]}-${isoish[2].padStart(2, '0')}`;

  const yearOnly = d.match(/((?:19|20)\d{2})/);
  return yearOnly?.[1];
}

function splitDateRange(text: string): { startDate?: string; endDate?: string } {
  if (!text) return {};
  const m = text.match(/(.+?)\s*[-–—]\s*(.+)/);
  if (m) return { startDate: normalizeDate(m[1]), endDate: normalizeDate(m[2]) };
  const single = normalizeDate(text);
  return single ? { startDate: single } : {};
}

function mapOrUndefined<T, U>(arr: T[], fn: (item: T) => U): U[] | undefined {
  return arr.length ? arr.map(fn) : undefined;
}
