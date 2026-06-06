"use client";

import { useState } from "react";
import { Sparkles, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { useEditorStore } from "@/lib/store";
import {
  INFOGRAPHIC_BG_HEX,
  INFOGRAPHIC_ACCENT_HEX,
  type InfographicBg,
  type InfographicAccent,
  type InfographicBlock,
  type InfographicBlockType,
} from "@/lib/types/infographic";
import { INFOGRAPHIC_PRESETS, PRESET_META, createBlock } from "@/lib/infographic-presets";
import { Section } from "./sidebar/Section";
import { BlockEditor } from "./sidebar/BlockEditor";

const BG_OPTIONS: { id: InfographicBg; name: string }[] = [
  { id: "sky", name: "Sky" },
  { id: "stone", name: "Stone" },
  { id: "warmgray", name: "Warm gray" },
];
const ACCENT_OPTIONS: InfographicAccent[] = ["lime", "blue", "red", "green"];

const ADD_TYPES: { type: InfographicBlockType; label: string }[] = [
  { type: "stat", label: "Stat" },
  { type: "kpi-group", label: "KPI group" },
  { type: "bar-group", label: "Bar comparison" },
  { type: "step", label: "Steps" },
  { type: "node-list", label: "Node list" },
];

function blockLabel(b: InfographicBlock): string {
  switch (b.type) {
    case "stat":
      return b.label || b.number || "—";
    case "kpi-group":
      return `${b.items.length} KPIs`;
    case "bar-group":
      return `${b.items.length} bars`;
    case "step":
      return `${b.items.length} steps`;
    case "node-list":
      return b.hubTitle || `${b.items.length} nodes`;
  }
}

const inputCls =
  "w-full bg-[#0E0E0E] border border-studio-border rounded-md px-2.5 py-1.5 text-xs text-studio-text outline-none focus:border-studio-accent transition-colors placeholder:text-[#555]";

export function InfographicSidebar() {
  const {
    infographicContent: content,
    setInfographicContent,
    setInfographicBg,
    setInfographicAccent,
    setInfographicTitle,
    setInfographicFootnote,
    addInfographicBlock,
    updateInfographicBlock,
    removeInfographicBlock,
  } = useEditorStore();

  const [activePreset, setActivePreset] = useState("brand-stat");
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState(false);

  if (!content) return null;

  function loadPreset(id: string) {
    const meta = PRESET_META[id];
    if (meta?.soon) return;
    const preset = INFOGRAPHIC_PRESETS.find((p) => p.id === id);
    if (!preset || !content) return;
    setActivePreset(id);
    setInfographicContent({
      ...content, // keep current format + accent
      bg: preset.bg,
      title: preset.title,
      footnote: preset.footnote,
      blocks: JSON.parse(JSON.stringify(preset.blocks)) as InfographicBlock[],
    });
  }

  function addBlock(type: InfographicBlockType) {
    const block = createBlock(type);
    addInfographicBlock(block);
    setExpandedBlock(block.id);
  }

  return (
    <div className="w-80 shrink-0 border-l border-studio-border bg-studio-sidebar overflow-y-auto">
      {/* AI Magic */}
      <div
        className="m-4 rounded-xl p-3.5 border"
        style={{
          background: "linear-gradient(135deg, rgba(212,255,77,0.12), rgba(39,166,247,0.08))",
          borderColor: "rgba(212,255,77,0.25)",
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={14} className="text-studio-accent" />
          <span className="text-[11px] font-semibold text-studio-text tracking-tight">AI MAGIC</span>
        </div>
        <p className="text-[10.5px] text-studio-muted leading-snug mb-2.5">
          Paste your article and AI will suggest infographics that fit your data.
        </p>
        <textarea
          placeholder="Paste article text here…"
          className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-[11px] text-studio-text outline-none focus:border-studio-accent transition-colors resize-none min-h-16 placeholder:text-[#555]"
        />
        <button
          onClick={() => setAiHint(true)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-studio-accent text-studio-accent-fg rounded-md text-[11px] font-semibold hover:opacity-90 transition-opacity"
        >
          <Sparkles size={12} />
          Analyze
        </button>
        {aiHint && <p className="mt-1.5 text-[9.5px] text-studio-muted">✨ AI suggestions arrive in step 4.</p>}
      </div>

      {/* Preset */}
      <Section title="Preset">
        <div className="flex flex-col gap-1">
          {INFOGRAPHIC_PRESETS.map((p) => {
            const meta = PRESET_META[p.id];
            const soon = meta?.soon;
            const active = activePreset === p.id && !soon;
            return (
              <button
                key={p.id}
                onClick={() => loadPreset(p.id)}
                disabled={soon}
                className={[
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 border text-left transition-colors",
                  soon
                    ? "border-studio-border opacity-50 cursor-not-allowed"
                    : active
                      ? "border-studio-accent bg-studio-accent/[0.06] cursor-pointer"
                      : "border-studio-border hover:border-studio-muted cursor-pointer",
                ].join(" ")}
              >
                <span
                  className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs"
                  style={{ background: INFOGRAPHIC_BG_HEX[p.bg], color: "#1C1917", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {meta?.icon}
                </span>
                <span className="flex-1 text-[11.5px] font-medium text-studio-text">{p.name}</span>
                {soon ? (
                  <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-studio-accent/[0.12] border border-studio-accent/30 text-studio-accent">
                    Soon
                  </span>
                ) : (
                  <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/[0.04] text-studio-muted">
                    {meta?.typeLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Background */}
      <Section title="Background" defaultCollapsed>
        <div className="flex gap-1.5 flex-wrap">
          {BG_OPTIONS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setInfographicBg(bg.id)}
              title={bg.name}
              className={[
                "w-8 h-8 rounded-md border-2 transition-transform hover:scale-110",
                content.bg === bg.id ? "border-studio-accent" : "border-transparent",
              ].join(" ")}
              style={{ background: INFOGRAPHIC_BG_HEX[bg.id], boxShadow: content.bg === bg.id ? "0 0 0 1px var(--studio-sidebar)" : undefined }}
            />
          ))}
        </div>
      </Section>

      {/* Accent */}
      <Section title="Accent" defaultCollapsed>
        <div className="flex gap-1.5 flex-wrap">
          {ACCENT_OPTIONS.map((ac) => (
            <button
              key={ac}
              onClick={() => setInfographicAccent(ac)}
              title={ac}
              className={[
                "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                content.accent === ac ? "border-studio-accent" : "border-transparent",
              ].join(" ")}
              style={{ background: INFOGRAPHIC_ACCENT_HEX[ac], boxShadow: content.accent === ac ? "0 0 0 1px var(--studio-sidebar)" : undefined }}
            />
          ))}
        </div>
      </Section>

      {/* Title & footnote */}
      <Section title="Title & footnote">
        <div className="mb-2.5">
          <label className="block text-[10px] text-studio-muted mb-1">Title</label>
          <input className={inputCls} value={content.title ?? ""} onChange={(e) => setInfographicTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] text-studio-muted mb-1">Footnote</label>
          <textarea
            className={inputCls + " resize-none min-h-12"}
            value={content.footnote ?? ""}
            onChange={(e) => setInfographicFootnote(e.target.value)}
          />
        </div>
      </Section>

      {/* Blocks */}
      <Section title="Blocks">
        <div className="flex flex-col gap-1.5 mb-2">
          {content.blocks.length === 0 && (
            <p className="text-[11px] text-studio-muted py-2">No blocks yet. Add one below.</p>
          )}
          {content.blocks.map((b) => {
            const open = expandedBlock === b.id;
            return (
              <div key={b.id} className="rounded-lg border border-studio-border overflow-hidden bg-[#0E0E0E]">
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/[0.05] text-studio-muted font-medium">
                    {b.type}
                  </span>
                  <span className="flex-1 text-[11px] text-studio-text truncate">{blockLabel(b)}</span>
                  <button
                    onClick={() => setExpandedBlock(open ? null : b.id)}
                    className="text-studio-muted hover:text-studio-text transition-colors p-0.5"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (open) setExpandedBlock(null);
                      removeInfographicBlock(b.id);
                    }}
                    className="text-studio-muted hover:text-studio-text transition-colors p-0.5"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {open && (
                  <div className="px-2.5 pb-2.5 pt-1 border-t border-studio-border">
                    <BlockEditor block={b} onChange={(nb) => updateInfographicBlock(b.id, nb)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add block */}
        <Menu.Root>
          <Menu.Trigger className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-studio-border rounded-lg text-[11px] text-studio-muted hover:border-studio-accent hover:text-studio-accent transition-colors">
            <Plus size={12} />
            Add block
            <ChevronDown size={12} />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side="bottom" align="center" sideOffset={6}>
              <Menu.Popup className="z-50 min-w-[180px] rounded-xl border border-studio-border bg-studio-sidebar shadow-xl py-1.5 outline-none">
                {ADD_TYPES.map((t) => (
                  <Menu.Item
                    key={t.type}
                    onClick={() => addBlock(t.type)}
                    className="flex items-center px-3 py-2 text-xs text-studio-text hover:bg-studio-hover cursor-default outline-none rounded-lg mx-1"
                  >
                    {t.label}
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Section>
    </div>
  );
}
