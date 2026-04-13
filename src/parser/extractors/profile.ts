import type { TextItem, SectionMap, FeatureSet } from '../types';
import { findSectionByKeyword } from './lib/section-lookup';
import {
  hasBoldFont,
  containsDigit,
  containsComma,
  containsLetter,
  isAllCaps,
} from './lib/features';
import { selectBestMatch } from './lib/scoring';

// ── Matchers ────────────────────────────────────────────────────────

function matchLettersOnly(item: TextItem) {
  return item.text.match(/^[a-zA-Z\s.]+$/);
}

function matchEmail(item: TextItem) {
  return item.text.match(/\S+@\S+\.\S+/);
}

function matchPhone(item: TextItem) {
  return (
    item.text.match(/[+(]?\d[\d\s\-.()+]{7,}\d/) ||
    item.text.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)
  );
}

function matchLocation(item: TextItem) {
  return (
    item.text.match(/[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b/) ||
    item.text.match(/[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z]+/)
  );
}

function matchUrl(item: TextItem) {
  return item.text.match(/\S+\.[a-z]+\/\S+/);
}

function matchHttpUrl(item: TextItem) {
  return item.text.match(/https?:\/\/\S+\.\S+/);
}

function matchWwwUrl(item: TextItem) {
  return item.text.match(/www\.\S+\.\S+/);
}

function hasAtSign(item: TextItem): boolean {
  return item.text.includes('@');
}

function hasDigitParens(item: TextItem): boolean {
  return /\([0-9]+\)/.test(item.text);
}

function hasSlash(item: TextItem): boolean {
  return item.text.includes('/');
}

function has4Words(item: TextItem): boolean {
  return item.text.split(' ').length >= 4;
}

// ── Feature sets ────────────────────────────────────────────────────

const NAME_FEATURES: FeatureSet[] = [
  [matchLettersOnly, 3, true],
  [hasBoldFont, 2],
  [isAllCaps, 2],
  [hasAtSign, -4],
  [containsDigit, -4],
  [hasDigitParens, -4],
  [containsComma, -4],
  [hasSlash, -4],
  [has4Words, -2],
];

const EMAIL_FEATURES: FeatureSet[] = [
  [matchEmail, 4, true],
  [hasBoldFont, -1],
  [isAllCaps, -1],
  [hasDigitParens, -4],
  [containsComma, -4],
  [hasSlash, -4],
  [has4Words, -4],
];

const PHONE_FEATURES: FeatureSet[] = [
  [matchPhone, 4, true],
  [containsLetter, -4],
];

const LOCATION_FEATURES: FeatureSet[] = [
  [matchLocation, 4, true],
  [hasBoldFont, -1],
  [hasAtSign, -4],
  [hasDigitParens, -3],
  [hasSlash, -4],
];

const URL_FEATURES: FeatureSet[] = [
  [matchUrl, 4, true],
  [matchHttpUrl, 3, true],
  [matchWwwUrl, 3, true],
  [hasBoldFont, -1],
  [hasAtSign, -4],
  [hasDigitParens, -3],
  [containsComma, -4],
  [has4Words, -4],
];

const SUMMARY_FEATURES: FeatureSet[] = [
  [has4Words, 4],
  [hasBoldFont, -1],
  [hasAtSign, -4],
  [hasDigitParens, -3],
  [matchLocation, -4, false],
];

// ── Extraction ──────────────────────────────────────────────────────

export function parseProfile(sections: SectionMap) {
  const items = (sections.profile ?? []).flat();

  const [name, nameScores] = selectBestMatch(items, NAME_FEATURES);
  const [email, emailScores] = selectBestMatch(items, EMAIL_FEATURES);
  const [phone, phoneScores] = selectBestMatch(items, PHONE_FEATURES);
  const [location, locationScores] = selectBestMatch(items, LOCATION_FEATURES);
  const [url, urlScores] = selectBestMatch(items, URL_FEATURES);
  const [summary, summaryScores] = selectBestMatch(items, SUMMARY_FEATURES, undefined, true);

  const summaryText =
    findSectionByKeyword(sections, ['summary'])
      .flat()
      .map((i) => i.text)
      .join(' ') ||
    findSectionByKeyword(sections, ['objective'])
      .flat()
      .map((i) => i.text)
      .join(' ') ||
    summary;

  const allText = items.map((i) => i.text).join(' ');
  const linkedinMatch =
    allText.match(/linkedin\.com\/in\/([^\s/,]+)/i) ?? allText.match(/\bin\/([a-zA-Z][\w-]+)/);

  return {
    profile: {
      name,
      email,
      phone,
      location,
      url,
      summary: summaryText,
      linkedin: linkedinMatch
        ? { username: linkedinMatch[1], url: `https://www.linkedin.com/in/${linkedinMatch[1]}` }
        : undefined,
    },
    profileScores: {
      name: nameScores,
      email: emailScores,
      phone: phoneScores,
      location: locationScores,
      url: urlScores,
      summary: summaryScores,
    },
  };
}
