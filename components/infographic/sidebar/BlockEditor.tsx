"use client";

import type { ReactNode } from "react";
import { Plus, X } from "lucide-react";
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
  }
}
