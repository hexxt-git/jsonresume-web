import type { Lines } from '../../types';

export const BULLET_CHARS = ['⋅', '∙', '🞄', '•', '⦁', '⚫︎', '●', '⬤', '⚬', '○'];

export function extractBullets(lines: Lines): string[] {
  const firstIdx = findFirstBulletLineIdx(lines);

  if (firstIdx === undefined) {
    return lines.map((line) => line.map((item) => item.text).join(' '));
  }

  const combined = lines.flat().reduce((str, item) => {
    const sep = !str.endsWith(' ') && !item.text.startsWith(' ') ? ' ' : '';
    return str + sep + item.text;
  }, '');

  const bullet = detectDominantBullet(combined);
  const startPos = combined.indexOf(bullet);
  const content = startPos !== -1 ? combined.slice(startPos) : combined;

  return content
    .split(bullet)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function findDescriptionStart(lines: Lines): number | undefined {
  const bulletIdx = findFirstBulletLineIdx(lines);
  if (bulletIdx !== undefined) return bulletIdx;

  return lines.findIndex(
    (line) =>
      line.length === 1 && line[0].text.split(/\s/).filter((w) => /^[^0-9]+$/.test(w)).length >= 8,
  ) === -1
    ? undefined
    : lines.findIndex(
        (line) =>
          line.length === 1 &&
          line[0].text.split(/\s/).filter((w) => /^[^0-9]+$/.test(w)).length >= 8,
      );
}

// ── Internals ───────────────────────────────────────────────────────

function findFirstBulletLineIdx(lines: Lines): number | undefined {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].some((item) => BULLET_CHARS.some((b) => item.text.includes(b)))) {
      return i;
    }
  }
  return undefined;
}

function detectDominantBullet(text: string): string {
  const counts = new Map<string, number>(BULLET_CHARS.map((b) => [b, 0]));
  let best = BULLET_CHARS[0];
  let bestCount = 0;

  for (const ch of text) {
    const current = counts.get(ch);
    if (current !== undefined) {
      const next = current + 1;
      counts.set(ch, next);
      if (next > bestCount) {
        best = ch;
        bestCount = next;
      }
    }
  }
  return best;
}
