import { describe, it, expect } from 'vitest';
import YAML from 'yaml';
import { sampleResume } from '../utils/sample';
import type { ResumeSchema } from '../types/resume';

describe('YAML support', () => {
  it('round-trips resume through YAML stringify/parse', () => {
    const yamlStr = YAML.stringify(sampleResume);
    const parsed = YAML.parse(yamlStr) as ResumeSchema;
    expect(parsed.basics?.name).toBe('Salah Zeghdani');
    expect(parsed.work).toHaveLength(3);
    expect(parsed.skills?.[0].keywords).toContain('React.js');
  });

  it('parses YAML file content correctly', () => {
    const yamlStr = YAML.stringify(sampleResume);
    const parsed = YAML.parse(yamlStr) as ResumeSchema;
    expect(parsed.basics?.name).toBe('Salah Zeghdani');
    expect(parsed.work).toHaveLength(3);
  });

  it('handles minimal YAML', () => {
    const yamlStr = YAML.stringify({ basics: { name: 'Test', label: 'Dev' } });
    const parsed = YAML.parse(yamlStr) as ResumeSchema;
    expect(parsed.basics?.name).toBe('Test');
    expect(parsed.basics?.label).toBe('Dev');
  });

  it('preserves all schema fields through YAML', () => {
    const yamlStr = YAML.stringify(sampleResume);
    const parsed = YAML.parse(yamlStr) as ResumeSchema;
    expect(parsed.basics?.email).toBe(sampleResume.basics?.email);
    expect(parsed.basics?.phone).toBe(sampleResume.basics?.phone);
    expect(parsed.basics?.location?.city).toBe(sampleResume.basics?.location?.city);
    expect(parsed.education).toHaveLength(2);
    expect(parsed.projects).toHaveLength(4);
    expect(parsed.languages).toHaveLength(3);
  });

  it('YAML output is human-readable', () => {
    const yamlStr = YAML.stringify(sampleResume);
    expect(yamlStr).toContain('name: Salah Zeghdani');
    expect(yamlStr).toContain('label: Web Developer');
    expect(yamlStr).not.toContain('{');
  });
});
