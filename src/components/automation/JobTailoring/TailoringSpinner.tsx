export function TailoringSpinner({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
      <p className="text-xs text-text-muted">Generating tailored changes...</p>
      <button
        onClick={onCancel}
        className="text-[10px] text-text-muted hover:text-danger cursor-pointer mt-1"
      >
        Cancel
      </button>
    </div>
  );
}
