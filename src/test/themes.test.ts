import { describe, it, expect } from 'vitest';
import { themes, getThemeById } from '../themes';
import { sampleResume } from '../utils/sample';
import { fullSchemaResume } from './fullSchemaResume';
import type { ResumeSchema } from '../types/resume';

describe('themes', () => {
  it('has exactly 10 themes', () => {
    expect(themes).toHaveLength(10);
  });

  it('each theme has unique id', () => {
    const ids = themes.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each theme has name and description', () => {
    for (const theme of themes) {
      expect(theme.name).toBeTruthy();
      expect(theme.description).toBeTruthy();
    }
  });

  it('getThemeById returns correct theme', () => {
    expect(getThemeById('modern').id).toBe('modern');
    expect(getThemeById('dark').id).toBe('dark');
  });

  it('getThemeById falls back to first theme for unknown id', () => {
    expect(getThemeById('nonexistent').id).toBe(themes[0].id);
  });
});

describe('theme rendering', () => {
  for (const theme of themes) {
    describe(`${theme.name} theme`, () => {
      it('renders sample resume to valid HTML', () => {
        const html = theme.render(sampleResume);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('</html>');
        expect(html).toContain('Salah Zeghdani');
      });

      it('includes work experience', () => {
        const html = theme.render(sampleResume);
        expect(html).toContain('Frontend Engineer');
        expect(html).toContain('bortocall.dz');
      });

      it('includes education', () => {
        const html = theme.render(sampleResume);
        expect(html).toContain('University of Science and Technology');
      });

      it('includes skills', () => {
        const html = theme.render(sampleResume);
        expect(html).toContain('React.js');
        expect(html).toContain('TypeScript');
      });

      it('includes projects', () => {
        const html = theme.render(sampleResume);
        expect(html).toContain('3chrin.com');
      });

      it('handles empty resume without crashing', () => {
        const empty: ResumeSchema = { basics: { name: 'Test' } };
        const html = theme.render(empty);
        expect(html).toContain('Test');
        expect(html).toContain('<!DOCTYPE html>');
      });

      it('handles completely empty resume', () => {
        const html = theme.render({});
        expect(html).toContain('<!DOCTYPE html>');
      });

      it('escapes HTML in user input', () => {
        const malicious: ResumeSchema = {
          basics: { name: '<script>alert("xss")</script>' },
        };
        const html = theme.render(malicious);
        expect(html).not.toContain('<script>alert');
        expect(html).toContain('&lt;script&gt;');
      });
    });
  }
});

// Full schema coverage: every field in the schema must appear in every theme
describe('full schema field coverage', () => {
  for (const theme of themes) {
    describe(`${theme.name} theme renders all schema fields`, () => {
      const html = theme.render(fullSchemaResume);

      // --- basics ---
      it('renders basics.name', () => {
        expect(html).toContain('Jane Fullschema');
      });
      it('renders basics.label', () => {
        expect(html).toContain('Senior Engineer');
      });
      it('renders basics.image', () => {
        expect(html).toContain('https://example.com/photo.jpg');
      });
      it('renders basics.email', () => {
        expect(html).toContain('jane@fullschema.test');
      });
      it('renders basics.phone', () => {
        expect(html).toContain('+1-555-000-1234');
      });
      it('renders basics.url', () => {
        expect(html).toContain('janefullschema.dev');
      });
      it('renders basics.summary', () => {
        expect(html).toContain('Full schema test summary paragraph');
      });
      it('renders basics.location.city', () => {
        expect(html).toContain('San Francisco');
      });
      it('renders basics.location.region', () => {
        expect(html).toContain('California');
      });
      it('renders basics.profiles', () => {
        expect(html).toContain('GitHub');
      });

      // --- work ---
      it('renders work.position', () => {
        expect(html).toContain('Lead Engineer');
      });
      it('renders work.name', () => {
        expect(html).toContain('FullCorp');
      });
      it('renders work.description', () => {
        expect(html).toContain('A test company description');
      });
      it('renders work.location', () => {
        expect(html).toContain('Remote');
      });
      it('renders work.summary', () => {
        expect(html).toContain('Led engineering team on platform work');
      });
      it('renders work.highlights', () => {
        expect(html).toContain('Shipped v2 platform');
        expect(html).toContain('Reduced latency by 40%');
      });

      // --- volunteer ---
      it('renders volunteer.organization', () => {
        expect(html).toContain('Code For Good');
      });
      it('renders volunteer.position', () => {
        expect(html).toContain('Mentor');
      });
      it('renders volunteer.summary', () => {
        expect(html).toContain('Mentored junior developers weekly');
      });
      it('renders volunteer.highlights', () => {
        expect(html).toContain('Guided 12 mentees');
      });

      // --- education ---
      it('renders education.institution as link', () => {
        expect(html).toContain('mit.edu');
      });
      it('renders education.studyType', () => {
        expect(html).toContain('Bachelor');
      });
      it('renders education.area', () => {
        expect(html).toContain('Computer Science');
      });
      it('renders education.score', () => {
        expect(html).toContain('3.9');
      });
      it('renders education.courses', () => {
        expect(html).toContain('Algorithms');
        expect(html).toContain('Distributed Systems');
        expect(html).toContain('Machine Learning');
      });

      // --- awards ---
      it('renders awards.title', () => {
        expect(html).toContain('Best Paper Award');
      });
      it('renders awards.awarder', () => {
        expect(html).toContain('ACM');
      });
      it('renders awards.summary', () => {
        expect(html).toContain('Awarded for outstanding research');
      });

      // --- certificates ---
      it('renders certificates.name', () => {
        expect(html).toContain('AWS Solutions Architect');
      });
      it('renders certificates.issuer', () => {
        expect(html).toContain('Amazon');
      });

      // --- publications ---
      it('renders publications.name', () => {
        expect(html).toContain('Scaling Distributed Systems');
      });
      it('renders publications.publisher', () => {
        expect(html).toContain('IEEE');
      });
      it('renders publications.summary', () => {
        expect(html).toContain('horizontal scaling patterns');
      });

      // --- skills ---
      it('renders skills.name', () => {
        expect(html).toContain('Frontend');
        expect(html).toContain('Backend');
      });
      it('renders skills.level', () => {
        expect(html).toContain('Expert');
        expect(html).toContain('Advanced');
      });
      it('renders skills.keywords', () => {
        expect(html).toContain('React');
        expect(html).toContain('TypeScript');
        expect(html).toContain('PostgreSQL');
      });

      // --- languages ---
      it('renders languages.language', () => {
        expect(html).toContain('English');
        expect(html).toContain('Spanish');
      });
      it('renders languages.fluency', () => {
        expect(html).toContain('Native');
        expect(html).toContain('Conversational');
      });

      // --- interests ---
      it('renders interests.name', () => {
        expect(html).toContain('Open Source');
      });
      it('renders interests.keywords', () => {
        expect(html).toContain('Linux');
        expect(html).toContain('Vim');
        expect(html).toContain('Rust');
      });

      // --- references ---
      it('renders references.name', () => {
        expect(html).toContain('Tim Testref');
      });
      it('renders references.reference', () => {
        expect(html).toContain('exceptional engineer and collaborator');
      });

      // --- projects ---
      it('renders projects.name', () => {
        expect(html).toContain('TestProject');
      });
      it('renders projects.description', () => {
        expect(html).toContain('full-schema test project');
      });
      it('renders projects.highlights', () => {
        expect(html).toContain('Built entire MVP');
        expect(html).toContain('Deployed to production');
      });
      it('renders projects.keywords', () => {
        expect(html).toContain('GraphQL');
        expect(html).toContain('Docker');
      });
      it('renders projects.roles', () => {
        expect(html).toContain('Lead Developer');
        expect(html).toContain('Architect');
      });
      it('renders projects.entity', () => {
        expect(html).toContain('OpenSource Foundation');
      });
      it('renders projects.type', () => {
        expect(html).toContain('application');
      });
    });
  }
});
