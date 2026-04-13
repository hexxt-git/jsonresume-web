import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { sampleResume } from '../utils/sample';
import { getThemeById } from '../themes';
import { parseResumeFromPdfBuffer } from './pdfTestHelper';

async function htmlToPdfBuffer(html: string, browser: Browser): Promise<Uint8Array> {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await page.close();
  return new Uint8Array(pdfBuffer);
}

describe('PDF parser: open-resume pipeline', () => {
  let browser: Browser;
  let resume: Awaited<ReturnType<typeof parseResumeFromPdfBuffer>>;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const html = getThemeById('modern').render(sampleResume);
    const pdfData = await htmlToPdfBuffer(html, browser);
    resume = await parseResumeFromPdfBuffer(pdfData);
  });

  afterAll(async () => {
    await browser.close();
  });

  it('recovers the candidate name', () => {
    expect(resume.profile.name).toContain('Salah');
    expect(resume.profile.name).toContain('Zeghdani');
  });

  it('recovers the email', () => {
    expect(resume.profile.email).toBe('zeghdns@gmail.com');
  });

  it('recovers work experiences', () => {
    expect(resume.workExperiences.length).toBeGreaterThanOrEqual(1);
    const all = resume.workExperiences.map((w) => `${w.jobTitle} ${w.company}`).join(' ');
    expect(all).toMatch(/engineer|developer/i);
  });

  it('recovers education', () => {
    expect(resume.educations.length).toBeGreaterThanOrEqual(1);
    const allSchools = resume.educations
      .map((e) => e.school)
      .join(' ')
      .toLowerCase();
    expect(allSchools).toMatch(/university|freecodecamp/i);
  });

  it('recovers projects', () => {
    expect(resume.projects.length).toBeGreaterThanOrEqual(1);
    const allNames = resume.projects
      .map((p) => p.project)
      .join(' ')
      .toLowerCase();
    expect(allNames).toMatch(/3chrin|calculator|bbee|clean/i);
  });

  it('recovers skills', () => {
    const allSkills = resume.skills.descriptions.join(' ').toLowerCase();
    expect(allSkills).toMatch(/react|typescript|node/i);
  });
});
