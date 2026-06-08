import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED, INFOGRAPHIC_ACCENT_HEX } from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "line-chart" }> };

const VB_W = 720;
const VB_H = 380;
const PAD = { left: 46, right: 16, top: 18, bottom: 36 };
/** Secondary line — light warm gray so line A (ink) stays primary. */
const SERIES_B_COLOR = "#BDB5AB";
const GRID = "rgba(0,0,0,0.08)";
/** Area fill is always lime (independent of the canvas accent), as a top-down gradient. */
const LIME = INFOGRAPHIC_ACCENT_HEX.lime;

/** Round up to a "nice" axis max (1/2/5 × 10ⁿ). */
function niceMax(v: number): number {
  if (v <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

/**
 * Line chart with optional second comparison line. SVG-based; the area fill
 * reads var(--ig-accent) via inline style so the html-to-image export clone
 * resolves it (presentation attributes don't always carry CSS variables).
 */
export function LineChartBlock({ block }: Props) {
  const { xLabels, seriesA, seriesB } = block;
  const showFill = block.fill !== false;

  const allVals = [...seriesA.values, ...(seriesB?.values ?? [])].filter((v) => Number.isFinite(v));
  const rawMax = allVals.length ? Math.max(...allVals) : 10;
  const yMax = block.yMax && block.yMax > 0 ? block.yMax : niceMax(rawMax);

  const x0 = PAD.left;
  const x1 = VB_W - PAD.right;
  const y0 = PAD.top;
  const y1 = VB_H - PAD.bottom;

  const n = Math.max(xLabels.length, seriesA.values.length, seriesB?.values.length ?? 0);
  const xAt = (i: number) => (n <= 1 ? x0 : x0 + (i / (n - 1)) * (x1 - x0));
  const yAt = (v: number) => y1 - (Math.max(0, Math.min(v, yMax)) / yMax) * (y1 - y0);

  const lineStr = (vals: number[]) => vals.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
  const areaPath = (vals: number[]) => {
    if (vals.length < 2) return "";
    const top = vals.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(v)}`).join(" ");
    return `${top} L${xAt(vals.length - 1)},${y1} L${xAt(0)},${y1} Z`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ v: yMax * t, y: yAt(yMax * t) }));

  const fillId = `lc-fill-${block.id}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ display: "block" }} role="img">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LIME} stopOpacity={0.55} />
            <stop offset="100%" stopColor={LIME} stopOpacity={0.04} />
          </linearGradient>
        </defs>

        {/* horizontal gridlines + y-axis labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={x0} y1={t.y} x2={x1} y2={t.y} stroke={GRID} strokeWidth={1} />
            <text x={x0 - 10} y={t.y + 4} textAnchor="end" fontSize={13} fill={INFOGRAPHIC_INK_MUTED}>
              {Math.round(t.v)}
            </text>
          </g>
        ))}

        {/* area fill under line A */}
        {showFill && <path d={areaPath(seriesA.values)} stroke="none" fill={`url(#${fillId})`} />}

        {/* line B (secondary — drawn beneath A) */}
        {seriesB && (
          <>
            <polyline
              points={lineStr(seriesB.values)}
              fill="none"
              stroke={SERIES_B_COLOR}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {seriesB.values.map((v, i) => (
              <circle key={i} cx={xAt(i)} cy={yAt(v)} r={3.5} fill={SERIES_B_COLOR} />
            ))}
          </>
        )}

        {/* line A (primary) */}
        <polyline
          points={lineStr(seriesA.values)}
          fill="none"
          stroke={INFOGRAPHIC_INK}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {seriesA.values.map((v, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(v)} r={3.5} fill={INFOGRAPHIC_INK} />
        ))}

        {/* x-axis labels */}
        {xLabels.map((lab, i) => (
          <text key={i} x={xAt(i)} y={VB_H - 12} textAnchor="middle" fontSize={13} fill={INFOGRAPHIC_INK_MUTED}>
            {lab}
          </text>
        ))}
      </svg>

      {/* legend — only when comparing two lines */}
      {seriesB && (
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          <LegendItem color={INFOGRAPHIC_INK} label={seriesA.label} />
          <LegendItem color={SERIES_B_COLOR} label={seriesB.label} />
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 20, height: 3, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 14, color: INFOGRAPHIC_INK }}>{label}</span>
    </span>
  );
}
