import { describe, it, expect } from 'vitest';
import { themes, getThemeById } from '../themes';
import { sampleResume } from '../utils/sample';
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
