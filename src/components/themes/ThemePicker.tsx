import { useMemo } from 'react';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { themes } from '../../themes';

export function ThemePicker() {
  const selectedThemeId = useResumeStore((s) => activeSlot(s).themeId);
  const setTheme = useResumeStore((s) => s.setTheme);
  const resume = useResumeStore((s) => activeSlot(s).resume);

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
                ? 'ring-2 ring-accent shadow-md'
                : 'ring-1 ring-border hover:ring-border-input hover:shadow-sm'
            }`}
          >
            <div className="relative w-full h-36 overflow-hidden bg-white flex items-start justify-center">
              <iframe
                srcDoc={t.html}
                title={t.name}
                className="w-[900px] h-[700px] border-0 pointer-events-none shrink-0"
                style={{ transform: 'scale(0.22)', transformOrigin: 'top center' }}
                tabIndex={-1}
              />
            </div>
            <div
              className={`px-2.5 py-1.5 text-xs border-t ${
                selectedThemeId === t.id
                  ? 'bg-bg-accent text-accent-text font-semibold border-accent'
                  : 'bg-bg-secondary text-text border-border'
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
