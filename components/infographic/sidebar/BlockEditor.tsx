"use client";

import type { ReactNode } from "react";
import { Plus, X, Lightbulb } from "lucide-react";
import type { InfographicBlock } from "@/lib/types/infographic";

const inputCls =
  "w-full bg-[#0E0E0E] border border-studio-border rounded-md px-2.5 py-1.5 text-xs text-studio-text outline-none focus:border-studio-accent transition-colors placeholder:text-[#555]";
const labelCls = "block text-[10px] text-studio-muted mb-1";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-2.5">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function AddRow({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-studio-border rounded-md text-[11px] text-studio-muted hover:border-studio-accent hover:text-studio-accent transition-colors"
    >
      <Plus size={11} />
      {children}
    </button>
  );
}

function ItemCard({ idx, onRemove, children }: { idx: number; onRemove: () => void; children: ReactNode }) {
  return (
    <div className="mb-2 rounded-md border border-studio-border p-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-studio-muted">#{idx + 1}</span>
        <button onClick={onRemove} className="text-studio-muted hover:text-studio-text transition-colors" title="Remove">
          <X size={12} />
        </button>
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

type EditorProps = { block: InfographicBlock; onChange: (b: InfographicBlock) => void };

/** Per-type edit form shown when a block row is expanded. */
export function BlockEditor({ block, onChange }: EditorProps) {
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
              className="accent-studio-accent"
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
          <AddRow onClick={() => setItems([...b.items, { number: "00", label: "Label" }])}>Add KPI</AddRow>
        </>
      );
    }

    case "bar-group": {
      const b = block;
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });
      const setItems = (items: typeof b.items) => onChange({ ...b, items });
      return (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Label A">
              <input className={inputCls} value={b.labelA ?? ""} onChange={(e) => set({ labelA: e.target.value })} />
            </Field>
            <Field label="Label B">
              <input className={inputCls} value={b.labelB ?? ""} onChange={(e) => set({ labelB: e.target.value })} />
            </Field>
            <Field label="Unit">
              <input className={inputCls} value={b.unit ?? ""} onChange={(e) => set({ unit: e.target.value })} />
            </Field>
          </div>
          {b.items.map((it, i) => (
            <ItemCard key={i} idx={i} onRemove={() => setItems(b.items.filter((_, j) => j !== i))}>
              <input
                className={inputCls + " mb-1.5"}
                placeholder="Label"
                value={it.label}
                onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                <input
                  className={inputCls}
                  type="number"
                  placeholder="Value A"
                  value={it.valueA}
                  onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, valueA: num(e.target.value) } : x)))}
                />
                <input
                  className={inputCls}
                  type="number"
                  placeholder="Value B"
                  value={it.valueB ?? ""}
                  onChange={(e) =>
                    setItems(
                      b.items.map((x, j) =>
                        j === i ? { ...x, valueB: e.target.value === "" ? undefined : num(e.target.value) } : x,
                      ),
                    )
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-studio-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!it.highlight}
                  onChange={(e) => setItems(b.items.map((x, j) => (j === i ? { ...x, highlight: e.target.checked } : x)))}
                  className="accent-studio-accent"
                />
                Highlight row
              </label>
            </ItemCard>
          ))}
          <AddRow onClick={() => setItems([...b.items, { label: "Row", valueA: 50 }])}>Add bar</AddRow>
        </>
      );
    }

    case "step": {
      const b = block;
      const setItems = (items: typeof b.items) => onChange({ ...b, items });
      return (
        <>
          {b.items.map((it, i) => (
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
          <AddRow onClick={() => setItems([...b.items, { title: "Step", desc: "" }])}>Add step</AddRow>
        </>
      );
    }

    case "node-list": {
      const b = block;
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });
      const setItems = (items: typeof b.items) => onChange({ ...b, items });
      return (
        <>
          <Field label="Hub title">
            <input className={inputCls} value={b.hubTitle} onChange={(e) => set({ hubTitle: e.target.value })} />
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

    case "compare": {
      const b = block;
      const layout = b.layout ?? "cards";
      const set = (patch: Partial<typeof b>) => onChange({ ...b, ...patch });
      const setRows = (rows: typeof b.rows) => onChange({ ...b, rows });
      return (
        <>
          <Field label="Layout">
            <div className="flex items-center gap-1 p-1 rounded-md bg-[#0E0E0E] border border-studio-border">
              {(["cards", "table"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => set({ layout: opt })}
                  aria-pressed={layout === opt}
                  className={[
                    "flex-1 px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors",
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
              className="accent-studio-accent"
            />
            Highlight column B
          </label>
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
          <AddRow onClick={() => setRows([...b.rows, { label: "", a: "", b: "" }])}>Add row</AddRow>
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
          xLabels: [...b.xLabels, ""],
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
              className="accent-studio-accent"
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
              className="accent-studio-accent"
            />
            Area fill under line A
          </label>
          {b.xLabels.map((x, i) => (
            <ItemCard key={i} idx={i} onRemove={() => removePoint(i)}>
              <input
                className={inputCls + " mb-1.5"}
                placeholder="X label (e.g. Wk 1)"
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
  }
}
