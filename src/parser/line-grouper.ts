import type { TextItems, Line, Lines } from './types';
import { BULLET_CHARS } from './extractors/lib/bullets';

export function groupIntoLines(textItems: TextItems): Lines {
  const rawLines = splitByEol(textItems);
  const charWidth = computeTypicalCharWidth(textItems);
  return rawLines.map((line) => mergeAdjacentItems(line, charWidth));
}

// ── Internals ───────────────────────────────────────────────────────

function splitByEol(items: TextItems): Lines {
  const lines: Lines = [];
  let current: Line = [];

  items.forEach((item) => {
    if (item.hasEOL) {
      if (item.text.trim()) current.push({ ...item });
      lines.push(current);
      current = [];
    } else if (item.text.trim()) {
      current.push({ ...item });
    }
  });

  if (current.length > 0) lines.push(current);
  return lines;
}

function mergeAdjacentItems(line: Line, charWidth: number): Line {
  if (line.length <= 1) return line;

  const result = [...line];
  for (let i = result.length - 1; i > 0; i--) {
    const right = result[i];
    const left = result[i - 1];
    const gap = right.x - (left.x + left.width);

    if (gap <= charWidth) {
      const space = needsSpace(left.text, right.text) ? ' ' : '';
      left.text += space + right.text;
      left.width = right.x + right.width - left.x;
      result.splice(i, 1);
    }
  }
  return result;
}

const SPACE_TRIGGERS = new Set([':', ',', '|', '.', ...BULLET_CHARS]);

function needsSpace(leftText: string, rightText: string): boolean {
  const leftEnd = leftText[leftText.length - 1];
  const rightStart = rightText[0];

  return (
    (SPACE_TRIGGERS.has(leftEnd) && rightStart !== ' ') ||
    (leftEnd !== ' ' && (rightStart === '|' || BULLET_CHARS.includes(rightStart)))
  );
}

function computeTypicalCharWidth(items: TextItems): number {
  const nonEmpty = items.filter((i) => i.text.trim());

  const heightFreq = new Map<number, number>();
  const fontCharCount = new Map<string, number>();
  let topHeight = 0,
    topHeightCount = 0;
  let topFont = '',
    topFontCount = 0;

  nonEmpty.forEach(({ height, fontName, text }) => {
    const hc = (heightFreq.get(height) ?? 0) + 1;
    heightFreq.set(height, hc);
    if (hc > topHeightCount) {
      topHeight = height;
      topHeightCount = hc;
    }

    const fc = (fontCharCount.get(fontName) ?? 0) + text.length;
    fontCharCount.set(fontName, fc);
    if (fc > topFontCount) {
      topFont = fontName;
      topFontCount = fc;
    }
  });

  const matching = nonEmpty.filter((i) => i.fontName === topFont && i.height === topHeight);
  const totalWidth = matching.reduce((sum, i) => sum + i.width, 0);
  const totalChars = matching.reduce((sum, i) => sum + i.text.length, 0);

  return totalChars > 0 ? totalWidth / totalChars : 5;
}
