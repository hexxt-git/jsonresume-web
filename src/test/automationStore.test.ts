import { describe, it, expect, beforeEach } from 'vitest';
import {
  useAutomationStore,
  getPromptDirectives,
  getSectionDirective,
  getCoverLetterDirective,
  getAuditDirective,
  ALL_SECTIONS,
} from '../store/automationStore';

beforeEach(() => {
  useAutomationStore.getState().reset();
});

/* ── Store mutations ────────────────────────────────────── */

describe('automationStore mutations', () => {
  it('has correct defaults', () => {
    const s = useAutomationStore.getState();
    expect(s.tone).toBe('professional');
    expect(s.creativity).toBe('balanced');
    expect(s.coverLetterLength).toBe('standard');
    expect(s.auditStrictness).toBe('standard');
    expect(s.sectionsToTailor).toEqual([...ALL_SECTIONS]);
  });

  it('setTone updates tone', () => {
    useAutomationStore.getState().setTone('formal');
    expect(useAutomationStore.getState().tone).toBe('formal');
  });

  it('setCreativity updates creativity', () => {
    useAutomationStore.getState().setCreativity('creative');
    expect(useAutomationStore.getState().creativity).toBe('creative');
  });

  it('setCoverLetterLength updates length', () => {
    useAutomationStore.getState().setCoverLetterLength('brief');
    expect(useAutomationStore.getState().coverLetterLength).toBe('brief');
  });

  it('setAuditStrictness updates strictness', () => {
    useAutomationStore.getState().setAuditStrictness('strict');
    expect(useAutomationStore.getState().auditStrictness).toBe('strict');
  });

  it('toggleSection removes then re-adds a section', () => {
    const s = useAutomationStore.getState();
    expect(s.sectionsToTailor).toContain('skills');

    s.toggleSection('skills');
    expect(useAutomationStore.getState().sectionsToTailor).not.toContain('skills');

    useAutomationStore.getState().toggleSection('skills');
    expect(useAutomationStore.getState().sectionsToTailor).toContain('skills');
  });

  it('reset restores defaults', () => {
    const s = useAutomationStore.getState();
    s.setTone('casual');
    s.setCreativity('conservative');
    s.toggleSection('work');
    s.reset();

    const after = useAutomationStore.getState();
    expect(after.tone).toBe('professional');
    expect(after.creativity).toBe('balanced');
    expect(after.sectionsToTailor).toEqual([...ALL_SECTIONS]);
  });
});

/* ── getPromptDirectives ────────────────────────────────── */

describe('getPromptDirectives', () => {
  it('always includes placeholder warning', () => {
    const d = getPromptDirectives();
    expect(d).toContain('Never use placeholder text');
  });

  it('adds formal directive for formal tone', () => {
    useAutomationStore.getState().setTone('formal');
    expect(getPromptDirectives()).toContain('formal');
  });

  it('adds casual directive for casual tone', () => {
    useAutomationStore.getState().setTone('casual');
    expect(getPromptDirectives()).toContain('conversational');
  });

  it('adds no tone directive for professional (default)', () => {
    const d = getPromptDirectives();
    expect(d).not.toContain('formal, business');
    expect(d).not.toContain('conversational');
  });

  it('adds conservative directive', () => {
    useAutomationStore.getState().setCreativity('conservative');
    expect(getPromptDirectives()).toContain('minimal');
  });

  it('adds creative directive', () => {
    useAutomationStore.getState().setCreativity('creative');
    expect(getPromptDirectives()).toContain('creative rewording');
  });

  it('adds no creativity directive for balanced (default)', () => {
    const d = getPromptDirectives();
    expect(d).not.toContain('minimal');
    expect(d).not.toContain('creative rewording');
  });
});

/* ── getSectionDirective ────────────────────────────────── */

describe('getSectionDirective', () => {
  it('returns empty string when all sections selected', () => {
    expect(getSectionDirective()).toBe('');
  });

  it('returns "do not modify" when no sections selected', () => {
    const s = useAutomationStore.getState();
    for (const sec of ALL_SECTIONS) s.toggleSection(sec);
    expect(getSectionDirective()).toContain('Do not modify');
  });

  it('lists specific sections when subset selected', () => {
    const s = useAutomationStore.getState();
    // Remove all, then add back just work and skills
    for (const sec of ALL_SECTIONS) s.toggleSection(sec);
    useAutomationStore.getState().toggleSection('work');
    useAutomationStore.getState().toggleSection('skills');

    const d = getSectionDirective();
    expect(d).toContain('work');
    expect(d).toContain('skills');
    expect(d).toContain('Only modify');
  });
});

/* ── getCoverLetterDirective ────────────────────────────── */

describe('getCoverLetterDirective', () => {
  it('returns ~250 words for standard', () => {
    expect(getCoverLetterDirective()).toContain('250');
  });

  it('returns ~150 words for brief', () => {
    useAutomationStore.getState().setCoverLetterLength('brief');
    expect(getCoverLetterDirective()).toContain('150');
  });

  it('returns ~400 words for detailed', () => {
    useAutomationStore.getState().setCoverLetterLength('detailed');
    expect(getCoverLetterDirective()).toContain('400');
  });
});

/* ── getAuditDirective ──────────────────────────────────── */

describe('getAuditDirective', () => {
  it('returns empty string for standard', () => {
    expect(getAuditDirective()).toBe('');
  });

  it('returns lenient directive', () => {
    useAutomationStore.getState().setAuditStrictness('lenient');
    expect(getAuditDirective()).toContain('lenient');
  });

  it('returns strict directive', () => {
    useAutomationStore.getState().setAuditStrictness('strict');
    expect(getAuditDirective()).toContain('strict');
  });
});
