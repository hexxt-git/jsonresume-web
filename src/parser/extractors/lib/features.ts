import type { TextItem, FeatureSet } from '../../types';

export function hasBoldFont(item: TextItem): boolean {
  return item.fontName.toLowerCase().includes('bold');
}

export function containsLetter(item: TextItem): boolean {
  return /[a-zA-Z]/.test(item.text);
}

export function containsDigit(item: TextItem): boolean {
  return /[0-9]/.test(item.text);
}

export function containsComma(item: TextItem): boolean {
  return item.text.includes(',');
}

export function matchesText(text: string) {
  return (item: TextItem) => item.text.includes(text);
}

export function isAlphaOnly(item: TextItem): boolean {
  return /^[A-Za-z\s&]+$/.test(item.text);
}

export function isAllCaps(item: TextItem): boolean {
  return containsLetter(item) && item.text.toUpperCase() === item.text;
}

// ── Date detection features ─────────────────────────────────────────

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function containsYear(item: TextItem): boolean {
  return /(?:19|20)\d{2}/.test(item.text);
}

function containsMonth(item: TextItem): boolean {
  return MONTH_NAMES.some(
    (month) => item.text.includes(month) || item.text.includes(month.slice(0, 4)),
  );
}

function containsSeason(item: TextItem): boolean {
  return ['Summer', 'Fall', 'Spring', 'Winter'].some((s) => item.text.includes(s));
}

function containsPresent(item: TextItem): boolean {
  return item.text.includes('Present');
}

export const DATE_FEATURES: FeatureSet[] = [
  [containsYear, 1],
  [containsMonth, 1],
  [containsSeason, 1],
  [containsPresent, 1],
  [containsComma, -1],
];
