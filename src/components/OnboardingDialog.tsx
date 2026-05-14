import { useState, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useResumeStore } from '../store/resumeStore';
import { parseResumeFile } from '../parser';
import { sampleResume } from '../utils/sample';
import { useT } from '../i18n';

const featureSlides = [
  { title: 'onboarding.editTitle', sub: 'onboarding.editSub', image: '/onboarding/app-editor.jpg' },
  {
    title: 'onboarding.themesTitle',
    sub: 'onboarding.themesSub',
    image: '/onboarding/app-styles.jpg',
  },
  { title: 'onboarding.aiTitle', sub: 'onboarding.aiSub', image: '/onboarding/app-ai.jpg' },
] as const;

// welcome (0) → feature slides (1..3) → get started (4)
const TOTAL = 1 + featureSlides.length + 1;

export function OnboardingDialog() {
  const t = useT();
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const dismiss = useSettingsStore((s) => s.setHasSeenOnboarding);
  const setResume = useResumeStore((s) => s.setResume);

  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (hasSeenOnboarding) return null;

  const close = () => dismiss(true);
  const isWelcome = step === 0;
  const isGetStarted = step === TOTAL - 1;
  const slideIndex = step - 1; // -1 for welcome, 0..2 for feature slides

  const handleFile = async (file: File) => {
    setError('');
    setLoading(true);
    try {
      const resume = await parseResumeFile(file);
      setResume(resume);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="bg-bg mx-4 w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screenshot for feature slides */}
        {!isWelcome && !isGetStarted && slideIndex >= 0 && slideIndex < featureSlides.length && (
          <div className="bg-bg-secondary relative h-64">
            <img
              src={featureSlides[slideIndex].image}
              alt={t(featureSlides[slideIndex].title)}
              className="h-full w-full object-cover object-top"
            />
            <div className="to-bg/10 absolute inset-0 bg-gradient-to-b from-transparent" />
          </div>
        )}

        <div className="p-6">
          {/* Progress dots */}
          <div className="mb-6 flex justify-center gap-2">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-accent w-8' : i < step ? 'bg-accent/40 w-2' : 'bg-border w-2'
                }`}
              />
            ))}
          </div>

          {/* ── Step: Welcome ── */}
          {isWelcome && (
            <div className="space-y-5 py-10 text-center">
              <div className="mb-4 text-6xl">
                <span className="inline-block" style={{ filter: 'grayscale(0.5) brightness(1.2)' }}>
                  &#128196;
                </span>
              </div>
              <div>
                <h2 className="text-text text-2xl font-bold tracking-tight">
                  {t('onboarding.welcomeTitle')}
                </h2>
                <p className="text-text-tertiary mx-auto mt-4 max-w-xs text-base leading-relaxed font-medium">
                  {t('onboarding.welcomeSub')}
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Feature slides ── */}
          {!isWelcome && !isGetStarted && slideIndex >= 0 && slideIndex < featureSlides.length && (
            <div className="mb-4 space-y-2 text-center">
              <h2 className="text-text text-lg font-bold tracking-tight">
                {t(featureSlides[slideIndex].title)}
              </h2>
              <p className="text-text-tertiary px-4 text-sm leading-relaxed">
                {t(featureSlides[slideIndex].sub)}
              </p>
            </div>
          )}

          {/* ── Step: Get started ── */}
          {isGetStarted && (
            <div className="space-y-6">
              <h2 className="text-text text-center text-lg font-bold tracking-tight">
                {t('onboarding.importTitle')}
              </h2>

              {/* Drop zone */}
              <input
                ref={fileRef}
                type="file"
                accept=".json,.yaml,.yml,.pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed px-5 py-12 text-center transition-all ${
                  dragging
                    ? 'border-accent bg-bg-accent shadow-lg'
                    : 'hover:border-accent hover:bg-bg-hover shadow-sm'
                }`}
              >
                {loading ? (
                  <p className="text-text-tertiary text-sm font-medium">
                    {t('onboarding.parsing')}
                  </p>
                ) : (
                  <>
                    <p className="text-text-secondary text-sm font-semibold">
                      {t('onboarding.importDrop')}
                    </p>
                    <p className="text-text-muted mt-2 text-xs">{t('empty.formats')}</p>
                  </>
                )}
              </div>
              {error && (
                <p className="text-danger bg-danger/10 rounded-lg py-2 text-center text-xs">
                  {error}
                </p>
              )}

              {/* Or divider */}
              <div className="flex items-center gap-4">
                <div className="bg-border h-px flex-1" />
                <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                  {t('onboarding.importOr')}
                </span>
                <div className="bg-border h-px flex-1" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setResume(sampleResume);
                    close();
                  }}
                  className="hover:bg-bg-hover text-text-secondary flex-1 cursor-pointer rounded-full border py-3 text-xs font-bold shadow-sm transition-all"
                >
                  {t('onboarding.importSample')}
                </button>
                <button
                  onClick={close}
                  className="bg-accent flex-1 cursor-pointer rounded-full py-3 text-xs font-bold text-white shadow-md transition-all hover:opacity-90"
                >
                  {t('onboarding.importScratch')}
                </button>
              </div>
            </div>
          )}

          {/* ── Footer nav ── */}
          {!isGetStarted && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={close}
                className="text-text-muted hover:text-text-tertiary cursor-pointer text-xs font-bold transition-colors"
              >
                {t('onboarding.skip')}
              </button>
              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="hover:bg-bg-hover text-text-secondary cursor-pointer rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition-all"
                  >
                    {t('onboarding.back')}
                  </button>
                )}
                <button
                  onClick={() => setStep(step + 1)}
                  className="bg-accent cursor-pointer rounded-full px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-90"
                >
                  {t('onboarding.next')}
                </button>
              </div>
            </div>
          )}

          {/* Back button on get-started page */}
          {isGetStarted && (
            <div className="mt-4">
              <button
                onClick={() => setStep(step - 1)}
                className="text-text-muted hover:text-text-tertiary cursor-pointer text-xs"
              >
                &larr; {t('onboarding.back')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
