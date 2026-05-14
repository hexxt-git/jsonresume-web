import { useState, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useResumeStore } from '@/store/resumeStore';
import { parseResumeFile } from '@/parser';
import { sampleResume } from '@/utils/sample';
import { useT } from '@/i18n';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

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
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

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
    <Dialog open={!hasSeenOnboarding} onClose={close}>
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
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === step ? 'bg-accent w-8' : i < step ? 'bg-accent/40 w-2' : 'bg-border w-2',
              )}
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
              className={cn(
                'cursor-pointer rounded-2xl border-2 border-dashed px-5 py-12 text-center transition-all',
                dragging
                  ? 'border-accent bg-bg-accent shadow-lg'
                  : 'hover:border-accent hover:bg-bg-hover shadow-sm',
              )}
            >
              {loading ? (
                <p className="text-text-tertiary text-sm font-medium">{t('onboarding.parsing')}</p>
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
              <Badge variant="danger" className="w-full justify-center py-2 text-center">
                {error}
              </Badge>
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
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => {
                  setResume(sampleResume);
                  close();
                }}
              >
                {t('onboarding.importSample')}
              </Button>
              <Button size="md" fullWidth onClick={close}>
                {t('onboarding.importScratch')}
              </Button>
            </div>
          </div>
        )}

        {/* ── Footer nav ── */}
        {!isGetStarted && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="xs"
              onClick={close}
              className="px-0 py-0 font-bold hover:bg-transparent"
            >
              {t('onboarding.skip')}
            </Button>
            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                  {t('onboarding.back')}
                </Button>
              )}
              <Button size="sm" onClick={() => setStep(step + 1)}>
                {t('onboarding.next')}
              </Button>
            </div>
          </div>
        )}

        {/* Back button on get-started page */}
        {isGetStarted && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setStep(step - 1)}
              className="px-0 py-0 hover:bg-transparent"
            >
              &larr; {t('onboarding.back')}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
