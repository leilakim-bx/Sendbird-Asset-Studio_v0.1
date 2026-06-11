"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
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
  CircleAlert,
  ChevronDown,
  WandSparkles,
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
import { type ArticleImageCandidate } from "@/lib/infographic-article-extractor";
import { AiMagicButton } from "@/components/ui/ai-magic-button";
import { Section } from "./sidebar/Section";
import { BlockEditor } from "./sidebar/BlockEditor";
import { ConfirmDialog } from "./sidebar/ConfirmDialog";
import { PresetList } from "./sidebar/PresetList";
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

const SOURCE_TEMPLATE = "Article:\n[paste article URL or full article]\n\nImage notes:\n1. \n2. \n3. ";
const IMAGE_NOTES_TEMPLATE = "Image notes:\n1. \n2. \n3. ";

const SIMPLE_BLOCK_TYPES: { id: InfographicBlockType; label: string }[] = [
  { id: "stat", label: "Big number" },
  { id: "kpi-group", label: "Metrics" },
  { id: "compare", label: "Compare" },
  { id: "step", label: "Steps" },
  { id: "line-chart", label: "Trend" },
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
  "w-full bg-studio-sidebar border border-studio-border rounded-lg px-2.5 py-1.5 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none focus:ring-1 focus:ring-studio-accent transition-colors";

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

function SourceTipsTooltip() {
  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        aria-label="Create from source guide and tips"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-studio-muted hover:text-studio-text hover:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-studio-accent transition-colors"
      >
        <CircleAlert size={13} />
      </button>
      <span className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-72 rounded-md border border-studio-border bg-studio-bg px-2.5 py-2 text-[11px] font-normal leading-snug text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <span className="block">Paste an article URL, full article, chart data, or image notes.</span>
        <span className="mt-1 block text-studio-muted">
          Protected URLs cannot be read. If a link requires login, paste the article text or use a share link Studio can access.
        </span>
        <span className="mt-1 block text-studio-muted">
          Use template to request specific charts, stats, or sections.
        </span>
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

function SimpleField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-2.5">
      <label className="block text-[10px] text-studio-muted mb-1">{label}</label>
      {children}
    </div>
  );
}

function AddMiniRow({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-studio-border rounded-md text-[11px] text-studio-muted hover:border-studio-accent hover:text-studio-accent transition-colors"
    >
      <Plus size={11} />
      {children}
    </button>
  );
}

function SimpleItem({
  children,
  onRemove,
}: {
  children: ReactNode;
  onRemove?: () => void;
}) {
  return (
    <div className="bg-studio-hover rounded-lg p-2.5 mb-2">
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">{children}</div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove"
            className="shrink-0 text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function blockTypeLabel(type: InfographicBlockType | undefined): string {
  return SIMPLE_BLOCK_TYPES.find((item) => item.id === type)?.label ?? "Advanced";
}

function SelectedImageEditor({
  content,
  onChange,
}: {
  content: InfographicContent;
  onChange: (next: InfographicContent) => void;
}) {
  const block = content.blocks[0];
  const setTitle = (title: string) => onChange({ ...content, title });
  const setBlock = (next: InfographicBlock) => onChange({ ...content, blocks: [next] });
  const setType = (type: InfographicBlockType) =>
    onChange({
      ...content,
      showTitle: type === "stat" ? false : content.showTitle,
      blocks: [createBlock(type)],
    });

  if (!block) {
    return <p className="text-[11px] text-studio-muted leading-relaxed">Pick an article image or preset to edit.</p>;
  }

  return (
    <>
      <SimpleField label="Title">
        <input className={inputCls} value={content.title ?? ""} onChange={(event) => setTitle(event.target.value)} />
      </SimpleField>

      <SimpleField label="Type">
        <select
          className={inputCls}
          value={SIMPLE_BLOCK_TYPES.some((item) => item.id === block.type) ? block.type : ""}
          onChange={(event) => {
            const value = event.target.value as InfographicBlockType;
            if (value) setType(value);
          }}
        >
          {!SIMPLE_BLOCK_TYPES.some((item) => item.id === block.type) && (
            <option value="">Advanced block</option>
          )}
          {SIMPLE_BLOCK_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </SimpleField>

      {block.type === "stat" && (
        <>
          <SimpleField label="Eyebrow">
            <input
              className={inputCls}
              value={block.eyebrow ?? ""}
              onChange={(event) => setBlock({ ...block, eyebrow: event.target.value })}
            />
          </SimpleField>
          <SimpleField label="Number">
            <input
              className={inputCls}
              value={block.number}
              onChange={(event) => setBlock({ ...block, number: event.target.value })}
            />
          </SimpleField>
          <SimpleField label="Label">
            <input
              className={inputCls}
              value={block.label ?? ""}
              onChange={(event) => setBlock({ ...block, label: event.target.value })}
            />
          </SimpleField>
        </>
      )}

      {block.type === "kpi-group" && (
        <>
          {block.items.map((item, index) => (
            <SimpleItem
              key={index}
              onRemove={block.items.length > 1 ? () => {
                setBlock({ ...block, items: block.items.filter((_, itemIndex) => itemIndex !== index) });
              } : undefined}
            >
              <div className="grid grid-cols-[76px_1fr] gap-1.5">
                <input
                  className={inputCls}
                  placeholder="Number"
                  value={item.number}
                  onChange={(event) =>
                    setBlock({
                      ...block,
                      items: block.items.map((candidate, itemIndex) =>
                        itemIndex === index ? { ...candidate, number: event.target.value } : candidate,
                      ),
                    })
                  }
                />
                <input
                  className={inputCls}
                  placeholder="Label"
                  value={item.label}
                  onChange={(event) =>
                    setBlock({
                      ...block,
                      items: block.items.map((candidate, itemIndex) =>
                        itemIndex === index ? { ...candidate, label: event.target.value } : candidate,
                      ),
                    })
                  }
                />
              </div>
            </SimpleItem>
          ))}
          {block.items.length < 4 && (
            <AddMiniRow onClick={() => setBlock({ ...block, items: [...block.items, { number: "00", label: "Label" }] })}>
              Add metric
            </AddMiniRow>
          )}
        </>
      )}

      {block.type === "compare" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <SimpleField label="Before">
              <input
                className={inputCls}
                value={block.columnA}
                onChange={(event) => setBlock({ ...block, columnA: event.target.value })}
              />
            </SimpleField>
            <SimpleField label="After">
              <input
                className={inputCls}
                value={block.columnB}
                onChange={(event) => setBlock({ ...block, columnB: event.target.value })}
              />
            </SimpleField>
          </div>
          {block.rows.map((row, index) => (
            <SimpleItem
              key={index}
              onRemove={block.rows.length > 1 ? () => {
                setBlock({ ...block, rows: block.rows.filter((_, rowIndex) => rowIndex !== index) });
              } : undefined}
            >
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  className={inputCls}
                  placeholder={block.columnA || "Before"}
                  value={row.a}
                  onChange={(event) =>
                    setBlock({
                      ...block,
                      rows: block.rows.map((candidate, rowIndex) =>
                        rowIndex === index ? { ...candidate, a: event.target.value } : candidate,
                      ),
                    })
                  }
                />
                <input
                  className={inputCls}
                  placeholder={block.columnB || "After"}
                  value={row.b}
                  onChange={(event) =>
                    setBlock({
                      ...block,
                      rows: block.rows.map((candidate, rowIndex) =>
                        rowIndex === index ? { ...candidate, b: event.target.value } : candidate,
                      ),
                    })
                  }
                />
              </div>
            </SimpleItem>
          ))}
          <AddMiniRow onClick={() => setBlock({ ...block, rows: [...block.rows, { a: "", b: "" }] })}>
            Add row
          </AddMiniRow>
        </>
      )}

      {block.type === "step" && (
        <>
          {block.items.map((item, index) => (
            <SimpleItem
              key={index}
              onRemove={block.items.length > 1 ? () => {
                setBlock({ ...block, items: block.items.filter((_, itemIndex) => itemIndex !== index) });
              } : undefined}
            >
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Step title"
                value={item.title}
                onChange={(event) =>
                  setBlock({
                    ...block,
                    items: block.items.map((candidate, itemIndex) =>
                      itemIndex === index ? { ...candidate, title: event.target.value } : candidate,
                    ),
                  })
                }
              />
              <input
                className={inputCls}
                placeholder="Step detail"
                value={item.desc ?? ""}
                onChange={(event) =>
                  setBlock({
                    ...block,
                    items: block.items.map((candidate, itemIndex) =>
                      itemIndex === index ? { ...candidate, desc: event.target.value } : candidate,
                    ),
                  })
                }
              />
            </SimpleItem>
          ))}
          <AddMiniRow onClick={() => setBlock({ ...block, items: [...block.items, { title: "Step", desc: "" }] })}>
            Add step
          </AddMiniRow>
        </>
      )}

      {block.type === "line-chart" && (
        <>
          <SimpleField label="Line label">
            <input
              className={inputCls}
              value={block.seriesA.label}
              onChange={(event) => setBlock({ ...block, seriesA: { ...block.seriesA, label: event.target.value } })}
            />
          </SimpleField>
          {block.xLabels.map((label, index) => (
            <SimpleItem
              key={index}
              onRemove={block.xLabels.length > 2 ? () => {
                setBlock({
                  ...block,
                  xLabels: block.xLabels.filter((_, labelIndex) => labelIndex !== index),
                  seriesA: {
                    ...block.seriesA,
                    values: block.seriesA.values.filter((_, valueIndex) => valueIndex !== index),
                  },
                });
              } : undefined}
            >
              <div className="grid grid-cols-[1fr_76px] gap-1.5">
                <input
                  className={inputCls}
                  placeholder="Label"
                  value={label}
                  onChange={(event) =>
                    setBlock({
                      ...block,
                      xLabels: block.xLabels.map((candidate, labelIndex) =>
                        labelIndex === index ? event.target.value : candidate,
                      ),
                    })
                  }
                />
                <input
                  className={inputCls}
                  type="number"
                  value={block.seriesA.values[index] ?? 0}
                  onChange={(event) =>
                    setBlock({
                      ...block,
                      seriesA: {
                        ...block.seriesA,
                        values: block.seriesA.values.map((candidate, valueIndex) =>
                          valueIndex === index ? Number(event.target.value) || 0 : candidate,
                        ),
                      },
                    })
                  }
                />
              </div>
            </SimpleItem>
          ))}
          <AddMiniRow
            onClick={() =>
              setBlock({
                ...block,
                xLabels: [...block.xLabels, ""],
                seriesA: { ...block.seriesA, values: [...block.seriesA.values, 0] },
              })
            }
          >
            Add point
          </AddMiniRow>
        </>
      )}

      {!SIMPLE_BLOCK_TYPES.some((item) => item.id === block.type) && (
        <p className="text-[11px] text-studio-muted leading-relaxed">
          This block uses advanced controls. Open Advanced settings below to edit it.
        </p>
      )}
    </>
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

export function InfographicSidebar({
  articleImages,
  activeArticleImageId,
  onSuggestArticleImages,
  onSelectArticleImage,
  onToggleArticleImage,
}: {
  articleImages: ArticleImageCandidate[];
  activeArticleImageId: string | null;
  onSuggestArticleImages: (source: string) => Promise<{ count: number; notice: string }>;
  onSelectArticleImage: (id: string) => void;
  onToggleArticleImage: (id: string) => void;
}) {
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
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Source suggestions state ──
  const [article, setArticle] = useState("");
  const [articleNotice, setArticleNotice] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  async function handleSuggestImages() {
    const text = article.trim();
    if (!text || sourceLoading) return;
    setSourceLoading(true);
    setArticleNotice(null);
    try {
      const result = await onSuggestArticleImages(text);
      setArticleNotice(result.notice);
    } catch {
      setArticleNotice("Could not read this source. Paste the article text or use an AI-accessible share link.");
    } finally {
      setSourceLoading(false);
    }
  }

  function handleUseTemplate() {
    setArticle((current) => {
      const trimmed = current.trim();
      if (!trimmed) return SOURCE_TEMPLATE;
      if (/(^|\n)\s*Image notes:/i.test(trimmed)) return current;
      return `${trimmed}\n\n${IMAGE_NOTES_TEMPLATE}`;
    });
    setArticleNotice(null);
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
      ref={panelRef}
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

      <div className="m-4 rounded-xl p-3.5 border border-studio-border bg-white/[0.02]">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center" style={{ background: "#2E2E2E" }}>
            <Sparkles size={13} className="text-studio-text" fill="currentColor" />
          </span>
          <span className="text-xs font-semibold text-studio-text tracking-tight">Create from source</span>
          <SourceTipsTooltip />
        </div>
        <textarea
          value={article}
          onChange={(event) => setArticle(event.target.value)}
          placeholder="Paste article URL, full article, chart data, or image notes..."
          rows={6}
          className="w-full bg-transparent border-0 outline-none resize-none text-xs text-studio-text leading-snug placeholder:text-[#555] min-h-[112px]"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="group relative inline-flex">
            <button
              type="button"
              onClick={handleUseTemplate}
              disabled={sourceLoading}
              aria-label="Use template"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#2E2E2E] text-studio-text transition-colors hover:bg-[#3A3A3A] focus:outline-none focus:ring-1 focus:ring-studio-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <WandSparkles size={16} />
            </button>
            <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 whitespace-nowrap rounded-md border border-studio-border bg-studio-bg px-2 py-1 text-[11px] font-medium text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              Use template
            </span>
          </span>
          <AiMagicButton
            label="Generate images from source"
            loading={sourceLoading}
            disabled={sourceLoading || !article.trim()}
            onClick={handleSuggestImages}
          />
        </div>
        {articleNotice && <p className="mt-2 text-[10px] text-studio-muted leading-snug">{articleNotice}</p>}
      </div>

      {articleImages.length > 0 && (
        <Section title="Generated images">
          <div className="flex flex-col gap-1">
            {articleImages.map((candidate, index) => {
              const active = candidate.id === activeArticleImageId;
              const status = active ? "Editing" : candidate.status === "ready" ? "Ready" : "Draft";
              const displayTitle = active ? content.title?.trim() || candidate.title : candidate.title;
              const displayBlockType = active ? block?.type ?? candidate.blockType : candidate.blockType;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => onSelectArticleImage(candidate.id)}
                  className={[
                    "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]",
                    active ? "border-studio-accent" : "border-transparent",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={candidate.selected}
                    onChange={() => onToggleArticleImage(candidate.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="sb-checkbox shrink-0"
                    aria-label={`Export ${candidate.title}`}
                  />
                  <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-studio-hover text-[9px] font-semibold text-studio-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-medium text-studio-text">
                      {displayTitle}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-studio-muted">
                        {blockTypeLabel(displayBlockType)}
                      </span>
                      <span className="text-[9px] text-studio-muted">{status}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Selected image">
        <SelectedImageEditor content={content} onChange={setInfographicContent} />
        {activeArticleImageId && (
          <p className="mt-2 border-l-2 border-studio-border pl-2 text-[10.5px] italic leading-snug text-studio-muted">
            {articleImages.find((candidate) => candidate.id === activeArticleImageId)?.sourceSnippet}
          </p>
        )}
      </Section>

      <Section
        title="Advanced settings"
        action={
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center justify-center w-6 h-6 rounded-md text-studio-muted hover:text-studio-text hover:bg-white/[0.06] transition-colors"
            aria-label="Toggle advanced settings"
          >
            <ChevronDown size={15} className={advancedOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
        }
      >
        {!advancedOpen ? (
          <p className="text-[11px] text-studio-muted leading-relaxed">
            Presets, colors, chart variants, and detailed block controls are hidden by default.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Preset</span>
                <button
                  onClick={() => setPresetModalOpen(true)}
                  title="All presets"
                  aria-label="All presets"
                  className="ml-auto flex items-center justify-center w-6 h-6 rounded-md text-studio-muted hover:text-studio-text hover:bg-white/[0.06] transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>
              <PresetList activeId={activePreset} onPick={requestPreset} limit={4} />
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Background</div>
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
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Accent</div>
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
            </div>

            {(() => {
              const showTitle = content.showTitle !== false && !titleLocked;
              if (content.format === "product") {
                return (
                  <div>
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Title & footnote</div>
                    <p className="text-[11px] text-studio-muted leading-relaxed">
                      Available in the Blog format only.
                    </p>
                  </div>
                );
              }
              if (titleLocked) {
                return (
                  <div>
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Title & footnote</div>
                    <p className="text-[11px] text-studio-muted leading-relaxed">
                      Not available for a centered Big number block.
                    </p>
                  </div>
                );
              }
              return (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Title & footnote</span>
                    <span className="ml-auto"><Toggle on={showTitle} onChange={setInfographicShowTitle} /></span>
                  </div>
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
                      Hidden. Toggle on to add a title and footnote.
                    </p>
                  )}
                </div>
              );
            })()}

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Block</div>
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
            </div>
          </div>
        )}
      </Section>
      </div>

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
