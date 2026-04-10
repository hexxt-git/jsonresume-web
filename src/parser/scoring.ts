import type { TextItem, FeatureSet } from './types';

interface ScoredResult {
  text: string;
  score: number;
}

export function getTextWithHighestScore(
  items: TextItem[],
  featureSets: FeatureSet[],
  options: {
    returnEmptyIfNotPositive?: boolean;
    concatenateTied?: boolean;
  } = {},
): string {
  const { returnEmptyIfNotPositive = true, concatenateTied = false } = options;
  const scored: ScoredResult[] = [];

  for (const item of items) {
    let score = 0;
    let matchText: string | null = null;
    let hasRegexMatch = false;

    // First pass: regex matchers (primary signal)
    let bestRegexScore = -Infinity;
    for (const fs of featureSets) {
      if (fs.length === 3) {
        const match = fs[0](item);
        if (match) {
          score += fs[1];
          // Keep the match text from the highest-scoring regex
          if (fs[1] > bestRegexScore) {
            bestRegexScore = fs[1];
            matchText = match[0];
          }
          hasRegexMatch = true;
        }
      }
    }

    // Second pass: boolean matchers (secondary signal)
    // Only apply if no regex match, OR if the boolean score is positive
    // This prevents self-contradictory features (e.g., email regex +4, hasAt -4)
    for (const fs of featureSets) {
      if (fs.length === 2) {
        if (fs[0](item)) {
          if (!hasRegexMatch || fs[1] > 0) {
            score += fs[1];
          }
        }
      }
    }

    scored.push({ text: matchText || item.text, score });
  }

  if (!scored.length) return '';

  const maxScore = Math.max(...scored.map((s) => s.score));
  if (returnEmptyIfNotPositive && maxScore <= 0) return '';

  if (concatenateTied) {
    return scored
      .filter((s) => s.score === maxScore)
      .map((s) => s.text)
      .join(' ');
  }

  return scored.find((s) => s.score === maxScore)?.text || '';
}

// Common feature helpers
export const isBold = (item: TextItem): boolean => /bold/i.test(item.fontName);
export const isAllUpper = (item: TextItem): boolean => {
  const letters = item.text.replace(/[^a-zA-Z]/g, '');
  return letters.length > 0 && letters === letters.toUpperCase();
};
export const hasNumber = (item: TextItem): boolean => /\d/.test(item.text);
export const hasComma = (item: TextItem): boolean => item.text.includes(',');
export const hasAt = (item: TextItem): boolean => item.text.includes('@');
export const hasParenthesis = (item: TextItem): boolean => /[()]/.test(item.text);
export const hasSlash = (item: TextItem): boolean => item.text.includes('/');
export const hasLetter = (item: TextItem): boolean => /[a-zA-Z]/.test(item.text);
export const wordCount = (item: TextItem): number => item.text.split(/\s+/).filter(Boolean).length;
export const has4PlusWords = (item: TextItem): boolean => wordCount(item) >= 4;

// Bullet point characters
export const BULLET_CHARS = '⋅∙🞄•⦁⚫●⬤⚬○';
export const BULLET_RE = new RegExp(`[${BULLET_CHARS}]`);
export const isBullet = (text: string): boolean => BULLET_RE.test(text[0]);
