"use client";

import {
  Brain,
  Zap,
  Globe,
  ListChecks,
  ShieldCheck,
  Mic,
  Map,
  Ban,
  type LucideIcon,
} from "lucide-react";
import { SCENARIOS } from "@/lib/scenarios";

// Preset-style scenario list — mirrors the infographic sidebar's Preset cards
// (chip icon + name + type label, lime border when active) so the two sidebars
// read as one design system. Uses lucide icons to match the infographic presets.
type ScenarioMeta = { Icon: LucideIcon; typeLabel: string };

const SCENARIO_META: Record<string, ScenarioMeta> = {
  "memory-recall":      { Icon: Brain,       typeLabel: "products" },
  "proactive-outreach": { Icon: Zap,         typeLabel: "actions" },
  "omnichannel-pickup": { Icon: Globe,       typeLabel: "status" },
  "agent-steward":      { Icon: ListChecks,  typeLabel: "checklist" },
  "trust-governance":   { Icon: ShieldCheck, typeLabel: "verified" },
  "voice-ai":           { Icon: Mic,         typeLabel: "voice" },
  "travel-itinerary":   { Icon: Map,         typeLabel: "itinerary" },
};

const FALLBACK: ScenarioMeta = { Icon: Ban, typeLabel: "scenario" };

// Dark gray chip (no border) + white line icon.
const CHIP_BG = "var(--studio-hover)";
const CHIP_FG = "var(--studio-text)";

export function ScenarioList({
  activeId,
  onPick,
  limit,
}: {
  activeId: string | null;
  onPick: (id: string) => void;
  /** Show only the first N scenarios (sidebar preview). Omit to show all. */
  limit?: number;
}) {
  // Sidebar preview shows the first `limit` scenarios — but always keep the
  // selected one visible: if it falls outside the window, drop it into the
  // last slot (top items stay stable).
  const items = (() => {
    if (!limit) return SCENARIOS;
    const head = SCENARIOS.slice(0, limit);
    if (!activeId || head.some((s) => s.id === activeId)) return head;
    const active = SCENARIOS.find((s) => s.id === activeId);
    return active ? [...SCENARIOS.slice(0, limit - 1), active] : head;
  })();
  return (
    <div className="flex flex-col gap-1">
      {items.map((s) => {
        const meta = SCENARIO_META[s.id] ?? FALLBACK;
        const Icon = meta.Icon;
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onPick(s.id)}
            className={[
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 border text-left transition-colors cursor-pointer hover:bg-white/[0.06]",
              active
                ? "border-studio-accent"
                : "border-transparent",
            ].join(" ")}
          >
            <span
              className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center"
              style={{ background: CHIP_BG, color: CHIP_FG }}
            >
              <Icon size={14} />
            </span>
            <span className="flex-1 text-[11.5px] font-medium text-studio-text">{s.name}</span>
            <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white/[0.04] text-studio-muted">
              {meta.typeLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
