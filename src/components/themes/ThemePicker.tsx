import { useMemo } from 'react';
import { useResumeStore, activeSlot } from '@/store/resumeStore';
import { themes } from '@/themes';
import { sampleResume } from '@/utils/sample';
import { ScrollArea } from '../ui/ScrollArea';

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
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid grid-cols-1 gap-6 pb-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {previews.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`animate-in scale-in cursor-pointer overflow-hidden rounded-3xl border text-left transition-all duration-150 ${selectedThemeId === t.id ? 'border-accent' : ''}`}
          >
            <div className="relative flex h-44 w-full items-start justify-center overflow-hidden bg-white p-2">
              <iframe
                srcDoc={t.html}
                title={t.name}
                className="pointer-events-none h-[700px] w-[900px] shrink-0 border-0"
                style={{ transform: 'scale(0.24)', transformOrigin: 'top center' }}
                tabIndex={-1}
              />
              {selectedThemeId === t.id && (
                <div className="bg-accent absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full text-[10px] text-white shadow">
                  &#10003;
                </div>
              )}
            </div>
            <div
              className={`px-4 py-3 text-center text-[11px] font-bold tracking-wide uppercase transition-colors ${
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
    </ScrollArea>
  );
}
