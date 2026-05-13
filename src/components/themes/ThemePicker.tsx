import { useMemo } from 'react';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { themes } from '../../themes';
import { sampleResume } from '../../utils/sample';

export function ThemePicker() {
  const selectedThemeId = useResumeStore((s) => activeSlot(s).themeId);
  const setTheme = useResumeStore((s) => s.setTheme);
  const resume = useResumeStore((s) => activeSlot(s).resume);

  const isEmpty = !resume.basics?.name && !resume.work?.length;
  const previewResume = isEmpty ? sampleResume : resume;

  const previews = useMemo(
    () => themes.map((t) => ({ id: t.id, name: t.name, html: t.render(previewResume) })),
    [previewResume],
  );

  return (
    <div className="h-full overflow-y-auto pb-10">
      <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {previews.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`text-left rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border ${selectedThemeId === t.id ? 'border-accent' : 'border-border'}`}
          >
            <div className="relative w-full h-44 overflow-hidden bg-white flex items-start justify-center p-2">
              <iframe
                srcDoc={t.html}
                title={t.name}
                className="w-[900px] h-[700px] border-0 pointer-events-none shrink-0"
                style={{ transform: 'scale(0.24)', transformOrigin: 'top center' }}
                tabIndex={-1}
              />
              {selectedThemeId === t.id && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-[10px] shadow-lg">
                  &#10003;
                </div>
              )}
            </div>
            <div
              className={`px-4 py-3 text-[11px] font-bold text-center tracking-wide uppercase transition-colors ${
                selectedThemeId === t.id
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-secondary'
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
