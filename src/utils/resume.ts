import type { ResumeSchema } from '@/types/resume';

/**
 * Filter out items that have visible: false set.
 */
export function filterVisible(resume: ResumeSchema): ResumeSchema {
  const result = { ...resume };

  const sections: (keyof ResumeSchema)[] = [
    'work',
    'education',
    'skills',
    'projects',
    'volunteer',
    'awards',
    'certificates',
    'publications',
    'languages',
    'interests',
    'references',
  ];

  for (const s of sections) {
    const val = result[s];
    if (Array.isArray(val)) {
      (result as any)[s] = (val as any[]).filter((item) => item.visible !== false);
    }
  }

  if (result.basics?.profiles) {
    result.basics = {
      ...result.basics,
      profiles: result.basics.profiles.filter((p) => (p as any).visible !== false),
    };
  }

  return result;
}
