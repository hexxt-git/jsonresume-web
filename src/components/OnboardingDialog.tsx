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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-bg rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screenshot for feature slides */}
        {!isWelcome && !isGetStarted && slideIndex >= 0 && slideIndex < featureSlides.length && (
          <div className="bg-bg-secondary">
            <img
              src={featureSlides[slideIndex].image}
              alt={t(featureSlides[slideIndex].title)}
              className="w-full h-56 object-cover object-top"
            />
          </div>
        )}

        <div className="p-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-accent' : i < step ? 'w-1.5 bg-accent/40' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>

          {/* ── Step: Welcome ── */}
          {isWelcome && (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">
                <span className="inline-block" style={{ filter: 'grayscale(1) brightness(1.5)' }}>
                  &#128196;
                </span>
              </div>
              <h2 className="text-xl font-bold text-text">{t('onboarding.welcomeTitle')}</h2>
              <p className="text-sm text-text-tertiary mt-3 max-w-xs mx-auto leading-relaxed">
                {t('onboarding.welcomeSub')}
              </p>
            </div>
          )}

          {/* ── Step: Feature slides ── */}
          {!isWelcome && !isGetStarted && slideIndex >= 0 && slideIndex < featureSlides.length && (
            <div className="text-center mb-2">
              <h2 className="text-base font-semibold text-text">
                {t(featureSlides[slideIndex].title)}
              </h2>
              <p className="text-sm text-text-tertiary mt-1">{t(featureSlides[slideIndex].sub)}</p>
            </div>
          )}

          {/* ── Step: Get started ── */}
          {isGetStarted && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text text-center">
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
                className={`border-2 border-dashed rounded-lg px-4 py-12 text-center cursor-pointer transition-colors ${
                  dragging
                    ? 'border-accent bg-bg-accent'
                    : 'border-border hover:border-text-muted hover:bg-bg-hover'
                }`}
              >
                {loading ? (
                  <p className="text-sm text-text-tertiary">{t('onboarding.parsing')}</p>
                ) : (
                  <>
                    <p className="text-xs text-text-secondary">{t('onboarding.importDrop')}</p>
                    <p className="text-[10px] text-text-muted mt-1">{t('empty.formats')}</p>
                  </>
                )}
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}

              {/* Or divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-text-muted uppercase">
                  {t('onboarding.importOr')}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setResume(sampleResume);
                    close();
                  }}
                  className="flex-1 text-xs py-2 border border-border rounded-md hover:bg-bg-hover cursor-pointer text-text-secondary"
                >
                  {t('onboarding.importSample')}
                </button>
                <button
                  onClick={close}
                  className="flex-1 text-xs py-2 bg-accent text-white rounded-md hover:opacity-90 cursor-pointer"
                >
                  {t('onboarding.importScratch')}
                </button>
              </div>
            </div>
          )}

          {/* ── Footer nav ── */}
          {!isGetStarted && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={close}
                className="text-xs text-text-muted hover:text-text-tertiary cursor-pointer"
              >
                {t('onboarding.skip')}
              </button>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="text-xs px-3 py-1.5 border border-border rounded-md hover:bg-bg-hover cursor-pointer text-text-secondary"
                  >
                    {t('onboarding.back')}
                  </button>
                )}
                <button
                  onClick={() => setStep(step + 1)}
                  className="text-xs px-4 py-1.5 bg-accent text-white rounded-md hover:opacity-90 cursor-pointer"
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
