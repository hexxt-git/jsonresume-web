import { describe, it, expect } from 'vitest';
import { textToResume } from '../parser/textToResume';

describe('textToResume (DOCX/text fallback parser)', () => {
  it('extracts name from first line', () => {
    const resume = textToResume('John Doe\nSoftware Engineer');
    expect(resume.basics?.name).toBe('John Doe');
  });

  it('extracts label from second line', () => {
    const resume = textToResume('John Doe\nSoftware Engineer');
    expect(resume.basics?.label).toBe('Software Engineer');
  });

  it('extracts email', () => {
    const resume = textToResume('John Doe\njohn@example.com');
    expect(resume.basics?.email).toBe('john@example.com');
  });

  it('extracts phone number', () => {
    const resume = textToResume('John Doe\n+1 555-123-4567');
    expect(resume.basics?.phone).toBeTruthy();
  });

  it('extracts LinkedIn profile', () => {
    const resume = textToResume('John Doe\nhttps://linkedin.com/in/johndoe');
    expect(resume.basics?.profiles).toBeDefined();
    expect(resume.basics?.profiles![0].network).toBe('LinkedIn');
  });

  it('parses work experience section', () => {
    const text = `John Doe
john@test.com

Experience
Software Engineer at Acme Corp
Jan 2023 - Present
- Built REST APIs
- Led team of 5

Education
MIT
BS Computer Science
2018 - 2022`;

    const resume = textToResume(text);
    expect(resume.work).toBeDefined();
    expect(resume.work!.length).toBeGreaterThanOrEqual(1);
    expect(resume.education).toBeDefined();
  });

  it('parses skills section with colons', () => {
    const text = `John Doe

Skills
Frontend: React, TypeScript, CSS
Backend: Node.js, Python`;

    const resume = textToResume(text);
    expect(resume.skills).toBeDefined();
    expect(resume.skills!.length).toBe(2);
    expect(resume.skills![0].name).toBe('Frontend');
    expect(resume.skills![0].keywords).toContain('React');
  });

  it('parses languages section', () => {
    const text = `John Doe

Languages
English
French
Arabic`;

    const resume = textToResume(text);
    expect(resume.languages).toBeDefined();
    expect(resume.languages!.length).toBe(3);
  });
});
