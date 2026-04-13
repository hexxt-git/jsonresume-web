import type { SectionMap, Lines } from '../../types';

export function findSectionByKeyword(sections: SectionMap, keywords: string[]): Lines {
  const match = Object.entries(sections).find(([name]) =>
    keywords.some((kw) => name.toLowerCase().includes(kw)),
  );
  return match?.[1] ?? [];
}
