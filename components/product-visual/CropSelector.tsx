"use client";

import { useEffect, useRef, useState } from "react";

type Crop = { x: number; y: number; width: number; height: number };

type Props = {
  imageUrl: string;
  /** Existing crop (0–1 ratios) to pre-load, or undefined for no selection. */
  crop?: Crop;
  /** Apply: commits the selection (undefined = no crop / full image). */
  onApply: (crop: Crop | undefined) => void;
  onCancel: () => void;
};

const LIME = "#CBFF4D";
const MIN = 0.1; // minimum crop edge (10% of the image)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type DragMode = "new" | "move" | "nw" | "ne" | "sw" | "se";
type DragState = { mode: DragMode; startX: number; startY: number; origin: Crop };

/**
 * Drag-to-select crop modal. Coordinates are normalized 0–1 relative to the
 * rendered image box, so they survive any later resize/format change. UI-only —
 * never exported, so its dim overlays use plain divs (no clip-path needed).
 */
export function CropSelector({ imageUrl, crop, onApply, onCancel }: Props) {
  const [sel, setSel] = useState<Crop | null>(crop ?? null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const selRef = useRef<Crop | null>(sel);

  useEffect(() => {
    selRef.current = sel;
  }, [sel]);

  // Keyboard: Esc = cancel, Enter = apply.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onApply(selRef.current ?? undefined);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onApply]);

  /** Pointer clientX/Y → normalized [0,1] within the image box. */
  function toNorm(clientX: number, clientY: number): { x: number; y: number } {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    };
  }

  function beginDrag(mode: DragMode, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const p = toNorm(e.clientX, e.clientY);
    drag.current = {
      mode,
      startX: p.x,
      startY: p.y,
      origin: selRef.current ?? { x: p.x, y: p.y, width: 0, height: 0 },
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onMove(ev: PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const { x: cx, y: cy } = toNorm(ev.clientX, ev.clientY);
    const o = d.origin;

    if (d.mode === "new") {
      const x = Math.min(d.startX, cx);
      const y = Math.min(d.startY, cy);
      setSel({ x, y, width: Math.abs(cx - d.startX), height: Math.abs(cy - d.startY) });
      return;
    }
    if (d.mode === "move") {
      const dx = cx - d.startX;
      const dy = cy - d.startY;
      setSel({
        x: clamp01(Math.min(o.x + dx, 1 - o.width)),
        y: clamp01(Math.min(o.y + dy, 1 - o.height)),
        width: o.width,
        height: o.height,
      });
      return;
    }
    // resize — keep the opposite corner fixed
    const right = o.x + o.width;
    const bottom = o.y + o.height;
    let nx = o.x, ny = o.y, nw = o.width, nh = o.height;
    if (d.mode === "se") {
      nw = clamp01(cx) - o.x;
      nh = clamp01(cy) - o.y;
    } else if (d.mode === "ne") {
      nw = clamp01(cx) - o.x;
      ny = Math.min(clamp01(cy), bottom - MIN);
      nh = bottom - ny;
    } else if (d.mode === "sw") {
      nx = Math.min(clamp01(cx), right - MIN);
      nw = right - nx;
      nh = clamp01(cy) - o.y;
    } else if (d.mode === "nw") {
      nx = Math.min(clamp01(cx), right - MIN);
      nw = right - nx;
      ny = Math.min(clamp01(cy), bottom - MIN);
      nh = bottom - ny;
    }
    setSel({ x: nx, y: ny, width: Math.max(MIN, nw), height: Math.max(MIN, nh) });
  }

  function onUp() {
    const d = drag.current;
    drag.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    // Discard a too-small accidental click; enforce the minimum otherwise.
    const s = selRef.current;
    if (d && s) {
      if (s.width < MIN || s.height < MIN) {
        if (d.mode === "new" && (s.width < 0.02 || s.height < 0.02)) {
          setSel(null);
          return;
        }
        setSel({ ...s, width: Math.max(MIN, s.width), height: Math.max(MIN, s.height) });
      }
    }
  }

  const pct = (v: number) => `${v * 100}%`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-studio-sidebar border border-studio-border rounded-2xl shadow-2xl flex flex-col max-w-[90vw] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-studio-border shrink-0">
          <div>
            <span className="text-sm font-semibold text-studio-text">Select key area</span>
            <p className="text-studio-muted text-xs mt-0.5">Drag to choose the region to feature.</p>
          </div>
          <button
            onClick={onCancel}
            className="text-studio-muted hover:text-studio-text hover:bg-studio-border rounded-[4px] w-6 h-6 flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Stage */}
        <div className="p-5 overflow-auto flex items-center justify-center">
          <div
            ref={stageRef}
            className="relative select-none touch-none"
            style={{ lineHeight: 0, cursor: "crosshair" }}
            onPointerDown={(e) => beginDrag("new", e)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Crop source"
              draggable={false}
              style={{ display: "block", maxWidth: "72vw", maxHeight: "60vh", width: "auto", height: "auto" }}
            />

            {sel && (
              <>
                {/* Dim overlays (4 plain divs around the selection) */}
                {[
                  { left: 0, top: 0, width: "100%", height: pct(sel.y) },
                  { left: 0, top: pct(sel.y + sel.height), width: "100%", height: pct(1 - sel.y - sel.height) },
                  { left: 0, top: pct(sel.y), width: pct(sel.x), height: pct(sel.height) },
                  { left: pct(sel.x + sel.width), top: pct(sel.y), width: pct(1 - sel.x - sel.width), height: pct(sel.height) },
                ].map((s, i) => (
                  <div key={i} style={{ position: "absolute", background: "rgba(0,0,0,0.5)", pointerEvents: "none", ...s }} />
                ))}

                {/* Selection rect */}
                <div
                  onPointerDown={(e) => beginDrag("move", e)}
                  style={{
                    position: "absolute",
                    left: pct(sel.x), top: pct(sel.y),
                    width: pct(sel.width), height: pct(sel.height),
                    border: `2px solid ${LIME}`,
                    cursor: "move",
                    boxSizing: "border-box",
                  }}
                />
                {/* Corner handles */}
                {([
                  ["nw", sel.x, sel.y, "nwse-resize"],
                  ["ne", sel.x + sel.width, sel.y, "nesw-resize"],
                  ["sw", sel.x, sel.y + sel.height, "nesw-resize"],
                  ["se", sel.x + sel.width, sel.y + sel.height, "nwse-resize"],
                ] as const).map(([corner, hx, hy, cur]) => (
                  <div
                    key={corner}
                    onPointerDown={(e) => beginDrag(corner, e)}
                    style={{
                      position: "absolute",
                      left: `calc(${pct(hx)} - 6px)`,
                      top: `calc(${pct(hy)} - 6px)`,
                      width: 12, height: 12,
                      background: LIME,
                      border: "1px solid rgba(0,0,0,0.35)",
                      borderRadius: 2,
                      cursor: cur,
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-studio-border shrink-0">
          <button
            onClick={() => setSel(null)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors"
          >
            Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="text-xs font-medium px-4 py-2 rounded-lg border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onApply(sel ?? undefined)}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-studio-accent text-studio-accent-fg hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
