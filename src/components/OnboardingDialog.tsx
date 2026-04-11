import { useState, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useResumeStore } from '../store/resumeStore';
import { parseResumeFile } from '../parser';
import { sampleResume } from '../utils/sample';

const slides = [
  {
    title: 'Edit & Preview',
    subtitle: 'Form editor on the left, live preview on the right.',
    image: '/onboarding/app-editor.jpg',
  },
  {
    title: '12+ Themes',
    subtitle: 'One click to switch styles. Customize colors, fonts & spacing.',
    image: '/onboarding/app-styles.jpg',
  },
  {
    title: 'AI Assistant',
    subtitle: 'Let AI improve your wording, generate highlights, or tailor for a job.',
    image: '/onboarding/app-ai.jpg',
  },
];

const TOTAL_STEPS = slides.length + 1; // slides + upload step

export function OnboardingDialog() {
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const dismiss = useSettingsStore((s) => s.setHasSeenOnboarding);
  const setResume = useResumeStore((s) => s.setResume);

  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (hasSeenOnboarding) return null;

  const isUploadStep = step === slides.length;
  const close = () => dismiss(true);

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
        {/* Screenshot area */}
        {!isUploadStep && (
          <div className="bg-bg-secondary">
            <img
              src={slides[step].image}
              alt={slides[step].title}
              className="w-full h-56 object-cover object-top"
            />
          </div>
        )}

        <div className="p-5">
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-accent' : i < step ? 'w-1.5 bg-accent/40' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>

          {!isUploadStep ? (
            <div className="text-center mb-4">
              <h2 className="text-base font-semibold text-text">{slides[step].title}</h2>
              <p className="text-sm text-text-tertiary mt-1">{slides[step].subtitle}</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-3">
                <h2 className="text-base font-semibold text-text">Import Your Resume</h2>
                <p className="text-sm text-text-tertiary mt-1">Or skip to start from scratch.</p>
              </div>

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
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-3 ${
                  dragging
                    ? 'border-accent bg-bg-accent'
                    : 'border-border hover:border-text-muted hover:bg-bg-hover'
                }`}
              >
                {loading ? (
                  <p className="text-sm text-text-tertiary">Parsing...</p>
                ) : (
                  <>
                    <div className="text-2xl text-text-faint mb-1">+</div>
                    <p className="text-sm text-text-secondary">Drop file here or click to browse</p>
                    <p className="text-xs text-text-muted mt-1">PDF, DOCX, JSON, YAML</p>
                  </>
                )}
              </div>
              {error && <p className="text-sm text-danger mb-2">{error}</p>}

              <button
                onClick={() => {
                  setResume(sampleResume);
                  close();
                }}
                className="w-full text-xs py-1.5 text-text-tertiary hover:text-accent-text cursor-pointer mb-8"
              >
                Or load a sample resume
              </button>
            </>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <button
              onClick={close}
              className="text-xs text-text-muted hover:text-text-tertiary cursor-pointer"
            >
              Skip
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="text-xs px-3 py-1.5 border border-border rounded-md hover:bg-bg-hover cursor-pointer text-text-secondary"
                >
                  Back
                </button>
              )}
              {!isUploadStep && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="text-xs px-4 py-1.5 bg-accent text-white rounded-md hover:opacity-90 cursor-pointer"
                >
                  {step === slides.length - 1 ? 'Get Started' : 'Next'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
