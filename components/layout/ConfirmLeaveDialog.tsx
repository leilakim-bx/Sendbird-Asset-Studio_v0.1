"use client";

/**
 * Unsaved-changes guard shown when the user tries to leave the editor (logo →
 * home) with edits that haven't been saved to "My files". Autosave already
 * protects against refresh/crash; this catches the intentional-navigation path,
 * where re-creating the asset would otherwise start fresh and drop the work.
 */
export function ConfirmLeaveDialog({
  saving,
  onSaveAndLeave,
  onLeave,
  onCancel,
}: {
  saving: boolean;
  onSaveAndLeave: () => void;
  onLeave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4">
          <p className="text-studio-text font-semibold text-sm">
            You have unsaved changes
          </p>
          <p className="text-studio-muted text-xs mt-1.5 leading-relaxed">
            If you leave now, your work may be lost. Save before going home?
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-studio-border">
          <button
            onClick={onLeave}
            disabled={saving}
            className="text-xs px-3 py-2 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-50"
          >
            Leave without saving
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-xs px-3 py-2 rounded-lg border border-studio-border text-studio-text hover:bg-studio-hover transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSaveAndLeave}
            disabled={saving}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-studio-accent text-studio-accent-fg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save and leave"}
          </button>
        </div>
      </div>
    </div>
  );
}
