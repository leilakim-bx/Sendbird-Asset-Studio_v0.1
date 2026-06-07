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
  type InfographicFormat,
} from "@/lib/types/infographic";
import { INFOGRAPHIC_PRESETS, PRESET_META, createBlock } from "@/lib/infographic-presets";
import {
  validateSuggestions,
  suggestionToBlock,
  type Suggestion,
} from "@/lib/ai/validate-suggestions";
import { AiMagicButton } from "@/components/ui/ai-magic-button";
import { Section } from "./sidebar/Section";
import { BlockEditor } from "./sidebar/BlockEditor";
import { SuggestionsModal } from "./SuggestionsModal";

const BG_OPTIONS: { id: InfographicBg; name: string }[] = [
  { id: "sky", name: "Sky" },
  { id: "stone", name: "Stone" },
  { id: "warmgray", name: "Warm gray" },
];
const ACCENT_OPTIONS: InfographicAccent[] = ["lime", "blue", "red", "green"];

const FORMAT_OPTIONS: { id: InfographicFormat; label: string }[] = [
  { id: "product", label: "Product feature" },
  { id: "blog", label: "Blog/Perspective" },
];

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
    setInfographicFormat,
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

  // ── AI Magic state ──
  const [article, setArticle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [applyNotice, setApplyNotice] = useState<string | null>(null);

  if (!content) return null;

  async function handleAnalyze() {
    const text = article.trim();
    if (!text || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setApplyNotice(null);
    try {
      const res = await fetch("/api/analyze-article", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ article: text }),
      });
      const data = (await res.json()) as { suggestions?: unknown; error?: string };
      if (!res.ok) throw new Error(data?.error || `Analysis failed (${res.status})`);
      // Re-validate client-side as defense-in-depth: the modal only ever
      // receives suggestions that pass our schema.
      setSuggestions(validateSuggestions(data));
      setModalOpen(true);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  function applySuggestions(picked: Suggestion[]) {
    if (!content || picked.length === 0) return;
    const first = picked[0];
    // Fill the title only if the canvas doesn't already have one (don't clobber
    // text the marketer typed).
    if (first.suggestedTitle && !content.title?.trim()) {
      setInfographicTitle(first.suggestedTitle);
    }
    addInfographicBlock(suggestionToBlock(first));
    setModalOpen(false);
    setApplyNotice(
      picked.length > 1
        ? "Applied the first suggestion. Creating multiple infographics at once is coming later."
        : "Added to your canvas.",
    );
  }

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
      <div className="m-4 rounded-xl p-3.5 border border-studio-border bg-white/[0.02]">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center" style={{ background: "#2E2E2E" }}>
            <Sparkles size={13} className="text-studio-text" fill="currentColor" />
          </span>
          <span className="text-xs font-semibold text-studio-text tracking-tight">Create with AI</span>
        </div>
        {/* Composer — borderless textarea with a bottom-right send button */}
        <textarea
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          disabled={analyzing}
          placeholder="Paste article text here…"
          rows={5}
          className="w-full bg-transparent border-0 outline-none resize-none text-xs text-studio-text leading-snug placeholder:text-[#555] disabled:opacity-60 min-h-[96px]"
        />
        <div className="flex justify-end">
          <AiMagicButton
            label="Analyze"
            loading={analyzing}
            disabled={analyzing || !article.trim()}
            onClick={handleAnalyze}
          />
        </div>
        {analyzeError && <p className="mt-1.5 text-[10px] text-red-400 leading-snug">{analyzeError}</p>}
        {applyNotice && !analyzeError && (
          <p className="mt-1.5 text-[10px] text-studio-muted leading-snug">{applyNotice}</p>
        )}
      </div>

      {/* Format */}
      <Section title="Format">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
          {FORMAT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setInfographicFormat(id)}
              aria-pressed={content.format === id}
              className={[
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap",
                content.format === id
                  ? "bg-studio-hover text-studio-text"
                  : "text-studio-muted hover:text-studio-text",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Preset */}
      <Section title="Preset">
        <div className="flex flex-col gap-1">
          {INFOGRAPHIC_PRESETS.map((p) => {
            const meta = PRESET_META[p.id];
            const soon = meta?.soon;
            const active = activePreset === p.id && !soon;
            const Icon = meta?.Icon;
            return (
              <button
                key={p.id}
                onClick={() => loadPreset(p.id)}
                disabled={soon}
                className={[
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 border text-left transition-colors",
                  soon
                    ? "border-transparent opacity-50 cursor-not-allowed"
                    : active
                      ? "border-studio-accent cursor-pointer hover:bg-white/[0.06]"
                      : "border-transparent cursor-pointer hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <span
                  className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center"
                  style={{ background: "#2E2E2E", color: "#FFFFFF" }}
                >
                  {Icon && <Icon size={14} />}
                </span>
                <span className="flex-1 text-[11.5px] font-medium text-studio-text">{p.name}</span>
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
      </Section>

      {/* Background */}
      <Section title="Background">
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
      <Section title="Accent">
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

      {/* Blocks — disabled for now (feature to be developed) */}
      <Section title="Blocks" badge="Soon" disabled>
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

      <SuggestionsModal
        open={modalOpen}
        suggestions={suggestions}
        bg={content.bg}
        accent={content.accent}
        onClose={() => setModalOpen(false)}
        onCreate={applySuggestions}
      />
    </div>
  );
}
