import type { ThemeDefinition } from './types';
import { modernTheme } from './modern';
import { classicTheme } from './classic';
import { compactTheme } from './compact';
import { professionalTheme } from './professional';
import { creativeTheme } from './creative';
import { academicTheme } from './academic';
import { darkTheme } from './dark';
import { sidebarTheme } from './sidebar';
import { timelineTheme } from './timeline';
import { minimalTheme } from './minimal';

export const themes: ThemeDefinition[] = [
  modernTheme,
  classicTheme,
  compactTheme,
  professionalTheme,
  creativeTheme,
  academicTheme,
  darkTheme,
  sidebarTheme,
  timelineTheme,
  minimalTheme,
];

export function getThemeById(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) || themes[0];
}
