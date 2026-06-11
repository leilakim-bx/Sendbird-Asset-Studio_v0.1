"use client";

import { useState, useRef, type ReactNode } from "react";
import {
  Check,
  Sparkles,
  Plus,
  Info,
  CircleAlert,
  ChevronDown,
} from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { useEditorStore } from "@/lib/store";
import {
  INFOGRAPHIC_ACCENT_HEX,
  type InfographicAccent,
  type InfographicBlock,
  type InfographicBlockType,
  type InfographicContent,
  type InfographicFormat,
  type OrbitIconKey,
} from "@/lib/types/infographic";
import { createBlock } from "@/lib/infographic-presets";
import { type ArticleImageCandidate } from "@/lib/infographic-article-extractor";
import { AiMagicButton } from "@/components/ui/ai-magic-button";
import { Section } from "./sidebar/Section";
import { BlockEditor } from "./sidebar/BlockEditor";

const ACCENT_OPTIONS: InfographicAccent[] = ["lime", "blue", "red", "green"];

const FORMAT_OPTIONS: { id: InfographicFormat; label: string }[] = [
  { id: "product", label: "Product feature" },
  { id: "blog", label: "Blog/Perspective" },
];

const SOURCE_TEMPLATE = "Article:\n[paste article URL or full article]\n\nImage notes:\n1. \n2. \n3. ";
const IMAGE_NOTES_TEMPLATE = "Image notes:\n1. \n2. \n3. ";
const HUB_ORBIT_DEFAULT_FOOTNOTE = "Channels orbit the agent";

const TYPE_OPTIONS: { id: InfographicBlockType; label: string }[] = [
  { id: "orbit", label: "Orbit diagram" },
  { id: "card-grid", label: "Card grid" },
  { id: "stat", label: "Big number" },
  { id: "kpi-group", label: "Metrics" },
  { id: "bar-group", label: "Bar chart" },
  { id: "stacked-bar", label: "Multi-series bar" },
  { id: "compare", label: "Comparison" },
  { id: "step", label: "Steps" },
  { id: "line-chart", label: "Trend" },
  { id: "node-list", label: "Hub map" },
  { id: "stack", label: "Layer diagram" },
];

const ORBIT_ICON_LABELS: Record<OrbitIconKey, string> = {
  mobile: "Mobile",
  voice: "Voice",
  whatsapp: "WhatsApp",
  email: "Email",
  chat: "Chat",
  web: "Web",
  audio: "Audio",
  site: "Site",
};

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
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-64 -translate-x-1/2 rounded-md border border-studio-border bg-studio-bg px-2.5 py-2 text-left text-[11px] font-normal leading-snug text-studio-text opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <span className="block">
          Protected URLs cannot be read. If a link requires login, paste the article text or use a share link Studio can access.
        </span>
        <span className="mt-1 block">
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
  return TYPE_OPTIONS.find((item) => item.id === type)?.label ?? "Image";
}

function TypeDropdown({
  value,
  onChange,
}: {
  value: InfographicBlockType;
  onChange: (type: InfographicBlockType) => void;
}) {
  const current = TYPE_OPTIONS.find((item) => item.id === value);

  return (
    <Menu.Root>
      <Menu.Trigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-studio-border bg-studio-sidebar px-2.5 py-1.5 text-xs text-studio-text hover:bg-studio-hover transition-colors outline-none focus:ring-1 focus:ring-studio-accent">
        <span className="font-medium">{current?.label ?? "Select"}</span>
        <ChevronDown size={14} className="text-studio-muted" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
          <Menu.Popup className="z-50 w-(--anchor-width) rounded-lg border border-studio-border bg-studio-sidebar shadow-lg py-1 outline-none origin-top data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
            {TYPE_OPTIONS.map((item) => {
              const active = item.id === value;
              return (
                <Menu.Item
                  key={item.id}
                  onClick={() => onChange(item.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-studio-text cursor-default outline-none transition-colors data-[highlighted]:bg-studio-hover data-[highlighted]:text-white rounded-md mx-1"
                >
                  <span className="w-4 shrink-0">
                    {active && <Check size={13} className="text-studio-accent" />}
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

type PortableRow = {
  label: string;
  value: number;
  valueText?: string;
  desc?: string;
  highlight?: boolean;
};

function parsePortableNumber(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPortableNumber(value: number, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim();
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(1)));
}

function compactLabel(label: string | undefined, fallback: string): string {
  const trimmed = label?.trim();
  return trimmed ? trimmed : fallback;
}

function rowsFromBlock(block: InfographicBlock): PortableRow[] {
  switch (block.type) {
    case "stat":
      return [
        {
          label: compactLabel(block.label || block.eyebrow, "Value"),
          value: parsePortableNumber(block.number),
          valueText: block.number,
          highlight: block.highlightNumber,
        },
      ];
    case "kpi-group":
      return block.items.map((item, index) => ({
        label: compactLabel(item.label, `Metric ${index + 1}`),
        value: parsePortableNumber(item.number),
        valueText: item.number,
      }));
    case "card-grid":
      return block.cards.map((card, index) => ({
        label: compactLabel(card.title, `Card ${index + 1}`),
        value: index + 1,
        valueText: card.badge,
        desc: card.body,
      }));
    case "bar-group":
      return block.items.map((item, index) => ({
        label: compactLabel(item.label, `Row ${index + 1}`),
        value: item.valueA,
        valueText: block.unit ? `${item.valueA}${block.unit}` : String(item.valueA),
        desc: item.desc,
        highlight: item.highlight,
      }));
    case "stacked-bar":
      return block.rows.map((row, index) => {
        const value = row.values.reduce((sum, current) => sum + current, 0);
        return {
          label: compactLabel(row.label, `Row ${index + 1}`),
          value,
          valueText: block.unit ? `${value}${block.unit}` : String(value),
        };
      });
    case "compare":
      return block.rows.map((row, index) => {
        const label = compactLabel(row.label || row.b || row.a, `Row ${index + 1}`);
        const valueText = row.b.match(/-?\d[\d,.]*(?:\.\d+)?%?/)?.[0] ?? row.a.match(/-?\d[\d,.]*(?:\.\d+)?%?/)?.[0];
        return {
          label,
          value: parsePortableNumber(valueText) || index + 1,
          valueText,
          desc: [row.a, row.b].filter(Boolean).join(" -> "),
        };
      });
    case "step":
      return block.items.map((item, index) => ({
        label: compactLabel(item.title, `Step ${index + 1}`),
        value: index + 1,
        valueText: item.badge,
        desc: item.desc,
      }));
    case "stack":
      return block.layers.map((layer, index) => ({
        label: compactLabel(layer.title, `Layer ${index + 1}`),
        value: index + 1,
        desc: layer.caption,
        highlight: layer.highlight,
      }));
    case "node-list":
      return block.items.map((item, index) => ({
        label: compactLabel(item.label, `Node ${index + 1}`),
        value: index + 1,
        valueText: item.tag,
        desc: item.desc,
      }));
    case "line-chart":
      return block.xLabels.map((label, index) => ({
        label: compactLabel(label, `Point ${index + 1}`),
        value: block.seriesA.values[index] ?? 0,
        valueText: String(block.seriesA.values[index] ?? 0),
      }));
    case "orbit":
      if (block.variant === "hub-spoke") {
        return (block.satellites ?? []).map((satellite, index) => ({
          label: ORBIT_ICON_LABELS[satellite.key] ?? `Channel ${index + 1}`,
          value: index + 1,
          valueText: satellite.key,
        }));
      }
      return (block.nodes ?? []).map((node, index) => ({
        label: compactLabel(node.label, `Step ${index + 1}`),
        value: index + 1,
        highlight: node.highlight,
      }));
  }
}

function portableRows(block: InfographicBlock): PortableRow[] {
  const rows = rowsFromBlock(block).filter((row) => row.label.trim() || row.valueText?.trim() || row.value);
  return rows.length ? rows : [{ label: "Value", value: 0, valueText: "0" }];
}

function inferSharedUnit(rows: PortableRow[]): string {
  const valueTexts = rows.map((row) => row.valueText?.trim()).filter(Boolean) as string[];
  if (valueTexts.length > 0 && valueTexts.every((value) => value.includes("%"))) return "%";
  return "";
}

function convertBlock(block: InfographicBlock, type: InfographicBlockType, title?: string): InfographicBlock {
  if (block.type === type) return block;

  const rows = portableRows(block);
  const unit = inferSharedUnit(rows);
  const id = createBlock(type).id;

  switch (type) {
    case "stat": {
      const first = rows[0];
      return {
        id,
        type: "stat",
        eyebrow: "",
        number: formatPortableNumber(first.value, first.valueText),
        highlightNumber: true,
        label: first.label,
      };
    }
    case "kpi-group":
      return {
        id,
        type: "kpi-group",
        items: rows.slice(0, 4).map((row) => ({
          number: formatPortableNumber(row.value, row.valueText),
          label: row.label,
        })),
      };
    case "card-grid":
      return {
        id,
        type: "card-grid",
        cards: rows.slice(0, 4).map((row, index) => ({
          badge: row.valueText || `Panel ${index + 1}`,
          title: row.label,
          body: row.desc || formatPortableNumber(row.value, row.valueText),
        })),
      };
    case "bar-group":
      return {
        id,
        type: "bar-group",
        variant: "ranked",
        labelA: "",
        labelB: "",
        unit,
        items: rows.slice(0, 6).map((row, index) => ({
          label: row.label,
          valueA: row.value,
          highlight: row.highlight ?? index === 0,
        })),
      };
    case "stacked-bar":
      return {
        id,
        type: "stacked-bar",
        series: ["Value"],
        unit,
        rows: rows.slice(0, 6).map((row) => ({ label: row.label, values: [row.value] })),
      };
    case "compare":
      return {
        id,
        type: "compare",
        layout: "table",
        columnA: "Item",
        columnB: "Value",
        highlightB: true,
        rows: rows.slice(0, 6).map((row) => ({
          label: "",
          a: row.label,
          b: formatPortableNumber(row.value, row.valueText),
        })),
      };
    case "step":
      return {
        id,
        type: "step",
        items: rows.slice(0, 5).map((row) => ({
          title: row.label,
          desc: row.desc || formatPortableNumber(row.value, row.valueText),
        })),
      };
    case "line-chart":
      return {
        id,
        type: "line-chart",
        xLabels: rows.slice(0, 8).map((row) => row.label),
        seriesA: { label: title || "Value", values: rows.slice(0, 8).map((row) => row.value) },
        fill: true,
      };
    case "node-list":
      return {
        id,
        type: "node-list",
        hubTitle: title?.trim() || "Hub",
        hubSub: "",
        items: rows.slice(0, 6).map((row) => ({
          label: row.label,
          tag: row.valueText,
          desc: row.desc,
        })),
      };
    case "stack":
      return {
        id,
        type: "stack",
        layers: rows.slice(0, 5).map((row, index) => ({
          title: row.label,
          caption: row.desc || formatPortableNumber(row.value, row.valueText),
          highlight: row.highlight ?? index === 0,
          cells: [],
        })),
      };
    case "orbit":
      return {
        id,
        type: "orbit",
        variant: "cycle",
        center: title?.trim() || "delight",
        nodes: rows.slice(0, 8).map((row, index) => ({
          label: row.label,
          highlight: row.highlight ?? index === 0,
        })),
      };
  }
}

function usesDetailedBlockEditor(type: InfographicBlockType): boolean {
  return (
    type === "bar-group" ||
    type === "stacked-bar" ||
    type === "node-list" ||
    type === "stack" ||
    type === "orbit" ||
    type === "card-grid"
  );
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
  const setBlock = (next: InfographicBlock) => {
    const shouldSeedHubFootnote =
      next.type === "orbit" && next.variant === "hub-spoke" && !(content.footnote ?? "").trim();
    onChange({
      ...content,
      footnote: shouldSeedHubFootnote ? HUB_ORBIT_DEFAULT_FOOTNOTE : content.footnote,
      blocks: [next],
    });
  };
  const setType = (type: InfographicBlockType) => {
    if (!block || block.type === type) return;
    onChange({
      ...content,
      showTitle: type === "stat" ? false : content.showTitle,
      blocks: [convertBlock(block, type, content.title)],
    });
  };

  if (!block) {
    return <p className="text-[11px] text-studio-muted leading-relaxed">Pick an article image or preset to edit.</p>;
  }

  return (
    <>
      <SimpleField label="Title">
        <input className={inputCls} value={content.title ?? ""} onChange={(event) => setTitle(event.target.value)} />
      </SimpleField>

      <SimpleField label="Type">
        <TypeDropdown value={block.type} onChange={setType} />
      </SimpleField>

      {usesDetailedBlockEditor(block.type) && (
        <BlockEditor block={block} onChange={setBlock} format={content.format} />
      )}

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

    </>
  );
}

/** Resizable panel bounds (mirrors the chat FormPanel). Width is session-only. */
const DEFAULT_PANEL_W = 320; // = the previous fixed w-80
const MIN_PANEL_W = 240;
const MAX_PANEL_W = 520;

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
    setInfographicAccent,
    setInfographicTitle,
    setInfographicFootnote,
    setInfographicShowTitle,
  } = useEditorStore();

  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_W);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Source suggestions state ──
  const [article, setArticle] = useState("");
  const [articleNotice, setArticleNotice] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleUseTemplate}
            disabled={sourceLoading}
            className="text-[11px] font-medium text-studio-muted transition-colors hover:text-studio-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add image notes
          </button>
          <AiMagicButton
            label="Generate images from source"
            loading={sourceLoading}
            disabled={sourceLoading}
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
            Accent and title settings are hidden by default.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
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
              if (content.format === "product") {
                return (
                  <div>
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-studio-muted">Footnote</div>
                    <textarea
                      className={inputCls + " resize-none min-h-12"}
                      value={content.footnote ?? ""}
                      placeholder="Optional source or note shown at the bottom"
                      onChange={(e) => setInfographicFootnote(e.target.value)}
                    />
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
          </div>
        )}
      </Section>
      </div>
    </div>
  );
}
