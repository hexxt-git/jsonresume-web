import { useMemo } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { themes } from '../../themes';

export function ThemePicker() {
  const selectedThemeId = useResumeStore((s) => s.selectedThemeId);
  const setTheme = useResumeStore((s) => s.setTheme);
  const resume = useResumeStore((s) => s.resume);

  const previews = useMemo(
    () => themes.map((t) => ({ id: t.id, name: t.name, html: t.render(resume) })),
    [resume],
  );

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {previews.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`text-left rounded-md overflow-hidden cursor-pointer transition-shadow ${
              selectedThemeId === t.id
                ? 'ring-2 ring-blue-500 shadow-md'
                : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="relative w-full h-36 overflow-hidden bg-white flex items-start justify-center">
              <iframe
                srcDoc={t.html}
                title={t.name}
                className="w-[800px] h-[1000px] border-0 pointer-events-none shrink-0"
                style={{ transform: 'scale(0.22)', transformOrigin: 'top center' }}
                tabIndex={-1}
              />
            </div>
            <div
              className={`px-2.5 py-1.5 text-xs border-t ${
                selectedThemeId === t.id
                  ? 'bg-blue-50 text-blue-600 font-semibold border-blue-100'
                  : 'bg-gray-50 text-gray-700 border-gray-100'
              }`}
            >
              {t.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
