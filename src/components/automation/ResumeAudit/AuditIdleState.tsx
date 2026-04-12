export function AuditIdleState({ onStart }: { onStart: () => void }) {
  return (
    <div className="py-8 space-y-3 text-center">
      <p className="text-xs text-text-secondary">
        Scan for ATS issues, weak verbs, missing keywords, and more.
      </p>
      <button
        onClick={onStart}
        className="text-xs px-6 py-2 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer"
      >
        Run Audit
      </button>
    </div>
  );
}
