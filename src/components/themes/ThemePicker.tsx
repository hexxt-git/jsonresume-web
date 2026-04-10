import { useResumeStore } from '../../store/resumeStore';
import { themes } from '../../themes';

export function ThemePicker() {
  const selectedThemeId = useResumeStore((s) => s.selectedThemeId);
  const setTheme = useResumeStore((s) => s.setTheme);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 p-3">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => setTheme(theme.id)}
          className={`text-left p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
            selectedThemeId === theme.id
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-sm font-semibold text-gray-800">{theme.name}</div>
          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{theme.description}</div>
        </button>
      ))}
    </div>
  );
}
