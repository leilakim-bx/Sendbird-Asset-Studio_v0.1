import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_SERIF } from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "bar-group" }>; scale?: number };

// Bar graphs use a fixed grayscale palette only — the accent (lime) appears
// solely as the highlighted *number's* color, never as a bar fill.
/** Faint full-width scale track (lightest gray). */
const TRACK = "#D9D6D2";
/** Primary (A) bar fill — darkest. */
const BAR_A = "#292016";
/** Secondary (B) bar fill — mid gray (stays visible on every background). */
const BAR_B = "#8C867E";
/** Number color inside the bars. */
const NUM_ON_BAR = "#ffffff";
/** Row (category) label. */
const LABEL = "#292016";
/** Light fill (split segments other than the first) — same as the track. */
const SEG_LIGHT = "#D9D6D2";
/** Number color on a light fill. */
const NUM_MUTED = "#66625E";
const BAR_H_A = 40;
const BAR_H_B = 34;
/** Min fill width so the in-bar number never clips for small values. */
const MIN_FILL = 50;

/**
 * Bar block with three shapes (block.variant):
 *  - "bars" (default): horizontal A vs optional B rows, value as a big number
 *    inside each chunky fill.
 *  - "split": one bar divided into proportional segments (widths ∝ value / sum),
 *    e.g. 83 / 17. Big serif number + caption inside each segment.
 *  - "columns": vertical columns (added in a later pass).
 *
 * Palette is grayscale only (#ffffff / #D9D6D2 / #8C867E / #66625E / #292016);
 * the accent (var(--ig-accent), set by the canvas so the export clone resolves
 * it) appears solely on a highlighted *number*, never as a fill.
 */
export function BarGroupBlock({ block, scale = 1 }: Props) {
  if (block.variant === "split") return <SplitBar block={block} scale={scale} />;
  if (block.variant === "columns") return <Columns block={block} scale={scale} />;

  const { items, unit } = block;
  const u = unit ?? "%";
  const fs = (n: number) => Math.round(n * scale);
  const maxV = Math.max(...items.flatMap((it) => [it.valueA, it.valueB ?? 0]), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {items.map((it, i) => {
        const hasB = (it.valueB ?? 0) > 0;
        // highlight emphasizes the NUMBER (accent text), not the bar fill.
        const aNum = it.highlight ? "var(--ig-accent)" : NUM_ON_BAR;
        return (
          <div
            key={i}
            style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 20, alignItems: "center" }}
          >
            <div style={{ fontSize: fs(15), fontWeight: 600, lineHeight: 1.25, color: LABEL }}>
              {it.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Bar value={it.valueA} maxV={maxV} unit={u} height={BAR_H_A} fill={BAR_A} numColor={aNum} fs={fs} />
              {hasB && (
                <Bar
                  value={it.valueB as number}
                  maxV={maxV}
                  unit={u}
                  height={BAR_H_B}
                  fill={BAR_B}
                  numColor={NUM_ON_BAR}
                  fs={fs}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Bar({
  value,
  maxV,
  unit,
  height,
  fill,
  numColor,
  fs,
}: {
  value: number;
  maxV: number;
  unit: string;
  height: number;
  fill: string;
  numColor: string;
  fs: (n: number) => number;
}) {
  const w = Math.max(0, Math.min(value / maxV, 1)) * 100;
  return (
    <div style={{ position: "relative", height, borderRadius: 6, background: TRACK }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${w}%`,
            minWidth: MIN_FILL,
            borderRadius: 6,
            background: fill,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 12,
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              fontFamily: INFOGRAPHIC_SERIF,
              fontSize: fs(22),
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: numColor,
              whiteSpace: "nowrap",
            }}
          >
            {value}
            {unit}
          </span>
        </div>
      </div>
  );
}

/**
 * "split" variant — a single bar divided into proportional segments
 * (widths ∝ valueA / sum). The first segment is dark, the rest light; numbers
 * are big serif, captions are the item labels. Accent appears only on a
 * highlighted segment's number.
 */
function SplitBar({
  block,
  scale,
}: {
  block: Extract<InfographicBlock, { type: "bar-group" }>;
  scale: number;
}) {
  const fs = (n: number) => Math.round(n * scale);
  const u = block.unit ?? "%";
  const items = block.items;
  const sum = items.reduce((s, it) => s + Math.max(0, it.valueA || 0), 0) || 1;

  return (
    <div style={{ display: "flex", gap: 8, width: "100%", alignItems: "stretch" }}>
      {items.map((it, i) => {
        const pct = (Math.max(0, it.valueA || 0) / sum) * 100;
        const dark = i === 0;
        const fill = dark ? BAR_A : SEG_LIGHT;
        const numColor = it.highlight ? "var(--ig-accent)" : dark ? NUM_ON_BAR : NUM_MUTED;
        const labelColor = dark ? SEG_LIGHT : NUM_MUTED;
        return (
          <div
            key={i}
            style={{
              flexBasis: `${pct}%`,
              flexGrow: 0,
              flexShrink: 1,
              minWidth: 0,
              background: fill,
              borderRadius: 12,
              minHeight: 96,
              padding: "18px 18px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 4,
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontFamily: INFOGRAPHIC_SERIF,
                fontSize: fs(36),
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: numColor,
                whiteSpace: "nowrap",
              }}
            >
              {it.valueA}
              {u}
            </span>
            {it.label && (
              <span
                style={{
                  fontSize: fs(14),
                  fontWeight: 500,
                  color: labelColor,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {it.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Tallest column height (px). Other columns scale ∝ value. */
const COL_CHART_H = 260;
/** Floor so a column is always tall enough for its heading + chip. */
const COL_MIN_H = 92;
/** Light→dark grayscale ramp across columns (reads as ascending levels). */
const COL_RAMP = ["#D9D6D2", "#8C867E", "#66625E", "#292016"];

/**
 * "columns" variant — vertical columns whose height ∝ valueA. Each column shows
 * an optional serif heading + chip inside, with a label (+ optional desc) below.
 * Fills step through a grayscale ramp; the accent appears only on a highlighted
 * column's chip (never the fill).
 */
function Columns({
  block,
  scale,
}: {
  block: Extract<InfographicBlock, { type: "bar-group" }>;
  scale: number;
}) {
  const fs = (n: number) => Math.round(n * scale);
  const items = block.items;
  const maxV = Math.max(...items.map((it) => it.valueA), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Columns row — anchored to a shared baseline. */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: COL_CHART_H }}>
        {items.map((it, i) => {
          const h = Math.max(COL_MIN_H, (Math.max(0, it.valueA) / maxV) * COL_CHART_H);
          const fill = COL_RAMP[Math.min(i, COL_RAMP.length - 1)];
          const lightText = i >= 2; // darker fills → light text
          const textColor = lightText ? "#FFFFFF" : "#292016";
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                background: fill,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 12,
                padding: "0 12px 18px",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              {it.heading && (
                <span
                  style={{
                    fontFamily: INFOGRAPHIC_SERIF,
                    fontSize: fs(26),
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    color: textColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.heading}
                </span>
              )}
              {it.tag && (
                <span
                  style={{
                    fontSize: fs(11),
                    fontWeight: 600,
                    color: "#292016",
                    background: it.highlight ? "var(--ig-accent)" : "#FFFFFF",
                    padding: "4px 10px",
                    borderRadius: 8,
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {it.tag}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels row — aligned under each column. */}
      <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
        {items.map((it, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: fs(14), fontWeight: 600, color: LABEL, lineHeight: 1.3 }}>{it.label}</div>
            {it.desc && (
              <div style={{ marginTop: 4, fontSize: fs(12), color: NUM_MUTED, lineHeight: 1.4 }}>{it.desc}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
