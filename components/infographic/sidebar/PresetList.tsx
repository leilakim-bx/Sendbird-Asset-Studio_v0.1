"use client";

import { INFOGRAPHIC_PRESETS, PRESET_META } from "@/lib/infographic-presets";

/**
 * Infographic preset list. Mirrors the chat ScenarioList: pass `limit` to show
 * only the first N inline (sidebar preview); omit it to show all (modal). When
 * limited, the active preset is always kept visible — if it falls outside the
 * window it takes the last slot so the top items stay stable.
 */
export function PresetList({
  activeId,
  onPick,
  limit,
  large,
}: {
  activeId: string;
  onPick: (id: string) => void;
  limit?: number;
  /** Bigger thumbnails + roomier rows (used in the all-presets modal). */
  large?: boolean;
}) {
  const items = (() => {
    if (!limit) return INFOGRAPHIC_PRESETS;
    const head = INFOGRAPHIC_PRESETS.slice(0, limit);
    if (head.some((p) => p.id === activeId)) return head;
    const active = INFOGRAPHIC_PRESETS.find((p) => p.id === activeId);
    return active ? [...INFOGRAPHIC_PRESETS.slice(0, limit - 1), active] : head;
  })();

  return (
    <div className={["flex flex-col", large ? "gap-1.5" : "gap-1"].join(" ")}>
      {items.map((p) => {
        const meta = PRESET_META[p.id];
        const soon = meta?.soon;
        const active = activeId === p.id && !soon;
        const Icon = meta?.Icon;
        return (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            disabled={soon}
            className={[
              "flex items-center border text-left transition-colors",
              large ? "gap-3.5 rounded-xl px-3 py-2.5" : "gap-2.5 rounded-lg px-2.5 py-2",
              soon
                ? "border-transparent opacity-50 cursor-not-allowed"
                : active
                  ? "border-studio-accent cursor-pointer hover:bg-white/[0.06]"
                  : "border-transparent cursor-pointer hover:bg-white/[0.06]",
            ].join(" ")}
          >
            <span
              className={[
                "shrink-0 flex items-center justify-center",
                large ? "w-11 h-11 rounded-xl" : "w-6 h-6 rounded-md",
              ].join(" ")}
              style={{ background: "var(--studio-hover)", color: "var(--studio-text)" }}
            >
              {Icon && <Icon size={large ? 21 : 14} />}
            </span>
            <span
              className={[
                "flex-1 font-medium text-studio-text",
                large ? "text-[13px]" : "text-[11.5px]",
              ].join(" ")}
            >
              {p.name}
            </span>
            {soon ? (
              <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-studio-accent/[0.12] border border-studio-accent/30 text-studio-accent">
                Soon
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white/[0.04] text-studio-muted">
                {meta?.typeLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
