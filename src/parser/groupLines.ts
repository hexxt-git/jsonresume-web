import type { TextItem, Line, Lines } from './types';

/** Compute the typical character width from the most common font */
function getTypicalCharWidth(items: TextItem[]): number {
  const fontCounts = new Map<string, number>();
  const heightCounts = new Map<number, number>();
  for (const item of items) {
    if (!item.text.trim()) continue;
    fontCounts.set(item.fontName, (fontCounts.get(item.fontName) || 0) + 1);
    const h = Math.round(item.height * 10) / 10;
    heightCounts.set(h, (heightCounts.get(h) || 0) + 1);
  }
  const topFont = [...fontCounts].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const topHeight = [...heightCounts].sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

  let totalWidth = 0,
    totalChars = 0;
  for (const item of items) {
    if (
      item.fontName === topFont &&
      Math.abs(item.height - topHeight) < 0.5 &&
      item.text.length > 0
    ) {
      totalWidth += item.width;
      totalChars += item.text.length;
    }
  }
  return totalChars > 0 ? totalWidth / totalChars : 5;
}

/** Group TextItems into lines using hasEOL, then merge adjacent items within each line */
export function groupTextItemsIntoLines(items: TextItem[]): Lines {
  if (!items.length) return [];

  // Phase 1: group by hasEOL
  const rawLines: Line[] = [];
  let current: Line = [];
  for (const item of items) {
    if (item.text.trim()) current.push(item);
    if (item.hasEOL) {
      if (current.length) rawLines.push(current);
      current = [];
    }
  }
  if (current.length) rawLines.push(current);

  // Phase 2: merge adjacent items within each line
  const charWidth = getTypicalCharWidth(items);
  const merged: Lines = [];

  for (const line of rawLines) {
    if (line.length <= 1) {
      merged.push(line);
      continue;
    }

    const result = [...line];
    for (let i = result.length - 1; i > 0; i--) {
      const left = result[i - 1];
      const right = result[i];
      const gap = right.x - (left.x + left.width);

      if (gap <= charWidth) {
        const needsSpace = shouldAddSpace(left.text, right.text);
        left.text = left.text + (needsSpace ? ' ' : '') + right.text;
        left.width = right.x + right.width - left.x;
        left.hasEOL = right.hasEOL;
        result.splice(i, 1);
      }
    }
    if (result.length) merged.push(result);
  }

  return merged;
}

function shouldAddSpace(left: string, right: string): boolean {
  const endPunct = /[:|,.]$/;
  const startPunct = /^[|]/;
  const bullets = /[⋅∙🞄•⦁⚫●⬤⚬○]/;

  if ((endPunct.test(left) || bullets.test(left.slice(-1))) && !right.startsWith(' ')) return true;
  if (!left.endsWith(' ') && (startPunct.test(right) || bullets.test(right[0]))) return true;
  return false;
}
