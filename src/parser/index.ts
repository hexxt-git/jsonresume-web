import type { ResumeSchema } from '../types/resume';
import { extractTextItemsFromPdf } from './pdfParser';
import { groupTextItemsIntoLines } from './groupLines';
import { groupLinesIntoSections } from './groupSections';
import {
  extractProfile,
  extractWork,
  extractEducation,
  extractProjects,
  extractSkills,
  extractLanguages,
  extractVolunteer,
  extractAwards,
  extractCertificates,
  extractInterests,
  extractReferences,
  extractPublications,
} from './extractors';
import { extractTextFromDocx } from './docxParser';
import { textToResume } from './textToResume';

/** Full pipeline for PDFs: preserves position/font data for accurate parsing */
async function parseResumeFromPdf(file: File): Promise<ResumeSchema> {
  const textItems = await extractTextItemsFromPdf(file);
  const lines = groupTextItemsIntoLines(textItems);
  const sections = groupLinesIntoSections(lines);

  return {
    basics: extractProfile(sections),
    work: extractWork(sections),
    education: extractEducation(sections),
    projects: extractProjects(sections),
    skills: extractSkills(sections),
    languages: extractLanguages(sections),
    volunteer: extractVolunteer(sections),
    awards: extractAwards(sections),
    certificates: extractCertificates(sections),
    interests: extractInterests(sections),
    references: extractReferences(sections),
    publications: extractPublications(sections),
  };
}

export async function parseResumeFile(file: File): Promise<ResumeSchema> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const text = await file.text();
    return JSON.parse(text) as ResumeSchema;
  }

  if (ext === 'pdf') {
    return parseResumeFromPdf(file);
  }

  // DOCX and plain text: extract text then use heuristic parser
  let rawText: string;
  if (ext === 'docx' || ext === 'doc') {
    rawText = await extractTextFromDocx(file);
  } else {
    rawText = await file.text();
  }

  return textToResume(rawText);
}
