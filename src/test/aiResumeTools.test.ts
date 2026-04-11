import { describe, it, expect, beforeEach } from 'vitest';
import { useResumeStore, activeSlot } from '../store/resumeStore';
import {
  resumeToolDeclarations,
  executeResumeTool,
  getAtPath,
  setAtPath,
} from '../lib/ai/resume-tools';
import type { ToolCall } from '../lib/ai';

describe('resumeToolDeclarations', () => {
  it('exports tool declarations array', () => {
    expect(resumeToolDeclarations.length).toBeGreaterThan(0);
    for (const tool of resumeToolDeclarations) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeTruthy();
    }
  });

  it('has expected tool names', () => {
    const names = resumeToolDeclarations.map((t) => t.name);
    expect(names).toContain('update_summary');
    expect(names).toContain('update_basics_field');
    expect(names).toContain('replace_section');
    expect(names).toContain('add_section_entry');
  });
});

describe('getAtPath', () => {
  it('reads nested values', () => {
    const resume = { basics: { name: 'Alice', summary: 'Dev' }, skills: [{ name: 'JS' }] };
    expect(getAtPath(resume, ['basics', 'summary'])).toBe('Dev');
    expect(getAtPath(resume, ['basics', 'name'])).toBe('Alice');
    expect(getAtPath(resume, ['skills'])).toEqual([{ name: 'JS' }]);
  });

  it('returns undefined for missing paths', () => {
    expect(getAtPath({}, ['basics', 'summary'])).toBeUndefined();
    expect(getAtPath({ basics: {} }, ['basics', 'summary'])).toBeUndefined();
  });
});

describe('setAtPath', () => {
  beforeEach(() => {
    useResumeStore.getState().saveSlot('');
    useResumeStore.getState().reset();
  });

  it('sets basics fields', () => {
    setAtPath(['basics', 'summary'], 'new summary');
    expect(activeSlot(useResumeStore.getState()).resume.basics?.summary).toBe('new summary');
  });

  it('sets array sections', () => {
    setAtPath(['skills'], [{ name: 'React' }]);
    expect(activeSlot(useResumeStore.getState()).resume.skills).toEqual([{ name: 'React' }]);
  });
});

describe('executeResumeTool', () => {
  beforeEach(() => {
    useResumeStore.getState().saveSlot('');
    useResumeStore.getState().reset();
  });

  it('update_summary sets basics.summary and returns before value', () => {
    useResumeStore.getState().updateBasics('summary', 'Old summary');
    const call: ToolCall = {
      id: '1',
      name: 'update_summary',
      args: { summary: 'A talented engineer' },
    };
    const result = executeResumeTool(call);
    expect(result.success).toBe(true);
    expect(result.path).toEqual(['basics', 'summary']);
    expect(result.before).toBe('Old summary');
    expect(activeSlot(useResumeStore.getState()).resume.basics?.summary).toBe(
      'A talented engineer',
    );
  });

  it('update_basics_field updates name and captures before', () => {
    useResumeStore.getState().updateBasics('name', 'Old Name');
    const call: ToolCall = {
      id: '2',
      name: 'update_basics_field',
      args: { field: 'name', value: 'Jane Doe' },
    };
    const result = executeResumeTool(call);
    expect(result.success).toBe(true);
    expect(result.path).toEqual(['basics', 'name']);
    expect(result.before).toBe('Old Name');
    expect(activeSlot(useResumeStore.getState()).resume.basics?.name).toBe('Jane Doe');
  });

  it('replace_section replaces skills and captures before', () => {
    const oldSkills = [{ name: 'Old', keywords: ['x'] }];
    useResumeStore.getState().updateArraySection('skills', oldSkills);

    const newSkills = [
      { name: 'Frontend', keywords: ['React', 'TypeScript'] },
      { name: 'Backend', keywords: ['Node.js'] },
    ];
    const call: ToolCall = {
      id: '3',
      name: 'replace_section',
      args: { section: 'skills', data: newSkills },
    };
    const result = executeResumeTool(call);
    expect(result.success).toBe(true);
    expect(result.path).toEqual(['skills']);
    expect(result.before).toEqual(oldSkills);
    expect(activeSlot(useResumeStore.getState()).resume.skills).toEqual(newSkills);
  });

  it('add_section_entry appends and captures before', () => {
    const existing = [{ name: 'Frontend', keywords: ['React'] }];
    useResumeStore.getState().updateArraySection('skills', existing);

    const call: ToolCall = {
      id: '4',
      name: 'add_section_entry',
      args: { section: 'skills', entry: { name: 'Backend', keywords: ['Node.js'] } },
    };
    const result = executeResumeTool(call);
    expect(result.success).toBe(true);
    expect(result.path).toEqual(['skills']);
    expect(result.before).toEqual(existing);
    expect(activeSlot(useResumeStore.getState()).resume.skills).toHaveLength(2);
  });

  it('unknown tool returns failure with empty path', () => {
    const call: ToolCall = { id: '99', name: 'nonexistent', args: {} };
    const result = executeResumeTool(call);
    expect(result.success).toBe(false);
    expect(result.path).toEqual([]);
  });
});

describe('undo/redo via setAtPath', () => {
  beforeEach(() => {
    useResumeStore.getState().saveSlot('');
    useResumeStore.getState().reset();
  });

  it('can undo and redo a summary change', () => {
    useResumeStore.getState().updateBasics('summary', 'Original');
    const call: ToolCall = {
      id: '1',
      name: 'update_summary',
      args: { summary: 'Improved' },
    };
    const { path, before } = executeResumeTool(call);
    expect(activeSlot(useResumeStore.getState()).resume.basics?.summary).toBe('Improved');

    // Undo: capture current (after), restore before
    const after = getAtPath(activeSlot(useResumeStore.getState()).resume, path);
    setAtPath(path, before);
    expect(activeSlot(useResumeStore.getState()).resume.basics?.summary).toBe('Original');

    // Redo: restore after
    setAtPath(path, after);
    expect(activeSlot(useResumeStore.getState()).resume.basics?.summary).toBe('Improved');
  });
});
