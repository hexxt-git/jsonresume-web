import { describe, it, expect } from 'vitest';
import { groupLinesIntoSections } from '../parser/groupSections';
import type { TextItem, Lines } from '../parser/types';

function makeLine(text: string, fontName = 'Arial'): TextItem[] {
  return [{ text, x: 0, y: 0, width: 100, height: 12, fontName, hasEOL: true }];
}

describe('groupLinesIntoSections', () => {
  it('puts initial lines into profile section', () => {
    const lines: Lines = [
      makeLine('John Doe'),
      makeLine('Software Engineer'),
      makeLine('EXPERIENCE', 'Arial-BoldMT'),
      makeLine('Worked at Acme'),
    ];
    const sections = groupLinesIntoSections(lines);
    expect(sections['profile']).toBeDefined();
    expect(sections['profile']).toHaveLength(2);
  });

  it('detects bold uppercase section titles', () => {
    const lines: Lines = [
      makeLine('John Doe'),
      makeLine('email@test.com'),
      makeLine('WORK EXPERIENCE', 'Arial-BoldMT'),
      makeLine('Job 1'),
      makeLine('EDUCATION', 'Arial-BoldMT'),
      makeLine('School 1'),
    ];
    const sections = groupLinesIntoSections(lines);
    expect(sections['WORK EXPERIENCE']).toBeDefined();
    expect(sections['EDUCATION']).toBeDefined();
    expect(sections['WORK EXPERIENCE']).toHaveLength(1);
    expect(sections['EDUCATION']).toHaveLength(1);
  });

  it('detects section titles by keyword fallback', () => {
    const lines: Lines = [
      makeLine('John'),
      makeLine('email'),
      makeLine('Experience'), // Not bold, not uppercase, but keyword match
      makeLine('Job entry'),
    ];
    const sections = groupLinesIntoSections(lines);
    expect(sections['Experience']).toBeDefined();
  });

  it('does not treat first 2 lines as section titles', () => {
    const lines: Lines = [
      makeLine('JOHN DOE', 'Arial-BoldMT'), // line 0 - should be profile
      makeLine('DEVELOPER', 'Arial-BoldMT'), // line 1 - should be profile
      makeLine('EXPERIENCE', 'Arial-BoldMT'), // line 2 - should be section
      makeLine('Job'),
    ];
    const sections = groupLinesIntoSections(lines);
    expect(sections['profile']).toHaveLength(2);
    expect(sections['EXPERIENCE']).toHaveLength(1);
  });

  it('rejects multi-item lines as section titles', () => {
    const lines: Lines = [
      makeLine('John'),
      makeLine('test'),
      [
        {
          text: 'SKILLS',
          x: 0,
          y: 0,
          width: 50,
          height: 12,
          fontName: 'Arial-BoldMT',
          hasEOL: false,
        },
        {
          text: 'AND MORE',
          x: 60,
          y: 0,
          width: 50,
          height: 12,
          fontName: 'Arial-BoldMT',
          hasEOL: true,
        },
      ],
      makeLine('React'),
    ];
    const sections = groupLinesIntoSections(lines);
    // Multi-item line should NOT be detected as a section title
    expect(sections['SKILLS']).toBeUndefined();
  });
});
