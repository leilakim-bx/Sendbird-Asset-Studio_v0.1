"use client";

import type { ReactNode } from "react";
import { ChevronDown, Plus, X, Lightbulb } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { BAR_COLUMNS_MAX_ITEMS, STEP_MAX_ITEMS_PRODUCT } from "@/lib/infographic-block-limits";
import { generatedTrendAxisLabel } from "@/lib/infographic-labels";
import type { InfographicBlock, InfographicFormat, OrbitIconKey } from "@/lib/types/infographic";

// Matches the chat sidebar inputs: same-bg field defined by a border, ring on focus.
const inputCls =
  "w-full bg-studio-sidebar border border-studio-border rounded-lg px-2.5 py-1.5 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none focus:ring-1 focus:ring-studio-accent transition-colors";
const labelCls = "block text-[10px] text-studio-muted mb-1";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-2.5">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function AddRow({
  onClick,
  children,
  disabled,
  title,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-studio-border rounded-md text-[11px] transition-colors",
        disabled
          ? "cursor-not-allowed border-studio-border text-studio-muted/50"
          : "text-studio-muted hover:border-studio-accent hover:text-studio-accent",
      ].join(" ")}
    >
      <Plus size={11} />
      {children}
    </button>
  );
}

function ItemCard({ idx, onRemove, children }: { idx: number; onRemove?: () => void; children: ReactNode }) {
  // Mirrors the chat message card: elevated bg-studio-hover panel (no border),
  // rounded-lg, with a title + ✕ header. Inner inputs (bg-studio-sidebar) read
  // as the darker fields, same as chat.
  return (
    <div className="bg-studio-hover rounded-lg p-2.5 mb-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs font-medium text-studio-text flex-1">#{idx + 1}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            title="Remove"
            className="shrink-0 text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-5 h-5 flex items-center justify-center transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function num(v: string): number {
  if (v.trim() === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

type EditorProps = {
  block: InfographicBlock;
  onChange: (b: InfographicBlock) => void;
  /** Current canvas format — Product is fixed-height, so some blocks cap row count. */
  format: InfographicFormat;
};

/** Max compare rows in the fixed-height Product format (Blog has free height). */
const MAX_COMPARE_ROWS_PRODUCT = 6;

/** Hub title sits on one (nowrap) line under the logo — cap it so a long title
 *  never spills past the hub column / canvas edge. ~"Steward hub hub". */
const MAX_HUB_TITLE = 16;

const MAX_CARD_GRID_CARDS = 4;
const MAX_ORBIT_LABEL = 20;
const ORBIT_ICON_OPTIONS: Array<{ key: OrbitIconKey; label: string }> = [
  { key: "mobile", label: "Mobile" },
  { key: "chat", label: "Chat" },
  { key: "web", label: "Web" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "voice", label: "Voice" },
  { key: "audio", label: "Audio" },
  { key: "email", label: "Email" },
  { key: "site", label: "Site" },
];
const DEFAULT_ORBIT_NODES = [
  { label: "Detect" },
  { label: "Activate" },
  { label: "Orchestrate", highlight: true },
  { label: "Resolve" },
];
const DEFAULT_ORBIT_SATELLITES: Array<{ key: OrbitIconKey }> = [
  { key: "mobile" },
  { key: "web" },
  { key: "chat" },
  { key: "email" },
  { key: "whatsapp" },
  { key: "site" },
];

type DropdownOption<T extends string | number> = {
  value: T;
  label: string;
};

function SidebarDropdown<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<DropdownOption<T>>;
  onChange: (value: T) => void;
}) {
  const current = options.find((option) => option.value === value);

  return (
    <Menu.Root>
      <Menu.Trigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-studio-border bg-studio-sidebar px-2.5 py-1.5 text-xs text-studio-text hover:bg-studio-hover transition-colors outline-none focus:ring-1 focus:ring-studio-accent">
        <span className="font-medium">{current?.label ?? "Select"}</span>
        <ChevronDown size={14} className="text-studio-muted" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
          <Menu.Popup className="z-50 w-(--anchor-width) rounded-lg border border-studio-border bg-studio-sidebar shadow-lg py-1 outline-none origin-top data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 duration-100">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <Menu.Item
                  key={String(option.value)}
                  onClick={() => onChange(option.value)}
                  className={[
                    "text-xs px-3 py-1.5 cursor-default outline-none transition-colors data-[highlighted]:bg-studio-hover data-[highlighted]:text-white",
                    active ? "bg-studio-hover text-white" : "text-studio-text",
                  ].join(" ")}
                >
                  {option.label}
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function OrbitIconDropdown({
  value,
  onChange,
}: {
  value: OrbitIconKey;
  onChange: (value: OrbitIconKey) => void;
}) {
  return (
    <SidebarDropdown
      value={value}
      options={ORBIT_ICON_OPTIONS.map((option) => ({ value: option.key, label: option.label }))}
      onChange={onChange}
    />
  );
}

/** Per-type edit form shown when a block row is expanded. */
export function BlockEditor({ block, onChange, format }: EditorProps) {
  switch (block.type) {
    case "stat": {
      const b = block;
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });
      return (
        <>
          <Field label="Eyebrow">
            <input className={inputCls} value={b.eyebrow ?? ""} onChange={(e) => set({ eyebrow: e.target.value })} />
          </Field>
          <Field label="Number">
            <input className={inputCls} value={b.number} onChange={(e) => set({ number: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 mb-2.5 text-xs text-studio-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!b.highlightNumber}
              onChange={(e) => set({ highlightNumber: e.target.checked })}
              className="sb-checkbox"
            />
            Highlight number
          </label>
          <Field label="Label">
            <input className={inputCls} value={b.label ?? ""} onChange={(e) => set({ label: e.target.value })} />
          </Field>
        </>
      );
    }

    case "kpi-group": {
      const b = block;
      const setItems = (items: typeof b.items) => onChange({ ...b, items });
      return (
        <>
          {b.items.map((it, i) => (
            <ItemCard key={i} idx={i} onRemove={() => setItems(b.items.filter((_, j) => j !== i))}>
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Number"
                value={it.number}
                onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)))}
              />
              <input
                className={inputCls}
                placeholder="Label"
                value={it.label}
                onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
            </ItemCard>
          ))}
          {b.items.length < 4 && (
            <AddRow onClick={() => setItems([...b.items, { number: "00", label: "Label" }])}>Add KPI</AddRow>
          )}
        </>
      );
    }

    case "card-grid": {
      const b = block;
      const rawCards = b.cards.slice(0, MAX_CARD_GRID_CARDS);
      const badgesEnabled = rawCards.some((card) => !!card.badge?.trim());
      const cards = rawCards.map((card, i) => ({
        ...card,
        badge: badgesEnabled ? card.badge?.trim() || `Panel ${i + 1}` : "",
      }));
      const setCards = (next: typeof b.cards) => onChange({ ...b, cards: next.slice(0, MAX_CARD_GRID_CARDS) });
      const setBadgesEnabled = (enabled: boolean) =>
        setCards(
          cards.map((card, i) => ({
            ...card,
            badge: enabled ? card.badge?.trim() || `Panel ${i + 1}` : "",
          })),
        );
      return (
        <>
          <label className="mb-2.5 flex items-center gap-2 text-[11px] text-studio-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={badgesEnabled}
              onChange={(e) => setBadgesEnabled(e.target.checked)}
              className="sb-checkbox"
            />
            Use badges
          </label>
          {cards.map((card, i) => (
            <ItemCard
              key={i}
              idx={i}
              onRemove={cards.length > 1 ? () => setCards(cards.filter((_, j) => j !== i)) : undefined}
            >
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Title"
                maxLength={48}
                value={card.title}
                onChange={(e) =>
                  setCards(cards.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                }
              />
              <textarea
                className={inputCls + " resize-none min-h-16"}
                placeholder="Body"
                maxLength={170}
                value={card.body}
                onChange={(e) =>
                  setCards(cards.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))
                }
              />
              {badgesEnabled && (
                <input
                  className={inputCls + " mt-1.5"}
                  placeholder="Badge"
                  maxLength={18}
                  value={card.badge ?? ""}
                  onChange={(e) =>
                    setCards(cards.map((x, j) => (j === i ? { ...x, badge: e.target.value } : x)))
                  }
                />
              )}
            </ItemCard>
          ))}
          {cards.length < MAX_CARD_GRID_CARDS && (
            <AddRow
              onClick={() =>
                setCards([
                  ...cards,
                  {
                    badge: badgesEnabled ? `Panel ${cards.length + 1}` : "",
                    title: "Card title",
                    body: "Add one concise explanation for this card.",
                  },
                ])
              }
            >
              Add card
            </AddRow>
          )}
        </>
      );
    }

    case "bar-group": {
      const b = block;
      const variant = b.variant ?? "bars";
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });
      const setItems = (items: typeof b.items) => onChange({ ...b, items });
      const editableItems = variant === "columns" ? b.items.slice(0, BAR_COLUMNS_MAX_ITEMS) : b.items;
      const columnsAtLimit = variant === "columns" && b.items.length >= BAR_COLUMNS_MAX_ITEMS;
      const setVariant = (nextVariant: NonNullable<typeof b.variant>) => {
        set({
          variant: nextVariant,
          items: nextVariant === "columns" ? b.items.slice(0, BAR_COLUMNS_MAX_ITEMS) : b.items,
        });
      };
      return (
        <>
          <Field label="Shape">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
              {(["bars", "split", "columns", "ranked"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setVariant(opt)}
                  aria-pressed={variant === opt}
                  className={[
                    "flex-1 px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-colors",
                    variant === opt ? "bg-studio-hover text-studio-text" : "text-studio-muted hover:text-studio-text",
                  ].join(" ")}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Field>
          {variant !== "columns" && (
            <Field label="Unit">
              <input className={inputCls} value={b.unit ?? ""} onChange={(e) => set({ unit: e.target.value })} />
            </Field>
          )}
          {variant === "bars" && (
            <label className="flex items-center gap-2 mb-2.5 text-xs text-studio-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={b.labelInside === true}
                onChange={(e) => set({ labelInside: e.target.checked })}
                className="sb-checkbox"
              />
              Labels inside bars (+ top headers)
            </label>
          )}
          {(variant === "ranked" || (variant === "bars" && b.labelInside)) && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Category header (optional)">
                <input
                  className={inputCls}
                  placeholder="e.g. Industry"
                  value={b.labelA ?? ""}
                  onChange={(e) => set({ labelA: e.target.value })}
                />
              </Field>
              <Field label="Value header (optional)">
                <input
                  className={inputCls}
                  placeholder="e.g. Score"
                  value={b.labelB ?? ""}
                  onChange={(e) => set({ labelB: e.target.value })}
                />
              </Field>
            </div>
          )}
          {editableItems.map((it, i) => (
            <ItemCard key={i} idx={i} onRemove={() => setItems(editableItems.filter((_, j) => j !== i))}>
              {variant === "columns" && (
                <input
                  className={inputCls + " mb-1.5"}
                  placeholder="Heading inside (e.g. Lv.1)"
                  value={it.heading ?? ""}
                  onChange={(e) =>
                    setItems(editableItems.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))
                  }
                />
              )}
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Label"
                value={it.label}
                onChange={(e) => setItems(editableItems.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <div className={(variant === "bars" ? "grid grid-cols-2 gap-1.5" : "") + " mb-1.5"}>
                <input
                  className={inputCls}
                  type="number"
                  placeholder={variant === "bars" ? "Value A" : variant === "columns" ? "Height" : "Value"}
                  value={it.valueA}
                  onChange={(e) =>
                    setItems(editableItems.map((x, j) => (j === i ? { ...x, valueA: num(e.target.value) } : x)))
                  }
                />
                {variant === "bars" && (
                  <input
                    className={inputCls}
                    type="number"
                    placeholder="Value B"
                    value={it.valueB ?? ""}
                    onChange={(e) =>
                      setItems(
                        editableItems.map((x, j) =>
                          j === i ? { ...x, valueB: e.target.value === "" ? undefined : num(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                )}
              </div>
              {variant === "columns" && (
                <>
                  <input
                    className={inputCls + " mb-1.5"}
                    placeholder="Chip (optional)"
                    value={it.tag ?? ""}
                    onChange={(e) => setItems(editableItems.map((x, j) => (j === i ? { ...x, tag: e.target.value } : x)))}
                  />
                  <input
                    className={inputCls + " mb-1.5"}
                    placeholder="Description (optional)"
                    value={it.desc ?? ""}
                    onChange={(e) => setItems(editableItems.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
                  />
                </>
              )}
              <label className="flex items-center gap-2 text-[11px] text-studio-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!it.highlight}
                  onChange={(e) =>
                    setItems(editableItems.map((x, j) => (j === i ? { ...x, highlight: e.target.checked } : x)))
                  }
                  className="sb-checkbox"
                />
                {variant === "split" ? "Highlight number" : variant === "columns" ? "Highlight column" : "Highlight row"}
              </label>
            </ItemCard>
          ))}
          <AddRow
            onClick={() => {
              if (columnsAtLimit) return;
              setItems([...editableItems, { label: "Row", valueA: 50, valueB: 50 }]);
            }}
            disabled={columnsAtLimit}
            title={columnsAtLimit ? `Columns can have up to ${BAR_COLUMNS_MAX_ITEMS} items.` : undefined}
          >
            {variant === "split" ? "Add segment" : variant === "columns" ? "Add column" : "Add bar"}
          </AddRow>
        </>
      );
    }

    case "step": {
      const b = block;
      const productLimited = format === "product";
      const editableItems = productLimited ? b.items.slice(0, STEP_MAX_ITEMS_PRODUCT) : b.items;
      const stepsAtLimit = productLimited && b.items.length >= STEP_MAX_ITEMS_PRODUCT;
      const setItems = (items: typeof b.items) =>
        onChange({ ...b, items: productLimited ? items.slice(0, STEP_MAX_ITEMS_PRODUCT) : items });
      return (
        <>
          {editableItems.map((it, i) => (
            <ItemCard key={i} idx={i} onRemove={() => setItems(b.items.filter((_, j) => j !== i))}>
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Title"
                value={it.title}
                onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              />
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Description"
                value={it.desc ?? ""}
                onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
              />
              <input
                className={inputCls}
                placeholder="Badge (optional)"
                value={it.badge ?? ""}
                onChange={(e) =>
                  setItems(b.items.map((x, j) => (j === i ? { ...x, badge: e.target.value || undefined } : x)))
                }
              />
            </ItemCard>
          ))}
          <AddRow
            onClick={() => {
              if (stepsAtLimit) return;
              setItems([...editableItems, { title: "Step", desc: "" }]);
            }}
            disabled={stepsAtLimit}
            title={stepsAtLimit ? `Product feature steps can have up to ${STEP_MAX_ITEMS_PRODUCT} items.` : undefined}
          >
            Add step
          </AddRow>
        </>
      );
    }

    case "stack": {
      const b = block;
      const layers = b.layers ?? [];
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });
      const setLayers = (next: typeof layers) => onChange({ ...b, layers: next });
      const patchLayer = (i: number, patch: Partial<(typeof layers)[number]>) =>
        setLayers(layers.map((x, k) => (k === i ? { ...x, ...patch } : x)));
      const patchCell = (i: number, j: number, patch: { title?: string; desc?: string }) =>
        setLayers(
          layers.map((x, k) =>
            k === i ? { ...x, cells: (x.cells ?? []).map((c, m) => (m === j ? { ...c, ...patch } : c)) } : x,
          ),
        );
      return (
        <>
          {layers.map((layer, i) => {
            const cells = layer.cells ?? [];
            return (
              <ItemCard key={i} idx={i} onRemove={() => setLayers(layers.filter((_, k) => k !== i))}>
                <input
                  className={inputCls + " mb-1.5"}
                  placeholder="Layer header (e.g. Intelligence)"
                  value={layer.title}
                  onChange={(e) => patchLayer(i, { title: e.target.value })}
                />
                <input
                  className={inputCls + " mb-1.5"}
                  placeholder="Caption (optional)"
                  value={layer.caption ?? ""}
                  onChange={(e) => patchLayer(i, { caption: e.target.value || undefined })}
                />
                <label className="flex items-center gap-2 mb-2 text-[11px] text-studio-text cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!layer.highlight}
                    onChange={(e) => patchLayer(i, { highlight: e.target.checked })}
                    className="sb-checkbox"
                  />
                  Highlight this layer
                </label>
                {/* Cells — a row of boxes inside the band. Optional. */}
                {cells.map((cell, j) => (
                  <div key={j} className="rounded-md border border-studio-border p-2 mb-1.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] text-studio-muted flex-1">Cell {j + 1}</span>
                      <button
                        onClick={() =>
                          patchLayer(i, { cells: cells.filter((_, m) => m !== j) })
                        }
                        title="Remove cell"
                        className="shrink-0 text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-4 h-4 flex items-center justify-center transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <input
                      className={inputCls + " mb-1.5"}
                      placeholder="Cell title"
                      value={cell.title}
                      onChange={(e) => patchCell(i, j, { title: e.target.value })}
                    />
                    <input
                      className={inputCls}
                      placeholder="Cell description (optional)"
                      value={cell.desc ?? ""}
                      onChange={(e) => patchCell(i, j, { desc: e.target.value || undefined })}
                    />
                  </div>
                ))}
                <AddRow onClick={() => patchLayer(i, { cells: [...cells, { title: "Item" }] })}>Add cell</AddRow>
              </ItemCard>
            );
          })}
          <AddRow onClick={() => setLayers([...layers, { title: "Layer", cells: [] }])}>Add layer</AddRow>
          <label className="flex items-center gap-2 mt-2.5 mb-2.5 text-xs text-studio-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={b.connectors !== false}
              onChange={(e) => set({ connectors: e.target.checked })}
              className="sb-checkbox"
            />
            Connector lines
          </label>
          <Field label="Callout (optional)">
            <input
              className={inputCls}
              placeholder="Dark box below the stack"
              value={b.callout ?? ""}
              onChange={(e) => set({ callout: e.target.value || undefined })}
            />
          </Field>
        </>
      );
    }

    case "node-list": {
      const b = block;
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });
      const setItems = (items: typeof b.items) => onChange({ ...b, items });
      return (
        <>
          <Field label={`Hub title (max ${MAX_HUB_TITLE})`}>
            <input
              className={inputCls}
              value={b.hubTitle}
              maxLength={MAX_HUB_TITLE}
              onChange={(e) => set({ hubTitle: e.target.value })}
            />
          </Field>
          <Field label="Hub subtitle">
            <input className={inputCls} value={b.hubSub ?? ""} onChange={(e) => set({ hubSub: e.target.value })} />
          </Field>
          {b.items.map((it, i) => (
            <ItemCard key={i} idx={i} onRemove={() => setItems(b.items.filter((_, j) => j !== i))}>
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Label"
                value={it.label}
                onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Description"
                value={it.desc ?? ""}
                onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
              />
              <input
                className={inputCls}
                placeholder="Tag (optional)"
                value={it.tag ?? ""}
                onChange={(e) =>
                  setItems(b.items.map((x, j) => (j === i ? { ...x, tag: e.target.value || undefined } : x)))
                }
              />
            </ItemCard>
          ))}
          <AddRow onClick={() => setItems([...b.items, { label: "Node" }])}>Add node</AddRow>
        </>
      );
    }

    case "orbit": {
      const b = block;
      const variant = b.variant;
      const nodes = b.nodes?.length ? b.nodes : DEFAULT_ORBIT_NODES;
      const satellites = b.satellites?.length ? b.satellites : DEFAULT_ORBIT_SATELLITES;
      const setVariant = (next: typeof b.variant) => {
        if (next === "cycle") {
          onChange({ ...b, variant: "cycle", center: b.center || "delight", nodes });
        } else {
          onChange({ ...b, variant: "hub-spoke", center: b.center || "delight", satellites });
        }
      };
      const setNodes = (next: typeof nodes) => onChange({ ...b, nodes: next });
      const setSatellites = (next: typeof satellites) => onChange({ ...b, satellites: next });
      return (
        <>
          <Field label="Shape">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
              {(["cycle", "hub-spoke"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setVariant(opt)}
                  aria-pressed={variant === opt}
                  className={[
                    "flex-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors",
                    variant === opt ? "bg-studio-hover text-studio-text" : "text-studio-muted hover:text-studio-text",
                  ].join(" ")}
                >
                  {opt === "hub-spoke" ? "Hub" : "Cycle"}
                </button>
              ))}
            </div>
          </Field>
          {variant === "cycle" ? (
            <>
              {nodes.map((node, i) => (
                <ItemCard
                  key={i}
                  idx={i}
                  onRemove={nodes.length > 3 ? () => setNodes(nodes.filter((_, j) => j !== i)) : undefined}
                >
                  <input
                    className={inputCls + " mb-1.5"}
                    placeholder="Step label"
                    maxLength={MAX_ORBIT_LABEL}
                    value={node.label}
                    onChange={(e) =>
                      setNodes(nodes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                    }
                  />
                  <label className="flex items-center gap-2 text-[11px] text-studio-text cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!node.highlight}
                      onChange={(e) =>
                        setNodes(nodes.map((x, j) => (j === i ? { ...x, highlight: e.target.checked } : x)))
                      }
                      className="sb-checkbox"
                    />
                    Highlight node
                  </label>
                </ItemCard>
              ))}
              {nodes.length < 8 && (
                <AddRow onClick={() => setNodes([...nodes, { label: "Step" }])}>Add cycle node</AddRow>
              )}
            </>
          ) : (
            <>
              {satellites.map((satellite, i) => (
                <ItemCard
                  key={i}
                  idx={i}
                  onRemove={
                    satellites.length > 3 ? () => setSatellites(satellites.filter((_, j) => j !== i)) : undefined
                  }
                >
                  <OrbitIconDropdown
                    value={satellite.key}
                    onChange={(value) =>
                      setSatellites(
                        satellites.map((x, j) =>
                          j === i ? { key: value } : x,
                        ),
                      )
                    }
                  />
                </ItemCard>
              ))}
              {satellites.length < 8 && (
                <AddRow onClick={() => setSatellites([...satellites, { key: "site" }])}>Add satellite</AddRow>
              )}
            </>
          )}
        </>
      );
    }

    case "compare": {
      const b = block;
      const layout = b.layout ?? "cards";
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });
      const setRows = (rows: typeof b.rows) => onChange({ ...b, rows });
      return (
        <>
          <Field label="Layout">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
              {(["cards", "table"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => set({ layout: opt })}
                  aria-pressed={layout === opt}
                  className={[
                    "flex-1 px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-colors",
                    layout === opt ? "bg-studio-hover text-studio-text" : "text-studio-muted hover:text-studio-text",
                  ].join(" ")}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Column A">
              <input className={inputCls} value={b.columnA} onChange={(e) => set({ columnA: e.target.value })} />
            </Field>
            <Field label="Column B">
              <input className={inputCls} value={b.columnB} onChange={(e) => set({ columnB: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 mb-2.5 text-xs text-studio-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!b.highlightB}
              onChange={(e) => set({ highlightB: e.target.checked })}
              className="sb-checkbox"
            />
            Highlight column B
          </label>
          {layout === "cards" && (
            <label className="flex items-center gap-2 mb-2.5 text-xs text-studio-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={b.bullets !== false}
                onChange={(e) => set({ bullets: e.target.checked })}
                className="sb-checkbox"
              />
              Bullet points
            </label>
          )}
          {b.rows.map((r, i) => (
            <ItemCard key={i} idx={i} onRemove={() => setRows(b.rows.filter((_, j) => j !== i))}>
              {layout === "table" && (
                <input
                  className={inputCls + " mb-1.5"}
                  placeholder="Row label"
                  value={r.label ?? ""}
                  onChange={(e) => setRows(b.rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                />
              )}
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  className={inputCls}
                  placeholder={b.columnA || "A"}
                  value={r.a}
                  onChange={(e) => setRows(b.rows.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                />
                <input
                  className={inputCls}
                  placeholder={b.columnB || "B"}
                  value={r.b}
                  onChange={(e) => setRows(b.rows.map((x, j) => (j === i ? { ...x, b: e.target.value } : x)))}
                />
              </div>
            </ItemCard>
          ))}
          {format === "product" && b.rows.length >= MAX_COMPARE_ROWS_PRODUCT ? (
            <p className="text-[11px] text-studio-muted leading-relaxed px-0.5">
              Product format is a fixed height, so it fits up to {MAX_COMPARE_ROWS_PRODUCT} rows. Switch to
              Blog/Perspective to add more.
            </p>
          ) : (
            <AddRow onClick={() => setRows([...b.rows, { label: "", a: "", b: "" }])}>Add row</AddRow>
          )}
        </>
      );
    }

    case "line-chart": {
      const b = block;
      const hasB = !!b.seriesB;
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });
      const setPoint = (i: number, patch: { x?: string; a?: number; bv?: number }) => {
        const xLabels = patch.x !== undefined ? b.xLabels.map((v, j) => (j === i ? patch.x! : v)) : b.xLabels;
        const aVals =
          patch.a !== undefined ? b.seriesA.values.map((v, j) => (j === i ? patch.a! : v)) : b.seriesA.values;
        const bVals =
          b.seriesB && patch.bv !== undefined
            ? b.seriesB.values.map((v, j) => (j === i ? patch.bv! : v))
            : b.seriesB?.values;
        onChange({
          ...b,
          xLabels,
          seriesA: { ...b.seriesA, values: aVals },
          seriesB: b.seriesB && bVals ? { ...b.seriesB, values: bVals } : b.seriesB,
        });
      };
      const removePoint = (i: number) =>
        onChange({
          ...b,
          xLabels: b.xLabels.filter((_, j) => j !== i),
          seriesA: { ...b.seriesA, values: b.seriesA.values.filter((_, j) => j !== i) },
          seriesB: b.seriesB
            ? { ...b.seriesB, values: b.seriesB.values.filter((_, j) => j !== i) }
            : undefined,
        });
      const addPoint = () =>
        onChange({
          ...b,
          xLabels: [...b.xLabels, generatedTrendAxisLabel(undefined, b.xLabels.length)],
          seriesA: { ...b.seriesA, values: [...b.seriesA.values, 0] },
          seriesB: b.seriesB ? { ...b.seriesB, values: [...b.seriesB.values, 0] } : undefined,
        });
      const toggleB = (on: boolean) =>
        onChange({
          ...b,
          seriesB: on ? { label: "Line B", values: b.xLabels.map(() => 0) } : undefined,
        });
      return (
        <>
          <div className="mb-3 flex items-start gap-2 rounded-md border border-studio-accent/30 bg-studio-accent/[0.08] px-2.5 py-2">
            <Lightbulb size={13} className="text-studio-accent shrink-0 mt-px" />
            <span className="text-[11px] text-studio-text leading-snug">
              <span className="font-semibold">Tip!</span> Line charts look best on the 3rd background (Warm gray).
            </span>
          </div>
          <Field label="Line A label">
            <input
              className={inputCls}
              value={b.seriesA.label}
              onChange={(e) => set({ seriesA: { ...b.seriesA, label: e.target.value } })}
            />
          </Field>
          <label className="flex items-center gap-2 mb-2.5 text-xs text-studio-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasB}
              onChange={(e) => toggleB(e.target.checked)}
              className="sb-checkbox"
            />
            Compare a second line
          </label>
          {b.seriesB && (
            <Field label="Line B label">
              <input
                className={inputCls}
                value={b.seriesB.label}
                onChange={(e) => set({ seriesB: { ...b.seriesB!, label: e.target.value } })}
              />
            </Field>
          )}
          <label className="flex items-center gap-2 mb-2.5 text-xs text-studio-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={b.fill !== false}
              onChange={(e) => set({ fill: e.target.checked })}
              className="sb-checkbox"
            />
            Area fill under line A
          </label>
          {b.xLabels.map((x, i) => (
            <ItemCard key={i} idx={i} onRemove={() => removePoint(i)}>
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Label, e.g. 2024, Q1, Week 3"
                value={x}
                onChange={(e) => setPoint(i, { x: e.target.value })}
              />
              <div className={hasB ? "grid grid-cols-2 gap-1.5" : ""}>
                <input
                  className={inputCls}
                  type="number"
                  placeholder={b.seriesA.label || "A"}
                  value={b.seriesA.values[i] ?? 0}
                  onChange={(e) => setPoint(i, { a: num(e.target.value) })}
                />
                {hasB && (
                  <input
                    className={inputCls}
                    type="number"
                    placeholder={b.seriesB!.label || "B"}
                    value={b.seriesB!.values[i] ?? 0}
                    onChange={(e) => setPoint(i, { bv: num(e.target.value) })}
                  />
                )}
              </div>
            </ItemCard>
          ))}
          <AddRow onClick={addPoint}>Add point</AddRow>
        </>
      );
    }
    case "stacked-bar": {
      const b = block;
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });

      const setSeriesLabel = (si: number, label: string) =>
        set({ series: b.series.map((s, j) => (j === si ? label : s)) });
      const addSeries = () =>
        onChange({
          ...b,
          series: [...b.series, `Series ${String.fromCharCode(65 + b.series.length)}`],
          rows: b.rows.map((r) => ({ ...r, values: [...r.values, 0] })),
        });
      const removeSeries = (si: number) => {
        if (b.series.length <= 1) return;
        // Removing a series shifts later indices — keep accentIndex pointing at
        // the same series (clear it if it was the one removed).
        const accent =
          b.accentIndex === undefined
            ? undefined
            : b.accentIndex === si
              ? undefined
              : b.accentIndex > si
                ? b.accentIndex - 1
                : b.accentIndex;
        onChange({
          ...b,
          series: b.series.filter((_, j) => j !== si),
          rows: b.rows.map((r) => ({ ...r, values: r.values.filter((_, j) => j !== si) })),
          accentIndex: accent,
        });
      };

      const setRowLabel = (ri: number, label: string) =>
        set({ rows: b.rows.map((r, j) => (j === ri ? { ...r, label } : r)) });
      const setValue = (ri: number, si: number, v: number) =>
        set({
          rows: b.rows.map((r, j) =>
            j === ri ? { ...r, values: r.values.map((x, k) => (k === si ? v : x)) } : r,
          ),
        });
      const addRow = () =>
        set({ rows: [...b.rows, { label: `Row ${b.rows.length + 1}`, values: b.series.map(() => 0) }] });
      const removeRow = (ri: number) => set({ rows: b.rows.filter((_, j) => j !== ri) });

      const layout = b.layout ?? "stacked";
      return (
        <>
          <Field label="Layout">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0E0E0E]">
              {(["stacked", "grouped"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => set({ layout: opt })}
                  aria-pressed={layout === opt}
                  className={[
                    "flex-1 px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-colors",
                    layout === opt ? "bg-studio-hover text-studio-text" : "text-studio-muted hover:text-studio-text",
                  ].join(" ")}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Unit (optional, e.g. % or k)">
            <input className={inputCls} value={b.unit ?? ""} onChange={(e) => set({ unit: e.target.value })} />
          </Field>
          {layout === "stacked" && (
            <label className="flex items-center gap-2 mb-2.5 text-xs text-studio-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={b.normalize === true}
                onChange={(e) => set({ normalize: e.target.checked })}
                className="sb-checkbox"
              />
              Stretch every row to 100%
            </label>
          )}
          <Field label="Accent series (lime)">
            <SidebarDropdown
              value={b.accentIndex ?? -1}
              options={[
                { value: -1, label: "None (all grayscale)" },
                ...b.series.map((series, index) => ({
                  value: index,
                  label: series || `Series ${index + 1}`,
                })),
              ]}
              onChange={(next) => set({ accentIndex: next < 0 ? undefined : next })}
            />
          </Field>

          <div className={labelCls + " mt-1"}>Series</div>
          {b.series.map((s, si) => (
            <div key={si} className="flex items-center gap-1.5 mb-1.5">
              <input
                className={inputCls}
                value={s}
                onChange={(e) => setSeriesLabel(si, e.target.value)}
              />
              <button
                onClick={() => removeSeries(si)}
                disabled={b.series.length <= 1}
                title="Remove series"
                className="shrink-0 text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-6 h-6 flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <div className="mb-3">
            <AddRow onClick={addSeries}>Add series</AddRow>
          </div>

          {b.rows.map((row, ri) => (
            <ItemCard key={ri} idx={ri} onRemove={() => removeRow(ri)}>
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Row label (e.g. Q1)"
                value={row.label}
                onChange={(e) => setRowLabel(ri, e.target.value)}
              />
              {b.series.map((sName, si) => (
                <div key={si} className="grid grid-cols-[1fr_76px] gap-1.5 items-center mb-1.5 last:mb-0">
                  <span className="text-[10px] text-studio-muted truncate">{sName || `Series ${si + 1}`}</span>
                  <input
                    className={inputCls}
                    type="number"
                    value={row.values[si] ?? 0}
                    onChange={(e) => setValue(ri, si, num(e.target.value))}
                  />
                </div>
              ))}
            </ItemCard>
          ))}
          <AddRow onClick={addRow}>Add row</AddRow>
        </>
      );
    }
  }
}
