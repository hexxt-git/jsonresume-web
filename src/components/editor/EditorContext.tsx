import { useSettingsStore } from '../../store/settingsStore';

/** Navigate to AI tab from anywhere in the editor tree. */
export function useGoToAi() {
  const setTab = useSettingsStore((s) => s.setEditorTab);
  return () => setTab('ai');
}
