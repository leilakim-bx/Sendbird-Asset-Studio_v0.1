"use client";

import { ArrowUp, Loader2 } from "lucide-react";

/**
 * The AI-Magic submit button shared by both editor sidebars (chat + infographic)
 * so the two composer boxes stay visually identical: a rounded-square lime
 * "enter" button (matching the primary Export action) that sits at the
 * bottom-right of the prompt box.
 */
export function AiMagicButton({
  loading,
  disabled,
  onClick,
  label,
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  /** Accessible label for the icon-only button. */
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-studio-accent text-studio-accent-fg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <ArrowUp size={14} strokeWidth={2.5} />}
    </button>
  );
}
