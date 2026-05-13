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
        className="bg-bg rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screenshot for feature slides */}
        {!isWelcome && !isGetStarted && slideIndex >= 0 && slideIndex < featureSlides.length && (
          <div className="bg-bg-secondary relative h-64">
            <img
              src={featureSlides[slideIndex].image}
              alt={t(featureSlides[slideIndex].title)}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg/10" />
          </div>
        )}

        <div className="p-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-accent' : i < step ? 'w-2 bg-accent/40' : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>

          {/* ── Step: Welcome ── */}
          {isWelcome && (
            <div className="text-center py-10 space-y-5">
              <div className="text-6xl mb-4">
                <span className="inline-block" style={{ filter: 'grayscale(0.5) brightness(1.2)' }}>
                  &#128196;
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text tracking-tight">
                  {t('onboarding.welcomeTitle')}
                </h2>
                <p className="text-base text-text-tertiary mt-4 max-w-xs mx-auto leading-relaxed font-medium">
                  {t('onboarding.welcomeSub')}
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Feature slides ── */}
          {!isWelcome && !isGetStarted && slideIndex >= 0 && slideIndex < featureSlides.length && (
            <div className="text-center mb-4 space-y-2">
              <h2 className="text-lg font-bold text-text tracking-tight">
                {t(featureSlides[slideIndex].title)}
              </h2>
              <p className="text-sm text-text-tertiary leading-relaxed px-4">
                {t(featureSlides[slideIndex].sub)}
              </p>
            </div>
          )}

          {/* ── Step: Get started ── */}
          {isGetStarted && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-text text-center tracking-tight">
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
                className={`border-2 border-dashed rounded-2xl px-5 py-12 text-center cursor-pointer transition-all ${
                  dragging
                    ? 'border-accent bg-bg-accent shadow-lg'
                    : 'border-border hover:border-accent hover:bg-bg-hover shadow-sm'
                }`}
              >
                {loading ? (
                  <p className="text-sm font-medium text-text-tertiary">
                    {t('onboarding.parsing')}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text-secondary">
                      {t('onboarding.importDrop')}
                    </p>
                    <p className="text-xs text-text-muted mt-2">{t('empty.formats')}</p>
                  </>
                )}
              </div>
              {error && (
                <p className="text-xs text-danger text-center bg-danger/10 py-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* Or divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  {t('onboarding.importOr')}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setResume(sampleResume);
                    close();
                  }}
                  className="flex-1 text-xs py-3 border border-border rounded-full hover:bg-bg-hover cursor-pointer text-text-secondary font-bold transition-all shadow-sm"
                >
                  {t('onboarding.importSample')}
                </button>
                <button
                  onClick={close}
                  className="flex-1 text-xs py-3 bg-accent text-white rounded-full hover:opacity-90 cursor-pointer font-bold transition-all shadow-md"
                >
                  {t('onboarding.importScratch')}
                </button>
              </div>
            </div>
          )}

          {/* ── Footer nav ── */}
          {!isGetStarted && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={close}
                className="text-xs font-bold text-text-muted hover:text-text-tertiary cursor-pointer transition-colors"
              >
                {t('onboarding.skip')}
              </button>
              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="text-xs px-4 py-2 border border-border rounded-full hover:bg-bg-hover cursor-pointer text-text-secondary font-bold transition-all shadow-sm"
                  >
                    {t('onboarding.back')}
                  </button>
                )}
                <button
                  onClick={() => setStep(step + 1)}
                  className="text-xs px-5 py-2 bg-accent text-white rounded-full hover:opacity-90 cursor-pointer font-bold transition-all shadow-md"
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
                className="text-xs text-text-muted hover:text-text-tertiary cursor-pointer"
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
