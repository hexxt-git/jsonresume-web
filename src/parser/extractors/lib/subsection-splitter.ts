import type { Lines, Line, SubsectionList } from '../../types';
import { BULLET_CHARS } from './bullets';
import { hasBoldFont } from './features';

export function splitIntoGroups(lines: Lines): SubsectionList {
  const byGap = partition(lines, buildGapDetector(lines));
  if (byGap.length > 1) return byGap;

  // Fallback: split where a bold line follows a non-bold line
  return partition(
    lines,
    (line, prev) =>
      !hasBoldFont(prev[0]) && hasBoldFont(line[0]) && !BULLET_CHARS.includes(line[0].text),
  );
}

// ── Internals ───────────────────────────────────────────────────────

type SplitPredicate = (current: Line, previous: Line) => boolean;

function partition(lines: Lines, shouldSplit: SplitPredicate): SubsectionList {
  if (lines.length === 0) return [];

  const result: SubsectionList = [];
  let group: Lines = [lines[0]];

  for (let i = 1; i < lines.length; i++) {
    if (shouldSplit(lines[i], lines[i - 1])) {
      result.push(group);
      group = [];
    }
    group.push(lines[i]);
  }
  if (group.length > 0) result.push(group);

  return result;
}

function buildGapDetector(lines: Lines): SplitPredicate {
  const yValues = lines.map((line) => line[0].y);
  const gapFrequency: Record<number, number> = {};
  let dominantGap = 0;
  let maxFreq = 0;

  for (let i = 1; i < yValues.length; i++) {
    const gap = Math.round(yValues[i - 1] - yValues[i]);
    gapFrequency[gap] = (gapFrequency[gap] ?? 0) + 1;
    if (gapFrequency[gap] > maxFreq) {
      dominantGap = gap;
      maxFreq = gapFrequency[gap];
    }
  }

  const threshold = dominantGap * 1.4;
  return (line, prev) => Math.round(prev[0].y - line[0].y) > threshold;
}
