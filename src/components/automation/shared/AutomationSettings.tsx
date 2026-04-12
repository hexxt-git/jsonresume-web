import * as Popover from '@radix-ui/react-popover';
import { Setting2 } from 'iconsax-react';
import {
  useAutomationStore,
  ALL_SECTIONS,
  SECTION_DISPLAY,
  type Tone,
  type Creativity,
  type CoverLetterLength,
  type AuditStrictness,
} from '../../../store/automationStore';

/* ── Pill group ───────────────────────────────────────────── */

function Pills<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`text-[10px] px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
            value === o.value
              ? 'bg-accent text-white'
              : 'border border-border text-text-muted hover:text-text-secondary hover:border-accent/30'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

/* ── Shared settings panel ────────────────────────────────── */

function SettingsPanel() {
  const {
    tone,
    setTone,
    creativity,
    setCreativity,
    language,
    setLanguage,
    coverLetterLength,
    setCoverLetterLength,
    sectionsToTailor,
    toggleSection,
    auditStrictness,
    setAuditStrictness,
    reset,
  } = useAutomationStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text">Settings</span>
        <button
          type="button"
          onClick={reset}
          className="text-[10px] text-text-muted hover:text-accent cursor-pointer"
        >
          Reset
        </button>
      </div>

      <SectionLabel label="Tone">
        <Pills<Tone>
          value={tone}
          options={[
            { value: 'formal', label: 'Formal' },
            { value: 'professional', label: 'Professional' },
            { value: 'casual', label: 'Casual' },
          ]}
          onChange={setTone}
        />
      </SectionLabel>

      <SectionLabel label="Creativity">
        <Pills<Creativity>
          value={creativity}
          options={[
            { value: 'conservative', label: 'Conservative' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'creative', label: 'Creative' },
          ]}
          onChange={setCreativity}
        />
      </SectionLabel>

      <SectionLabel label="Output Language">
        <input
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-2 py-1 text-[10px] border border-border-input bg-bg-input text-text rounded focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="English"
        />
      </SectionLabel>

      <SectionLabel label="Cover Letter Length">
        <Pills<CoverLetterLength>
          value={coverLetterLength}
          options={[
            { value: 'brief', label: 'Brief' },
            { value: 'standard', label: 'Standard' },
            { value: 'detailed', label: 'Detailed' },
          ]}
          onChange={setCoverLetterLength}
        />
      </SectionLabel>

      <SectionLabel label="Audit Strictness">
        <Pills<AuditStrictness>
          value={auditStrictness}
          options={[
            { value: 'lenient', label: 'Lenient' },
            { value: 'standard', label: 'Standard' },
            { value: 'strict', label: 'Strict' },
          ]}
          onChange={setAuditStrictness}
        />
      </SectionLabel>

      <SectionLabel label="Sections to Tailor">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {ALL_SECTIONS.map((s) => (
            <label
              key={s}
              className="flex items-center gap-1.5 text-[10px] text-text-secondary cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={sectionsToTailor.includes(s)}
                onChange={() => toggleSection(s)}
                className="rounded border-border-input accent-accent w-3 h-3"
              />
              {SECTION_DISPLAY[s] || s}
            </label>
          ))}
        </div>
      </SectionLabel>
    </div>
  );
}

/* ── Header icon (small, in tool header) ──────────────────── */

export function AutomationSettings() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="p-1 text-text-muted hover:text-text-secondary cursor-pointer transition-colors rounded hover:bg-bg-hover"
          title="Settings"
        >
          <Setting2 size={16} variant="Bold" color="currentColor" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="w-72 max-h-[70vh] overflow-y-auto bg-bg border border-border rounded-lg shadow-xl z-50 p-3"
          sideOffset={6}
          align="end"
        >
          <SettingsPanel />
          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ── Footer button (visible, next to main action) ─────────── */

export function SettingsFooterButton() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-2.5 text-[10px] border border-border rounded-lg text-text-muted hover:text-text-secondary hover:border-accent/30 cursor-pointer transition-colors shrink-0"
        >
          <Setting2 size={14} variant="Bold" color="currentColor" />
          Settings
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="w-72 max-h-[60vh] overflow-y-auto bg-bg border border-border rounded-lg shadow-xl z-50 p-3"
          sideOffset={8}
          align="end"
          side="top"
        >
          <SettingsPanel />
          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
