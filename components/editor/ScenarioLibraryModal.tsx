"use client";

import { useEffect } from "react";
import { ScenarioList } from "./ScenarioList";

type Props = {
  activeId: string | null;
  /** Called with the chosen scenario id. Same handler as the sidebar list
   *  (may open the "Replace current messages?" confirm). */
  onSelect: (id: string) => void;
  onClose: () => void;
};

/** All-scenarios picker — mirrors BackgroundPickerModal. The sidebar shows a
 *  4-item preview; this modal exposes the full set. */
export function ScenarioLibraryModal({ activeId, onSelect, onClose }: Props) {
  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-[420px] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-studio-border shrink-0">
          <span className="text-sm font-semibold text-studio-text">Select Scenario</span>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-6 h-6 flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Full scenario list */}
        <div className="overflow-y-auto p-5">
          <ScenarioList
            activeId={activeId}
            onPick={(id) => { onSelect(id); onClose(); }}
          />
        </div>
      </div>
    </div>
  );
}
