import { describe, it, expect } from 'vitest';
import { md } from '../themes/helpers';
import { themes } from '../themes';
import type { ResumeSchema } from '../types/resume';

describe('md helper', () => {
  it('renders bold', () => {
    expect(md('this is **bold** text')).toContain('<strong>bold</strong>');
  });

  it('renders italic', () => {
    expect(md('this is *italic* text')).toContain('<em>italic</em>');
  });

  it('renders inline code', () => {
    expect(md('use `npm install`')).toContain('<code');
    expect(md('use `npm install`')).toContain('npm install');
  });

  it('renders links', () => {
    expect(md('see [Google](https://google.com)')).toContain('<a href="https://google.com"');
    expect(md('see [Google](https://google.com)')).toContain('Google</a>');
  });

  it('escapes HTML before rendering markdown', () => {
    expect(md('<script>**bold**</script>')).not.toContain('<script>');
    expect(md('<script>**bold**</script>')).toContain('<strong>bold</strong>');
  });

  it('returns empty string for undefined/null', () => {
    expect(md(undefined)).toBe('');
    expect(md(null)).toBe('');
  });

  it('handles plain text without markdown', () => {
    expect(md('just text')).toBe('just text');
  });
});

describe('markdown in themes', () => {
  const mdResume: ResumeSchema = {
    basics: {
      name: 'Test',
      summary: 'I work with **React** and *TypeScript*',
    },
    work: [
      {
        position: 'Dev',
        name: 'Co',
        highlights: ['Built [dashboard](https://example.com)', 'Used `GraphQL`'],
      },
    ],
  };

  for (const theme of themes) {
    it(`${theme.name} renders markdown in summary`, () => {
      const html = theme.render(mdResume);
      expect(html).toContain('<strong>React</strong>');
      expect(html).toContain('<em>TypeScript</em>');
    });

    it(`${theme.name} renders markdown in highlights`, () => {
      const html = theme.render(mdResume);
      expect(html).toContain('<a href="https://example.com"');
      expect(html).toContain('<code');
    });
  }
});
