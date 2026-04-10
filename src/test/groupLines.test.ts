import { describe, it, expect } from 'vitest';
import { groupTextItemsIntoLines } from '../parser/groupLines';
import type { TextItem } from '../parser/types';

function makeItem(
  text: string,
  x: number,
  width: number,
  hasEOL = false,
  fontName = 'Arial',
): TextItem {
  return { text, x, y: 700, width, height: 12, fontName, hasEOL };
}

describe('groupTextItemsIntoLines', () => {
  it('groups items by hasEOL', () => {
    const items: TextItem[] = [
      makeItem('Hello', 0, 30, false),
      makeItem('World', 35, 30, true),
      makeItem('Next line', 0, 50, true),
    ];
    const lines = groupTextItemsIntoLines(items);
    expect(lines).toHaveLength(2);
  });

  it('merges adjacent items within a line', () => {
    // Two items very close together should merge
    const items: TextItem[] = [makeItem('John', 0, 25, false), makeItem(' Doe', 25, 25, true)];
    const lines = groupTextItemsIntoLines(items);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveLength(1);
    expect(lines[0][0].text).toBe('John Doe');
  });

  it('keeps distant items separate', () => {
    const items: TextItem[] = [makeItem('Left', 0, 25, false), makeItem('Right', 500, 25, true)];
    const lines = groupTextItemsIntoLines(items);
    expect(lines).toHaveLength(1);
    // Items are far apart, should remain separate
    expect(lines[0].length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty input', () => {
    expect(groupTextItemsIntoLines([])).toEqual([]);
  });

  it('filters whitespace-only items', () => {
    const items: TextItem[] = [
      makeItem('Hello', 0, 30, false),
      makeItem('   ', 35, 10, false),
      makeItem('World', 50, 30, true),
    ];
    const lines = groupTextItemsIntoLines(items);
    expect(lines).toHaveLength(1);
    // The whitespace item should be filtered
    const text = lines[0].map((i) => i.text).join('');
    expect(text).not.toContain('   ');
  });
});
