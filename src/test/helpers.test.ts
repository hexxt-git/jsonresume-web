import { describe, it, expect } from 'vitest';
import { esc, formatDate, dateRange, section, link } from '../themes/helpers';

describe('esc', () => {
  it('escapes HTML entities', () => {
    expect(esc('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapes ampersands', () => {
    expect(esc('AT&T')).toBe('AT&amp;T');
  });

  it('returns empty string for undefined/null', () => {
    expect(esc(undefined)).toBe('');
    expect(esc(null)).toBe('');
    expect(esc('')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats year-month to "Mon YYYY"', () => {
    expect(formatDate('2024-01')).toBe('Jan 2024');
    expect(formatDate('2025-12')).toBe('Dec 2025');
  });

  it('returns year only for year-only input', () => {
    expect(formatDate('2024')).toBe('2024');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });
});

describe('dateRange', () => {
  it('formats start to end', () => {
    expect(dateRange('2024-01', '2025-06')).toBe('Jan 2024 - Jun 2025');
  });

  it('shows Present when no end date', () => {
    expect(dateRange('2024-01')).toBe('Jan 2024 - Present');
  });

  it('returns empty when neither date provided', () => {
    expect(dateRange()).toBe('');
  });
});

describe('section', () => {
  it('wraps content with section and h2', () => {
    const result = section('Skills', '<p>React</p>');
    expect(result).toContain('<section class="section" aria-label="Skills">');
    expect(result).toContain('<h2>Skills</h2>');
    expect(result).toContain('<p>React</p>');
  });

  it('returns empty string for empty content', () => {
    expect(section('Skills', '')).toBe('');
    expect(section('Skills', '   ')).toBe('');
  });
});

describe('link', () => {
  it('returns anchor tag with url', () => {
    const result = link('https://example.com', 'Example');
    expect(result).toBe('<a href="https://example.com" target="_blank" rel="noopener">Example</a>');
  });

  it('returns escaped text when no url', () => {
    expect(link(undefined, 'Example')).toBe('Example');
  });

  it('escapes text in link', () => {
    expect(link('https://example.com', '<b>Bold</b>')).toContain('&lt;b&gt;');
  });
});
