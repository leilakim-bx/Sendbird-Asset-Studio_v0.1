"use client";

import { X } from "lucide-react";

/**
 * First-run coachmark speech bubble. Floats out of the sidebar's left edge
 * (over the canvas) with a right-pointing tail aimed at the section it nudges
 * toward. The parent positions it vertically via `top` (px, relative to the
 * sidebar panel) and must render it inside a `position: relative` panel that is
 * NOT inside an `overflow` container, so it can overhang.
 *
 * Dismisses on ✕ or — wired by the caller — when the user performs the action.
 */
export function CoachmarkBubble({
  text,
  onDismiss,
  top,
}: {
  text: string;
  onDismiss: () => void;
  top: number;
}) {
  return (
    <div className="absolute z-30" style={{ top, right: "100%", marginRight: 8 }}>
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
      <div className="coachmark-floating relative flex w-max max-w-[200px] items-start gap-2 rounded-xl bg-studio-accent py-2.5 pl-3 pr-2 shadow-xl">
        <span className="flex-1 text-xs font-semibold leading-snug text-studio-accent-fg">
          {text}
        </span>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mt-0.5 shrink-0 rounded-md p-0.5 text-studio-accent-fg/60 hover:bg-black/10 hover:text-studio-accent-fg transition-colors"
        >
          <X size={13} />
        </button>
        {/* Tail pointing right, toward the section in the sidebar. */}
        <div className="absolute top-3.5 -right-1 h-2.5 w-2.5 rotate-45 bg-studio-accent" />
      </div>
    </div>
  );
}
