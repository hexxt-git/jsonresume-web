import type { SectionMap } from '../types';
import { findSectionByKeyword } from './lib/section-lookup';
import { extractBullets, findDescriptionStart } from './lib/bullets';

export function parseSkills(sections: SectionMap) {
  const lines = findSectionByKeyword(sections, ['skill']);
  const descStart = findDescriptionStart(lines) ?? 0;
  const descriptions = extractBullets(lines.slice(descStart));

  const skillGroups = descriptions.map((line) => {
    const colonMatch = line.match(/^([^:]+):\s*(.+)/);
    if (colonMatch) {
      return { name: colonMatch[1].trim(), keywords: splitKeywords(colonMatch[2]) };
    }

    const keywords = splitKeywords(line);
    return { name: 'General', keywords };
  });

  // Merge single-keyword General groups into previous group
  const merged = skillGroups.reduce<{ name: string; keywords: string[] }[]>((acc, group) => {
    if (group.name === 'General' && group.keywords.length === 1 && acc.length > 0) {
      acc[acc.length - 1].keywords.push(group.keywords[0]);
    } else {
      acc.push(group);
    }
    return acc;
  }, []);

  const featuredSkills =
    descStart > 0
      ? lines
          .slice(0, descStart)
          .flat()
          .filter((item) => item.text.trim())
          .slice(0, 6)
          .map((item) => ({ skill: item.text }))
      : [];

  return {
    skills: { featuredSkills, descriptions, skillGroups: merged },
  };
}

// ── Internals ───────────────────────────────────────────────────────

function splitKeywords(text: string): string[] {
  // Protect commas inside parentheses from splitting
  let depth = 0;
  const chars = [...text].map((ch) => {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    return depth > 0 && ch === ',' ? '\x00' : ch;
  });

  return chars
    .join('')
    .split(/[,;|]|\band\b/i)
    .map((k) => k.replace(/\x00/g, ',').replace(/\.+$/, '').trim())
    .filter(Boolean);
}
