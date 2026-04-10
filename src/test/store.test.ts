import { describe, it, expect, beforeEach } from 'vitest';
import { useResumeStore } from '../store/resumeStore';

describe('resumeStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useResumeStore.getState().reset();
  });

  it('starts with empty resume', () => {
    const { resume } = useResumeStore.getState();
    expect(resume.basics?.name).toBe('');
  });

  it('loads sample resume', () => {
    useResumeStore.getState().loadSample();
    const { resume } = useResumeStore.getState();
    expect(resume.basics?.name).toBe('Salah Zeghdani');
    expect(resume.work).toHaveLength(3);
  });

  it('setResume replaces entire resume', () => {
    useResumeStore.getState().setResume({ basics: { name: 'Jane Doe' } });
    expect(useResumeStore.getState().resume.basics?.name).toBe('Jane Doe');
  });

  it('updateBasics updates a single field', () => {
    useResumeStore.getState().updateBasics('name', 'John');
    expect(useResumeStore.getState().resume.basics?.name).toBe('John');
  });

  it('updateBasics preserves other fields', () => {
    useResumeStore.getState().updateBasics('name', 'John');
    useResumeStore.getState().updateBasics('email', 'john@test.com');
    const { basics } = useResumeStore.getState().resume;
    expect(basics?.name).toBe('John');
    expect(basics?.email).toBe('john@test.com');
  });

  it('updateBasicsLocation updates nested location', () => {
    useResumeStore.getState().updateBasicsLocation('city', 'Paris');
    expect(useResumeStore.getState().resume.basics?.location?.city).toBe('Paris');
  });

  it('updateArraySection replaces array section', () => {
    const work = [{ name: 'Acme', position: 'Dev' }];
    useResumeStore.getState().updateArraySection('work', work);
    expect(useResumeStore.getState().resume.work).toEqual(work);
  });

  it('setTheme changes selected theme', () => {
    useResumeStore.getState().setTheme('dark');
    expect(useResumeStore.getState().selectedThemeId).toBe('dark');
  });

  it('setActiveSection changes active editor section', () => {
    useResumeStore.getState().setActiveSection('skills');
    expect(useResumeStore.getState().activeSection).toBe('skills');
  });

  it('reset clears resume and resets theme', () => {
    useResumeStore.getState().loadSample();
    useResumeStore.getState().setTheme('dark');
    useResumeStore.getState().reset();
    expect(useResumeStore.getState().resume.basics?.name).toBe('');
    expect(useResumeStore.getState().selectedThemeId).toBe('modern');
  });
});
