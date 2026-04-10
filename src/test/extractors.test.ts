import { describe, it, expect } from 'vitest';
import type { TextItem, Sections } from '../parser/types';
import {
  extractProfile,
  extractWork,
  extractEducation,
  extractProjects,
  extractSkills,
  extractLanguages,
} from '../parser/extractors';

function makeItem(text: string, x = 0, fontName = 'Arial', y = 700): TextItem {
  return { text, x, y, width: text.length * 7, height: 12, fontName, hasEOL: true };
}

function makeSections(profile: string[], sectionMap: Record<string, string[][]>): Sections {
  const sections: Sections = {
    profile: profile.map((t) => [makeItem(t)]),
  };
  for (const [name, lineTexts] of Object.entries(sectionMap)) {
    sections[name] = lineTexts.map((items) => items.map((t, i) => makeItem(t, i * 200)));
  }
  return sections;
}

describe('extractProfile', () => {
  it('extracts name from bold text', () => {
    const sections: Sections = {
      profile: [
        [makeItem('John Doe', 0, 'Arial-BoldMT')],
        [makeItem('john@example.com')],
        [makeItem('(555) 123-4567')],
      ],
    };
    const basics = extractProfile(sections);
    expect(basics?.name).toBe('John Doe');
  });

  it('extracts email', () => {
    const sections: Sections = {
      profile: [[makeItem('John Doe', 0, 'Arial-BoldMT')], [makeItem('john@example.com')]],
    };
    const basics = extractProfile(sections);
    expect(basics?.email).toBe('john@example.com');
  });

  it('extracts phone number', () => {
    const sections: Sections = {
      profile: [[makeItem('Name')], [makeItem('(555) 123-4567')]],
    };
    const basics = extractProfile(sections);
    expect(basics?.phone).toBe('(555) 123-4567');
  });

  it('extracts location in "City, ST" format', () => {
    const sections: Sections = {
      profile: [[makeItem('Name')], [makeItem('San Francisco, CA')]],
    };
    const basics = extractProfile(sections);
    expect(basics?.location?.city).toBe('San Francisco');
    expect(basics?.location?.region).toBe('CA');
  });

  it('extracts url', () => {
    const sections: Sections = {
      profile: [[makeItem('Name')], [makeItem('https://github.com/johndoe')]],
    };
    const basics = extractProfile(sections);
    expect(basics?.url).toBe('https://github.com/johndoe');
  });

  it('detects LinkedIn profile', () => {
    const sections: Sections = {
      profile: [[makeItem('Name')], [makeItem('linkedin.com/in/johndoe')]],
    };
    const basics = extractProfile(sections);
    expect(basics?.profiles).toBeDefined();
    expect(basics?.profiles![0].network).toBe('LinkedIn');
    expect(basics?.profiles![0].username).toBe('johndoe');
  });
});

describe('extractWork', () => {
  it('extracts work entries from experience section', () => {
    const sections = makeSections(['John Doe'], {
      EXPERIENCE: [
        ['Software Engineer'],
        ['Acme Corp'],
        ['Jan 2023 - Present'],
        ['• Built features'],
        ['• Led team'],
      ],
    });
    const work = extractWork(sections);
    expect(work).toBeDefined();
    expect(work!.length).toBeGreaterThanOrEqual(1);
  });

  it('returns undefined for missing section', () => {
    const sections = makeSections(['John'], {});
    expect(extractWork(sections)).toBeUndefined();
  });
});

describe('extractEducation', () => {
  it('extracts education with school keywords', () => {
    const sections = makeSections(['John'], {
      EDUCATION: [
        ['Massachusetts Institute of Technology'],
        ['Bachelor of Science in Computer Science'],
        ['2018 - 2022'],
      ],
    });
    const edu = extractEducation(sections);
    expect(edu).toBeDefined();
    expect(edu!.length).toBeGreaterThanOrEqual(1);
  });

  it('returns undefined for missing section', () => {
    const sections = makeSections(['John'], {});
    expect(extractEducation(sections)).toBeUndefined();
  });
});

describe('extractProjects', () => {
  it('extracts projects', () => {
    const sections = makeSections(['John'], {
      PROJECTS: [['My Cool Project'], ['• Built with React']],
    });
    const projects = extractProjects(sections);
    expect(projects).toBeDefined();
    expect(projects!.length).toBeGreaterThanOrEqual(1);
  });
});

describe('extractSkills', () => {
  it('extracts colon-separated skill groups', () => {
    const sections = makeSections(['John'], {
      SKILLS: [['Frontend: React, TypeScript, CSS'], ['Backend: Node.js, Python, SQL']],
    });
    const skills = extractSkills(sections);
    expect(skills).toBeDefined();
    expect(skills!.length).toBe(2);
    expect(skills![0].name).toBe('Frontend');
    expect(skills![0].keywords).toContain('React');
    expect(skills![0].keywords).toContain('TypeScript');
    expect(skills![1].name).toBe('Backend');
  });

  it('extracts comma-separated skills', () => {
    const sections = makeSections(['John'], {
      SKILLS: [['React, TypeScript, Node.js, Python']],
    });
    const skills = extractSkills(sections);
    expect(skills).toBeDefined();
    expect(skills![0].keywords).toContain('React');
    expect(skills![0].keywords).toContain('Python');
  });
});

describe('extractLanguages', () => {
  it('extracts languages with fluency', () => {
    const sections = makeSections(['John'], {
      LANGUAGES: [['English - Native, French - Fluent']],
    });
    const langs = extractLanguages(sections);
    expect(langs).toBeDefined();
    expect(langs!.length).toBe(2);
    expect(langs![0].language).toBe('English');
    expect(langs![0].fluency).toBe('Native');
  });
});
