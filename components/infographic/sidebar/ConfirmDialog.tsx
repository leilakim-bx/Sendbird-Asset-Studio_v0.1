"use client";

import { useEffect } from "react";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Small studio-styled confirm dialog (mirrors PresetLibraryModal's overlay).
 *  ESC / backdrop / Cancel dismiss; Confirm runs the action. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-[340px] shadow-2xl p-5">
        <p className="text-sm font-semibold text-studio-text">{title}</p>
        <p className="mt-2 text-xs text-studio-muted leading-relaxed">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-studio-muted hover:text-studio-text hover:bg-white/[0.06] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-studio-accent text-black hover:opacity-90 transition-opacity"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
