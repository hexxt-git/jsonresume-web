import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { sampleResume } from '../utils/sample';
import { getThemeById } from '../themes';
import { extractTextItemsFromPdfLegacy } from './pdfTestHelper';
import { groupTextItemsIntoLines } from '../parser/groupLines';
import { groupLinesIntoSections } from '../parser/groupSections';
import {
  extractProfile,
  extractWork,
  extractEducation,
  extractProjects,
  extractSkills,
  extractLanguages,
} from '../parser/extractors';

// Generate a PDF from HTML using Puppeteer, return as a File object
async function htmlToPdfFile(html: string, browser: Browser): Promise<File> {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await page.close();

  const uint8 = new Uint8Array(pdfBuffer);
  const blob = new Blob([uint8], { type: 'application/pdf' });
  return new File([blob], 'resume.pdf', { type: 'application/pdf' });
}

describe('PDF roundtrip: render → PDF → parse', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  });

  afterAll(async () => {
    await browser.close();
  });

  it('recovers the candidate name', async () => {
    const html = getThemeById('modern').render(sampleResume);
    const pdfFile = await htmlToPdfFile(html, browser);

    const textItems = await extractTextItemsFromPdfLegacy(pdfFile);
    const lines = groupTextItemsIntoLines(textItems);
    const sections = groupLinesIntoSections(lines);
    const basics = extractProfile(sections);

    expect(basics?.name).toContain('Salah');
    expect(basics?.name).toContain('Zeghdani');
  });

  it('recovers the email address', async () => {
    const html = getThemeById('modern').render(sampleResume);
    const pdfFile = await htmlToPdfFile(html, browser);

    const textItems = await extractTextItemsFromPdfLegacy(pdfFile);
    const lines = groupTextItemsIntoLines(textItems);
    const sections = groupLinesIntoSections(lines);
    const basics = extractProfile(sections);

    expect(basics?.email).toBe('zeghdns@gmail.com');
  });

  it('recovers the phone number', async () => {
    const html = getThemeById('modern').render(sampleResume);
    const pdfFile = await htmlToPdfFile(html, browser);

    const textItems = await extractTextItemsFromPdfLegacy(pdfFile);
    const lines = groupTextItemsIntoLines(textItems);
    const sections = groupLinesIntoSections(lines);
    const basics = extractProfile(sections);

    expect(basics?.phone).toContain('213798922617');
  });

  it('recovers work experience entries', async () => {
    const html = getThemeById('modern').render(sampleResume);
    const pdfFile = await htmlToPdfFile(html, browser);

    const textItems = await extractTextItemsFromPdfLegacy(pdfFile);
    const lines = groupTextItemsIntoLines(textItems);
    const sections = groupLinesIntoSections(lines);
    const work = extractWork(sections);

    expect(work).toBeDefined();
    expect(work!.length).toBeGreaterThanOrEqual(1);

    // Check that at least one job title is recovered
    const allPositions = work!.map((w) => (w.position || '').toLowerCase());
    const allNames = work!.map((w) => (w.name || '').toLowerCase());
    const combined = [...allPositions, ...allNames].join(' ');

    expect(combined).toMatch(/engineer|developer/i);
  });

  it('recovers education entries', async () => {
    const html = getThemeById('modern').render(sampleResume);
    const pdfFile = await htmlToPdfFile(html, browser);

    const textItems = await extractTextItemsFromPdfLegacy(pdfFile);
    const lines = groupTextItemsIntoLines(textItems);
    const sections = groupLinesIntoSections(lines);
    const edu = extractEducation(sections);

    expect(edu).toBeDefined();
    expect(edu!.length).toBeGreaterThanOrEqual(1);

    const allInstitutions = edu!.map((e) => e.institution || '').join(' ');
    expect(allInstitutions.toLowerCase()).toMatch(/university|freecodecamp/i);
  });

  it('recovers skills', async () => {
    const html = getThemeById('modern').render(sampleResume);
    const pdfFile = await htmlToPdfFile(html, browser);

    const textItems = await extractTextItemsFromPdfLegacy(pdfFile);
    const lines = groupTextItemsIntoLines(textItems);
    const sections = groupLinesIntoSections(lines);
    const skills = extractSkills(sections);

    expect(skills).toBeDefined();
    const allKeywords = skills!
      .flatMap((s) => s.keywords || [])
      .join(' ')
      .toLowerCase();
    expect(allKeywords).toMatch(/react|typescript|node/i);
  });

  it('recovers projects', async () => {
    const html = getThemeById('modern').render(sampleResume);
    const pdfFile = await htmlToPdfFile(html, browser);

    const textItems = await extractTextItemsFromPdfLegacy(pdfFile);
    const lines = groupTextItemsIntoLines(textItems);
    const sections = groupLinesIntoSections(lines);
    const projects = extractProjects(sections);

    expect(projects).toBeDefined();
    expect(projects!.length).toBeGreaterThanOrEqual(1);

    const allNames = projects!
      .map((p) => p.name || '')
      .join(' ')
      .toLowerCase();
    expect(allNames).toMatch(/3chrin|calculator|bbee|clean/i);
  });

  it('recovers languages', async () => {
    const html = getThemeById('modern').render(sampleResume);
    const pdfFile = await htmlToPdfFile(html, browser);

    const textItems = await extractTextItemsFromPdfLegacy(pdfFile);
    const lines = groupTextItemsIntoLines(textItems);
    const sections = groupLinesIntoSections(lines);
    const languages = extractLanguages(sections);

    expect(languages).toBeDefined();
    const allLangs = languages!
      .map((l) => l.language || '')
      .join(' ')
      .toLowerCase();
    expect(allLangs).toMatch(/english/i);
  });
});
