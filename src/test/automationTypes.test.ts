import { describe, it, expect } from 'vitest';
import { scoreTextCls, scoreBgCls } from '../components/automation/pipeline/types';

describe('scoreTextCls', () => {
  it('returns green for score >= 75', () => {
    expect(scoreTextCls(75)).toBe('text-diff-add');
    expect(scoreTextCls(100)).toBe('text-diff-add');
  });

  it('returns accent for 50-74', () => {
    expect(scoreTextCls(50)).toBe('text-accent');
    expect(scoreTextCls(74)).toBe('text-accent');
  });

  it('returns red for score < 50', () => {
    expect(scoreTextCls(0)).toBe('text-diff-rm');
    expect(scoreTextCls(49)).toBe('text-diff-rm');
  });
});

describe('scoreBgCls', () => {
  it('returns green for score >= 75', () => {
    expect(scoreBgCls(75)).toBe('bg-diff-add');
    expect(scoreBgCls(100)).toBe('bg-diff-add');
  });

  it('returns accent for 50-74', () => {
    expect(scoreBgCls(50)).toBe('bg-accent');
    expect(scoreBgCls(74)).toBe('bg-accent');
  });

  it('returns red for score < 50', () => {
    expect(scoreBgCls(0)).toBe('bg-diff-rm');
    expect(scoreBgCls(49)).toBe('bg-diff-rm');
  });
});
