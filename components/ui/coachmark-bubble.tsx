"use client";

import { X } from "lucide-react";

/**
 * First-run coachmark speech bubble. Sits ABOVE the section it nudges toward,
 * with a downward-pointing tail aimed at that section's label. Render it as a
 * child of the target section's wrapper, which must be `position: relative` —
 * the bubble anchors to that wrapper's top edge and so scrolls WITH the section
 * instead of floating at a fixed panel offset.
 *
 * Dismisses on ✕ or — wired by the caller — when the user performs the action.
 */
const BUBBLE_BG = "var(--app-coachmark-bg)";
const BUBBLE_FG = "var(--app-coachmark-fg)";

export function CoachmarkBubble({
  text,
  onDismiss,
}: {
  text: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className="absolute z-30"
      style={{ top: 0, left: 18, transform: "translateY(calc(-100% + 2px))" }}
    >
      <style>{`
        @keyframes coachmark-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        .coachmark-floating { animation: coachmark-float 2.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .coachmark-floating { animation: none; }
        }
      `}</style>
      <div
        className="coachmark-floating relative flex w-max max-w-[220px] items-start gap-2 rounded-[18px] py-2.5 pl-3.5 pr-2 shadow-xl"
        style={{ background: BUBBLE_BG }}
      >
        <span
          className="flex-1 text-xs font-semibold leading-snug"
          style={{ color: BUBBLE_FG }}
        >
          {text}
        </span>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mt-0.5 shrink-0 rounded-md p-0.5 transition-colors hover:bg-black/10"
          style={{ color: BUBBLE_FG }}
        >
          <X size={13} />
        </button>
        {/* Tail pointing down, toward the section label below. */}
        <div
          className="absolute -bottom-1 left-5 h-2.5 w-2.5 rotate-45"
          style={{ background: BUBBLE_BG }}
        />
      </div>
    </div>
  );
}
