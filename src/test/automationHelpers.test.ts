import { describe, it, expect } from 'vitest';
import { splitJds, extractMeta, timeAgo, stringify } from '../components/automation/shared/helpers';

/* ── splitJds ───────────────────────────────────────────── */

describe('splitJds', () => {
  it('splits on --- separator', () => {
    const input =
      'First job description here that is long enough\n---\nSecond job description here that is long enough';
    const result = splitJds(input);
    expect(result).toEqual([
      'First job description here that is long enough',
      'Second job description here that is long enough',
    ]);
  });

  it('splits on === separator', () => {
    const input =
      'First job description here that is long enough\n===\nSecond job description here that is long enough';
    const result = splitJds(input);
    expect(result).toEqual([
      'First job description here that is long enough',
      'Second job description here that is long enough',
    ]);
  });

  it('splits on 3+ blank lines', () => {
    const input =
      'First job description here that is long enough\n\n\n\nSecond job description here that is long enough';
    const result = splitJds(input);
    expect(result).toEqual([
      'First job description here that is long enough',
      'Second job description here that is long enough',
    ]);
  });

  it('filters out chunks shorter than 20 chars', () => {
    const input =
      'A real job description that is definitely long enough\n---\nshort\n---\nAnother real job description that is long enough';
    const result = splitJds(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('real job');
    expect(result[1]).toContain('Another');
  });

  it('trims whitespace from chunks', () => {
    const input =
      '  First job description padded with spaces  \n---\n  Second job description padded too  ';
    const result = splitJds(input);
    expect(result[0]).toBe('First job description padded with spaces');
    expect(result[1]).toBe('Second job description padded too');
  });

  it('returns empty array for empty input', () => {
    expect(splitJds('')).toEqual([]);
    expect(splitJds('   ')).toEqual([]);
  });

  it('returns single item when no separators', () => {
    const input = 'Just one job description that is long enough to pass the filter';
    expect(splitJds(input)).toEqual([input]);
  });
});

/* ── extractMeta ────────────────────────────────────────── */

describe('extractMeta', () => {
  it('extracts "title at company" pattern', () => {
    const result = extractMeta('Software Engineer at Google\nSome description');
    expect(result.title).toBe('Software Engineer');
    expect(result.company).toBe('Google');
  });

  it('extracts "title @ company" pattern', () => {
    const result = extractMeta('Designer @ Figma');
    expect(result.title).toBe('Designer');
    expect(result.company).toBe('Figma');
  });

  it('extracts "title — company" pattern', () => {
    const result = extractMeta('Product Manager — Stripe');
    expect(result.title).toBe('Product Manager');
    expect(result.company).toBe('Stripe');
  });

  it('extracts company from "Company: ..." line', () => {
    const result = extractMeta('Senior Engineer\nCompany: Acme Corp\nLocation: Remote');
    expect(result.title).toBe('Senior Engineer');
    expect(result.company).toBe('Acme Corp');
  });

  it('extracts company from "Employer: ..." line', () => {
    const result = extractMeta('Data Scientist\nEmployer: Netflix');
    expect(result.title).toBe('Data Scientist');
    expect(result.company).toBe('Netflix');
  });

  it('returns first line as title when no pattern matches', () => {
    const result = extractMeta('Frontend Developer\nWe are looking for...');
    expect(result.title).toBe('Frontend Developer');
    expect(result.company).toBe('');
  });

  it('truncates title at 100 chars', () => {
    const longTitle = 'A'.repeat(150);
    const result = extractMeta(longTitle);
    expect(result.title).toHaveLength(100);
  });

  it('returns Untitled for empty input', () => {
    const result = extractMeta('');
    expect(result.title).toBe('Untitled');
    expect(result.company).toBe('');
  });

  it('skips blank lines', () => {
    const result = extractMeta('\n\n  \n  Engineer at Meta\n');
    expect(result.title).toBe('Engineer');
    expect(result.company).toBe('Meta');
  });
});

/* ── timeAgo ────────────────────────────────────────────── */

describe('timeAgo', () => {
  it('returns "now" for timestamps less than 1 minute ago', () => {
    expect(timeAgo(Date.now())).toBe('now');
    expect(timeAgo(Date.now() - 30_000)).toBe('now');
  });

  it('returns minutes for < 1 hour', () => {
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe('5m');
    expect(timeAgo(Date.now() - 45 * 60_000)).toBe('45m');
  });

  it('returns hours for < 24 hours', () => {
    expect(timeAgo(Date.now() - 3 * 3600_000)).toBe('3h');
    expect(timeAgo(Date.now() - 23 * 3600_000)).toBe('23h');
  });

  it('returns days for < 30 days', () => {
    expect(timeAgo(Date.now() - 5 * 86400_000)).toBe('5d');
    expect(timeAgo(Date.now() - 29 * 86400_000)).toBe('29d');
  });

  it('returns formatted date for >= 30 days', () => {
    const old = Date.now() - 60 * 86400_000;
    const result = timeAgo(old);
    // Should be a short date like "Jan 15" — just check it's not a number format
    expect(result).not.toMatch(/^\d+[mhd]$/);
    expect(result).not.toBe('now');
  });
});

/* ── stringify ──────────────────────────────────────────── */

describe('stringify', () => {
  it('returns strings as-is', () => {
    expect(stringify('hello')).toBe('hello');
    expect(stringify('')).toBe('');
  });

  it('JSON-stringifies objects with 2-space indent', () => {
    const result = stringify({ a: 1 });
    expect(result).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it('JSON-stringifies arrays', () => {
    const result = stringify([1, 2, 3]);
    expect(result).toBe(JSON.stringify([1, 2, 3], null, 2));
  });

  it('handles null and undefined', () => {
    expect(stringify(null)).toBe('null');
    expect(stringify(undefined)).toBe(undefined as any); // JSON.stringify(undefined) returns undefined
  });

  it('handles numbers', () => {
    expect(stringify(42)).toBe('42');
  });
});
