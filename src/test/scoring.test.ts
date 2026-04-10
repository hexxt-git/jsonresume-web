import { describe, it, expect } from 'vitest';
import type { TextItem, FeatureSet } from '../parser/types';
import {
  getTextWithHighestScore,
  isBold,
  isAllUpper,
  hasNumber,
  hasComma,
  hasAt,
  hasParenthesis,
  hasSlash,
  has4PlusWords,
} from '../parser/scoring';

function makeItem(text: string, fontName = 'Arial'): TextItem {
  return { text, x: 0, y: 0, width: 100, height: 12, fontName, hasEOL: false };
}

describe('feature helpers', () => {
  it('isBold detects bold fonts', () => {
    expect(isBold(makeItem('test', 'Arial-BoldMT'))).toBe(true);
    expect(isBold(makeItem('test', 'TimesNewRoman-Bold'))).toBe(true);
    expect(isBold(makeItem('test', 'Arial'))).toBe(false);
  });

  it('isAllUpper detects uppercase', () => {
    expect(isAllUpper(makeItem('HELLO WORLD'))).toBe(true);
    expect(isAllUpper(makeItem('Hello World'))).toBe(false);
    expect(isAllUpper(makeItem('123'))).toBe(false);
  });

  it('hasNumber detects digits', () => {
    expect(hasNumber(makeItem('abc123'))).toBe(true);
    expect(hasNumber(makeItem('abc'))).toBe(false);
  });

  it('hasComma, hasAt, hasParenthesis, hasSlash', () => {
    expect(hasComma(makeItem('a, b'))).toBe(true);
    expect(hasAt(makeItem('a@b'))).toBe(true);
    expect(hasParenthesis(makeItem('(test)'))).toBe(true);
    expect(hasSlash(makeItem('a/b'))).toBe(true);
  });

  it('has4PlusWords counts words', () => {
    expect(has4PlusWords(makeItem('one two three four'))).toBe(true);
    expect(has4PlusWords(makeItem('one two'))).toBe(false);
  });
});

describe('getTextWithHighestScore', () => {
  it('returns text with highest positive score', () => {
    const items = [makeItem('john@example.com'), makeItem('John Doe')];
    const emailFeatures: FeatureSet[] = [
      [(i) => i.text.match(/\S+@\S+\.\S+/), 4, true],
      [hasAt, -4], // this won't fire for non-@ items
    ];
    // The email item matches the regex (+4), the name item doesn't match
    expect(getTextWithHighestScore(items, emailFeatures)).toBe('john@example.com');
  });

  it('returns empty string if no positive score when configured', () => {
    const items = [makeItem('no match here')];
    const features: FeatureSet[] = [[(i) => i.text.match(/\d+/), 4, true]];
    expect(getTextWithHighestScore(items, features, { returnEmptyIfNotPositive: true })).toBe('');
  });

  it('returns best candidate even with zero score when returnEmptyIfNotPositive is false', () => {
    const items = [makeItem('some text')];
    const features: FeatureSet[] = [];
    expect(getTextWithHighestScore(items, features, { returnEmptyIfNotPositive: false })).toBe(
      'some text',
    );
  });

  it('concatenates tied items when configured', () => {
    const items = [makeItem('First sentence.'), makeItem('Second sentence.')];
    const features: FeatureSet[] = [];
    const result = getTextWithHighestScore(items, features, {
      returnEmptyIfNotPositive: false,
      concatenateTied: true,
    });
    expect(result).toContain('First sentence.');
    expect(result).toContain('Second sentence.');
  });

  it('negative scores reduce ranking', () => {
    const items = [makeItem('john@example.com'), makeItem('John Doe', 'Arial-BoldMT')];
    const nameFeatures: FeatureSet[] = [
      [
        (i) => (/^[a-zA-Z\s.]+$/.test(i.text) ? ([i.text] as unknown as RegExpMatchArray) : null),
        3,
        true,
      ],
      [isBold, 2],
      [hasAt, -4],
    ];
    // "John Doe" gets +3 (letters only) +2 (bold) = 5
    // "john@example.com" gets -4 (has @) = -4
    expect(getTextWithHighestScore(items, nameFeatures)).toBe('John Doe');
  });
});
