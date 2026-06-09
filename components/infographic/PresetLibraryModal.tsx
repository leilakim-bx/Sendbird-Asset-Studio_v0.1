"use client";

import { useEffect } from "react";
import { PresetList } from "./sidebar/PresetList";

type Props = {
  activeId: string;
  /** Called with the chosen preset id (same handler as the sidebar list). */
  onSelect: (id: string) => void;
  onClose: () => void;
};

/** All-presets picker — mirrors the chat ScenarioLibraryModal. The sidebar shows
 *  a 4-item preview; this modal exposes the full set. */
export function PresetLibraryModal({ activeId, onSelect, onClose }: Props) {
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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl w-[420px] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-studio-border shrink-0">
          <span className="text-sm font-semibold text-studio-text">All presets</span>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-6 h-6 flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Full preset list */}
        <div className="overflow-y-auto p-5">
          <PresetList
            activeId={activeId}
            large
            onPick={(id) => {
              onSelect(id);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
