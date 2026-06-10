import type { InfographicBlock } from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "stacked-bar" }>; scale?: number };

/**
 * Grayscale ramp for stacked segments (dark→light, in series order). Each entry
 * pairs a fill with a readable text color. Adjacent grays are close, so segments
 * are separated by a thin gap (see SEG_GAP) rather than relying on contrast.
 */
const STACK_RAMP: { fill: string; text: string }[] = [
  { fill: "#292016", text: "#FFFFFF" },
  { fill: "#66625E", text: "#FFFFFF" },
  { fill: "#8C867E", text: "#FFFFFF" },
  { fill: "#D9D6D2", text: "#292016" },
  { fill: "#E5E3DF", text: "#292016" },
];
/** Accent series fill — lime (resolved by the canvas so the export clone works). */
const ACCENT = { fill: "var(--ig-accent)", text: "#292016" };
const LABEL = "#292016";
const LEGEND_TEXT = "#66625E";
/** Gap between segments (px) — lets adjacent grays read as separate bands. */
const SEG_GAP = 3;
/** Hide a segment's value when it occupies less than this share of the track. */
const VALUE_HIDE_FRAC = 0.07;

function seriesColor(i: number, accentIndex?: number) {
  if (accentIndex !== undefined && i === accentIndex) return ACCENT;
  return STACK_RAMP[i % STACK_RAMP.length];
}

/**
 * Multi-series 100%-stacked horizontal bar chart. Each row stacks its `values`
 * (aligned to `series`) left→right. Two modes:
 *  - absolute (default): segment width ∝ value, all rows share one scale (the
 *    largest row total fills the track) so totals are comparable.
 *  - normalize: each row fills the full track (per-row 100% composition).
 *
 * Palette is grayscale only; one series may be promoted to the accent (lime) via
 * `accentIndex`. A legend sits above the rows.
 */
export function StackedBarBlock({ block, scale = 1 }: Props) {
  const fs = (n: number) => Math.round(n * scale);
  const u = block.unit ?? "";
  const { series, rows, normalize, accentIndex } = block;

  const rowSums = rows.map((r) => r.values.reduce((s, v) => s + Math.max(0, v || 0), 0));
  const maxSum = Math.max(...rowSums, 1);
  const barH = Math.round(38 * scale);
  // Short category labels (Q1, January) — fixed gutter, ellipsis past it.
  const labelW = Math.round(78 * scale);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        width: "100%",
        maxWidth: 660,
        alignSelf: "center",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", justifyContent: "center" }}>
        {series.map((label, i) => {
          const c = seriesColor(i, accentIndex);
          return (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: fs(13), height: fs(13), borderRadius: 3, background: c.fill, flexShrink: 0 }} />
              <span style={{ fontSize: fs(13), fontWeight: 600, color: LEGEND_TEXT, whiteSpace: "nowrap" }}>
                {label}
              </span>
            </span>
          );
        })}
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row, ri) => {
          const sum = rowSums[ri] || 1;
          // In absolute mode the row track only fills (sum / maxSum) of its width.
          const innerWidthPct = normalize ? 100 : (sum / maxSum) * 100;
          return (
            <div key={ri} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: labelW,
                  flexShrink: 0,
                  fontSize: fs(14),
                  fontWeight: 600,
                  color: LABEL,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {row.label}
              </div>
              {/* Track (full width); inner holds the stacked segments. */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: SEG_GAP, width: `${innerWidthPct}%`, height: barH }}>
                  {series.map((_, si) => {
                    const v = Math.max(0, row.values[si] ?? 0);
                    if (v <= 0) return null;
                    const c = seriesColor(si, accentIndex);
                    const segPct = (v / sum) * 100; // share of this row's inner width
                    // Fraction of the whole track this segment actually occupies.
                    const trackFrac = normalize ? v / sum : v / maxSum;
                    const showValue = trackFrac >= VALUE_HIDE_FRAC;
                    return (
                      <div
                        key={si}
                        style={{
                          flexBasis: `${segPct}%`,
                          flexGrow: 0,
                          flexShrink: 1,
                          minWidth: 0,
                          height: "100%",
                          background: c.fill,
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {showValue && (
                          <span
                            style={{
                              fontSize: fs(14),
                              fontWeight: 600,
                              color: c.text,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {v}
                            {u}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
