"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  LayoutGrid,
  BarChart3,
  AlignStartHorizontal,
  ListOrdered,
  Layers,
  Circle,
  Columns2,
  LineChart,
  Plus,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useEditorStore } from "@/lib/store";
import {
  INFOGRAPHIC_BG_HEX,
  INFOGRAPHIC_ACCENT_HEX,
  type InfographicBg,
  type InfographicAccent,
  type InfographicBlock,
  type InfographicBlockType,
  type InfographicContent,
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
import { ConfirmDialog } from "./sidebar/ConfirmDialog";
import { PresetList } from "./sidebar/PresetList";
import { SuggestionsModal } from "./SuggestionsModal";
import { PresetLibraryModal } from "./PresetLibraryModal";

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

/** Content types. One image holds exactly one of these. */
const BLOCK_TYPE_META: { type: InfographicBlockType; label: string; Icon: LucideIcon }[] = [
  { type: "stat", label: "Big number", Icon: TrendingUp },
  { type: "kpi-group", label: "Metrics", Icon: LayoutGrid },
  { type: "bar-group", label: "Bar chart", Icon: BarChart3 },
  { type: "stacked-bar", label: "Multi-series bar", Icon: AlignStartHorizontal },
  { type: "step", label: "Steps", Icon: ListOrdered },
  { type: "stack", label: "Layers", Icon: Layers },
  { type: "node-list", label: "Hub", Icon: Circle },
  { type: "compare", label: "Compare", Icon: Columns2 },
  { type: "line-chart", label: "Trend", Icon: LineChart },
];

// Matches the chat sidebar inputs: same-bg field defined by a border, ring on focus.
const inputCls =
  "w-full bg-studio-sidebar border border-studio-border rounded-md px-2.5 py-1.5 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none focus:ring-1 focus:ring-studio-accent transition-colors";

/** Info icon with a CSS hover tooltip (sidebar-only UI; never exported). */
function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center">
      <Info size={13} className="text-studio-muted hover:text-studio-text cursor-help transition-colors" />
      <span className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-60 rounded-md border border-studio-border bg-studio-bg px-2.5 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

/** Small on/off switch (studio accent track when on). */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={[
        "flex items-center w-8 h-[18px] rounded-full p-[2px] transition-colors shrink-0",
        on ? "bg-studio-accent justify-end" : "bg-studio-border justify-start",
      ].join(" ")}
    >
      <span className="w-3.5 h-3.5 rounded-full bg-white" />
    </button>
  );
}

/** Resizable panel bounds (mirrors the chat FormPanel). Width is session-only. */
const DEFAULT_PANEL_W = 320; // = the previous fixed w-80
const MIN_PANEL_W = 240;
const MAX_PANEL_W = 520;

/** Fingerprint of the fields a preset replaces (bg/title/footnote/blocks). Used
 *  to tell whether the canvas has diverged from its last clean baseline, so we
 *  only confirm a destructive preset swap when there are edits to lose. Format +
 *  accent are excluded: loadPreset preserves them, so they're never lost. */
function contentFingerprint(c: InfographicContent | null): string {
  if (!c) return "";
  return JSON.stringify({ bg: c.bg, title: c.title ?? "", footnote: c.footnote ?? "", blocks: c.blocks });
}

export function InfographicSidebar() {
  const {
    infographicContent: content,
    setInfographicContent,
    setInfographicFormat,
    setInfographicBg,
    setInfographicAccent,
    setInfographicTitle,
    setInfographicFootnote,
    setInfographicShowTitle,
    updateInfographicBlock,
  } = useEditorStore();

  const [activePreset, setActivePreset] = useState("brand-stat");
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_W);

  // ── AI Magic state ──
  const [article, setArticle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [applyNotice, setApplyNotice] = useState<string | null>(null);

  // ── "Edited since last clean load?" tracking ──
  // Baseline = the fingerprint of the last wholesale load (initial seed, restore,
  // or a preset). Captured once when content first appears; updated on a clean
  // preset/type swap. Incremental edits and AI-apply leave it stale, so the
  // fingerprint diverges → we know there's work a preset swap would destroy.
  const baselineRef = useRef<string | null>(null);
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);
  useEffect(() => {
    if (content && baselineRef.current === null) {
      baselineRef.current = contentFingerprint(content);
    }
  }, [content]);

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
    // One image = one content: the suggestion REPLACES the current block. Fill
    // the title only if the canvas doesn't already have one (don't clobber text
    // the marketer typed).
    setInfographicContent({
      ...content,
      title: first.suggestedTitle && !content.title?.trim() ? first.suggestedTitle : content.title,
      blocks: [suggestionToBlock(first)],
    });
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
    const blocks = JSON.parse(JSON.stringify(preset.blocks)) as InfographicBlock[];
    const next: InfographicContent = {
      ...content, // keep current format + accent
      bg: preset.bg,
      title: preset.title,
      footnote: preset.footnote,
      // Stat is a centered standalone number — never carries a title/footnote.
      ...(blocks[0]?.type === "stat" ? { showTitle: false } : {}),
      blocks,
    };
    setInfographicContent(next);
    baselineRef.current = contentFingerprint(next); // freshly loaded = clean
  }

  /** Preset clicks go through here: confirm first only if the canvas has edits a
   *  swap would discard; otherwise load straight away (no dialog by default). */
  function requestPreset(id: string) {
    if (PRESET_META[id]?.soon) return;
    const edited = baselineRef.current !== null && contentFingerprint(content) !== baselineRef.current;
    if (edited) setPendingPreset(id);
    else loadPreset(id);
  }

  /** Swap the single content block to a fresh default of the chosen type. */
  function pickType(type: InfographicBlockType) {
    if (!content) return;
    if (content.blocks[0]?.type === type) return; // already this type
    const next: InfographicContent = {
      ...content,
      // Stat can't use a title/footnote (centered standalone number).
      ...(type === "stat" ? { showTitle: false } : {}),
      blocks: [createBlock(type)],
    };
    setInfographicContent(next);
    // A swap drops in a fresh default block (no user data) → treat as clean so a
    // following preset click doesn't falsely warn about "losing edits".
    baselineRef.current = contentFingerprint(next);
  }

  const block = content.blocks[0];
  // Stat is a centered, standalone big number — the title & footnote section is
  // disabled for it (and forced off above whenever stat becomes the content).
  const titleLocked = block?.type === "stat";

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    function onMove(ev: MouseEvent) {
      // Panel sits on the right, so dragging left widens it.
      const delta = startX - ev.clientX;
      setPanelWidth(Math.min(MAX_PANEL_W, Math.max(MIN_PANEL_W, startW + delta)));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      style={{ width: panelWidth }}
      className="relative shrink-0 h-full flex flex-col bg-studio-sidebar border-l border-studio-border"
    >
      {/* Resize handle — left edge (outside the scroll container so it spans the
          full panel height regardless of scroll). */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 h-full w-px cursor-ew-resize z-10 bg-transparent hover:[background:#F2FF66] transition-colors"
        title="Drag to resize panel"
      />

      <div className="flex-1 overflow-y-auto">
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
      <Section
        title="Format"
        info={
          <InfoTooltip text="Formats aren't interchangeable. Don't use a Product feature image in a blog, or a Blog/Perspective image as a product feature — each is sized and laid out for its own placement." />
        }
      >
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

      {/* Preset — 4-item preview; the "+" opens a modal with the full set. */}
      <Section
        title="Preset"
        action={
          <button
            onClick={() => setPresetModalOpen(true)}
            title="All presets"
            aria-label="All presets"
            className="flex items-center justify-center w-6 h-6 rounded-md text-studio-muted hover:text-studio-text hover:bg-white/[0.06] transition-colors"
          >
            <Plus size={15} />
          </button>
        }
      >
        <PresetList activeId={activePreset} onPick={requestPreset} limit={4} />
      </Section>

      {/* Background — product format is locked to the fixed warm-gray bg. */}
      <Section title="Background">
        {content.format === "product" ? (
          <p className="text-[11px] text-studio-muted leading-relaxed">
            Fixed to Warm gray for the product format.
          </p>
        ) : (
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
        )}
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
      {(() => {
        const showTitle = content.showTitle !== false && !titleLocked;
        // Blog-only feature: the product format is a fixed size, so a title &
        // footnote would clip. Offer it only in the blog format.
        if (content.format === "product") {
          return (
            <Section title="Title & footnote">
              <p className="text-[11px] text-studio-muted leading-relaxed">
                Available in the Blog format only — Product is a fixed size, so a title &amp; footnote would get
                clipped. Switch to Blog to add them.
              </p>
            </Section>
          );
        }
        // Stat layout: no title/footnote at all — show a note instead of the toggle.
        if (titleLocked) {
          return (
            <Section title="Title & footnote">
              <p className="text-[11px] text-studio-muted leading-relaxed">
                Not available for the Stat layout — it&apos;s a centered standalone number.
              </p>
            </Section>
          );
        }
        return (
          <Section
            title="Title & footnote"
            action={<Toggle on={showTitle} onChange={setInfographicShowTitle} />}
          >
            {showTitle ? (
              <>
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
              </>
            ) : (
              <p className="text-[11px] text-studio-muted leading-relaxed">
                Hidden — graph / centered content only. Toggle on to add a title &amp; footnote.
              </p>
            )}
          </Section>
        );
      })()}

      {/* Content — one image holds exactly one content block */}
      <Section title="Block">
        {/* Type picker — small icon grid; selecting one replaces the content */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {BLOCK_TYPE_META.map(({ type, label, Icon }) => {
            const active = block?.type === type;
            return (
              <button
                key={type}
                onClick={() => pickType(type)}
                aria-pressed={active}
                title={label}
                className={[
                  "flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border transition-colors",
                  active
                    ? "border-studio-accent text-studio-text"
                    : "border-studio-border text-studio-muted hover:text-studio-text hover:border-studio-muted",
                ].join(" ")}
              >
                <Icon size={16} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>

        {block ? (
          <>
            <BlockEditor block={block} onChange={(nb) => updateInfographicBlock(block.id, nb)} format={content.format} />
            <button
              onClick={() => setInfographicContent({ ...content, blocks: [] })}
              className="mt-1 w-full text-[11px] text-studio-muted hover:text-red-400 transition-colors py-1.5"
            >
              Clear block
            </button>
          </>
        ) : (
          <p className="text-[11px] text-studio-muted py-2">Pick a content type above to start.</p>
        )}
      </Section>
      </div>

      <SuggestionsModal
        open={modalOpen}
        suggestions={suggestions}
        bg={content.bg}
        accent={content.accent}
        onClose={() => setModalOpen(false)}
        onCreate={applySuggestions}
      />

      {presetModalOpen && (
        <PresetLibraryModal
          activeId={activePreset}
          onSelect={(id) => {
            setPresetModalOpen(false);
            requestPreset(id);
          }}
          onClose={() => setPresetModalOpen(false)}
        />
      )}

      {pendingPreset && (
        <ConfirmDialog
          title="Replace with this preset?"
          message="Your current edits will be replaced by the preset. This can't be undone."
          confirmLabel="Replace"
          cancelLabel="Cancel"
          onConfirm={() => {
            loadPreset(pendingPreset);
            setPendingPreset(null);
          }}
          onCancel={() => setPendingPreset(null)}
        />
      )}
    </div>
  );
}
