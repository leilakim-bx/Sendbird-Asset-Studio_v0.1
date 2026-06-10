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
  if (block.variant === "ranked") return <Ranked block={block} scale={scale} />;

  const { items, unit } = block;
  const u = unit ?? "%";
  const fs = (n: number) => Math.round(n * scale);
  const maxV = Math.max(...items.flatMap((it) => [it.valueA, it.valueB ?? 0]), 1);
  // Few bars look thin in the canvas — thicken them (1 bar > 2 bars > many).
  // Heights also scale with the format (product is larger), so product bars
  // aren't dwarfed by the bigger canvas; blog (scale 1) is unchanged.
  const n = items.length;
  const baseHA = n === 1 ? 72 : n === 2 ? 52 : BAR_H_A;
  const baseHB = n === 1 ? 60 : n === 2 ? 44 : BAR_H_B;
  const hA = Math.round(baseHA * scale);
  const hB = Math.round(baseHB * scale);
  // Label column caps at ~"Row hello hello hello"; longer labels get an ellipsis.
  const labelW = Math.round(176 * scale);

  // labelInside: drop the left gutter, put each category label inside its A bar,
  // and frame the chart with ranked-style top headers (labelA left / labelB right).
  const inside = !!block.labelInside;
  const hasHeader = inside && !!(block.labelA || block.labelB);
  const headerStyle = {
    fontSize: fs(13),
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "#8C867E",
  };

  return (
    // Centered composition: cap the width and center the chart so a short/single
    // bar doesn't sit edge-to-edge (label gutter left, fill to the right edge).
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        width: "100%",
        maxWidth: 640,
        alignSelf: "center",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {hasHeader && (
        // Ranked-style headers flush to the chart's outer edges (labelInside only).
        <div style={{ position: "relative", height: fs(16), marginBottom: 2 }}>
          <span style={{ ...headerStyle, position: "absolute", left: 0, top: 0 }}>{block.labelA}</span>
          <span style={{ ...headerStyle, position: "absolute", right: 0, top: 0 }}>{block.labelB}</span>
        </div>
      )}
      {items.map((it, i) => {
        const hasB = (it.valueB ?? 0) > 0;
        // highlight emphasizes the NUMBER (accent text), not the bar fill.
        const aNum = it.highlight ? "var(--ig-accent)" : NUM_ON_BAR;
        const barStack = (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Bar
              value={it.valueA}
              maxV={maxV}
              unit={u}
              height={hA}
              fill={BAR_A}
              numColor={aNum}
              fs={fs}
              label={inside ? it.label : undefined}
            />
            {hasB && (
              <Bar value={it.valueB as number} maxV={maxV} unit={u} height={hB} fill={BAR_B} numColor={NUM_ON_BAR} fs={fs} />
            )}
          </div>
        );

        // labelInside: full-width bars, label lives inside the A bar (no gutter).
        if (inside) return <div key={i}>{barStack}</div>;

        return (
          <div
            key={i}
            style={{ display: "grid", gridTemplateColumns: `${labelW}px 1fr`, gap: 16, alignItems: "center" }}
          >
            {/* Right-aligned; capped width with an ellipsis past the max length. */}
            <div
              style={{
                fontSize: fs(15),
                fontWeight: 600,
                lineHeight: 1.25,
                color: LABEL,
                textAlign: "right",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {it.label}
            </div>
            {barStack}
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
  label,
}: {
  value: number;
  maxV: number;
  unit: string;
  height: number;
  fill: string;
  numColor: string;
  fs: (n: number) => number;
  /** Optional category label rendered INSIDE the fill (left). When set the fill
   *  gets a wider min-width so the label + value coexist (labelInside mode). */
  label?: string;
}) {
  const w = Math.max(0, Math.min(value / maxV, 1)) * 100;
  return (
    <div style={{ position: "relative", height, borderRadius: 8, background: TRACK }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${w}%`,
            minWidth: label ? fs(170) : MIN_FILL,
            borderRadius: 8,
            background: fill,
            display: "flex",
            alignItems: "center",
            justifyContent: label ? "space-between" : "flex-end",
            gap: label ? 12 : 0,
            paddingLeft: label ? 16 : 0,
            paddingRight: 12,
            boxSizing: "border-box",
          }}
        >
          {label && (
            <span
              style={{
                fontSize: fs(15),
                fontWeight: 600,
                color: numColor,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                flex: 1,
              }}
            >
              {label}
            </span>
          )}
          <span
            style={{
              fontFamily: INFOGRAPHIC_SERIF,
              fontSize: fs(22),
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: numColor,
              whiteSpace: "nowrap",
              flexShrink: 0,
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

/** Ranked fills — dark end of the palette only, so bars stay legible on the
 *  light track. Light grays (#D9D6D2/#E5E3DF) would vanish into the track. A
 *  highlighted row uses the accent fill (the one place accent is a bar fill). */
const RANKED_FILL_RAMP: { fill: string; text: string }[] = [
  { fill: "#292016", text: "#FFFFFF" },
  { fill: "#66625E", text: "#FFFFFF" },
  { fill: "#8C867E", text: "#FFFFFF" },
];
/** Light track behind each ranked row (the un-filled remainder). */
const RANKED_TRACK = "#E5E3DF";
/** Largest bar fills this share of the full-width track; the remainder holds the
 *  right-pinned value so values align in one column regardless of bar length. */
const RANKED_MAX_BAR_PCT = 72;
/** Label inset inside the fill — shared with the left header's padding. */
const RANKED_PAD_L = 18;
/** Value's right padding — shared with the right header so the value column and
 *  its header land on one vertical line. */
const RANKED_PAD_R = 22;

/**
 * "ranked" variant — each row is a full-width track (light gray) with a colored
 * fill ∝ value growing from the left, the category label INSIDE the fill, and
 * the value pinned to the track's RIGHT edge. Because every value sits at the
 * same right offset, the values (and the labelB header above them) align in one
 * column — bar length never shifts them. labelA = left header, labelB = right
 * header. Highlight → accent fill. Fills use the dark palette only for contrast.
 */
function Ranked({
  block,
  scale,
}: {
  block: Extract<InfographicBlock, { type: "bar-group" }>;
  scale: number;
}) {
  const fs = (n: number) => Math.round(n * scale);
  const u = block.unit ?? "%";
  const items = block.items;
  const maxV = Math.max(...items.map((it) => it.valueA), 1);
  const barH = Math.round(58 * scale);
  const hasHeader = !!(block.labelA || block.labelB);

  const headerStyle = {
    fontSize: fs(13),
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "#8C867E",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      {hasHeader && (
        // Headers sit flush to the track's outer edges (labelA hard-left, labelB
        // hard-right), framing the full chart width.
        <div style={{ position: "relative", height: fs(16), marginBottom: 6 }}>
          <span style={{ ...headerStyle, position: "absolute", left: 0, top: 0 }}>{block.labelA}</span>
          <span style={{ ...headerStyle, position: "absolute", right: 0, top: 0 }}>{block.labelB}</span>
        </div>
      )}
      {items.map((it, i) => {
        const ramp = it.highlight
          ? { fill: "var(--ig-accent)", text: "#292016" }
          : RANKED_FILL_RAMP[i % RANKED_FILL_RAMP.length];
        const w = (Math.max(0, it.valueA) / maxV) * RANKED_MAX_BAR_PCT;
        return (
          // Track: rounded + overflow:hidden. This rounds only the fill's LEFT
          // corners (clipped to the track); the fill itself has no radius, so its
          // right edge stays square — reads as a progress fill, not a pill.
          <div
            key={i}
            style={{
              position: "relative",
              height: barH,
              borderRadius: 10,
              background: RANKED_TRACK,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${w}%`,
                minWidth: Math.round(120 * scale),
                background: ramp.fill,
                display: "flex",
                alignItems: "center",
                paddingLeft: RANKED_PAD_L,
                paddingRight: 12,
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: fs(15),
                  fontWeight: 600,
                  color: ramp.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {it.label}
              </span>
            </div>
            <span
              style={{
                position: "absolute",
                right: RANKED_PAD_R,
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: INFOGRAPHIC_SERIF,
                fontSize: fs(26),
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: "#292016",
                whiteSpace: "nowrap",
              }}
            >
              {it.valueA}
              {u}
            </span>
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
