import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "compare" }>; scale?: number };

const CARD_BG = "rgba(255,255,255,0.5)";
const HAIRLINE = "rgba(0,0,0,0.08)";

/**
 * Two-column comparison. Renders as side-by-side cards (default) or an aligned
 * table with row labels. Column B can be accent-highlighted as the "new/better"
 * side. Accent reads var(--ig-accent) (set by the canvas), so the export clone
 * never depends on :root CSS variables.
 */
export function CompareBlock({ block, scale = 1 }: Props) {
  const { columnA, columnB, rows, highlightB } = block;
  const layout = block.layout ?? "cards";
  const fs = (n: number) => Math.round(n * scale);

  if (layout === "table") {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
            gap: 12,
            alignItems: "end",
            marginBottom: 8,
          }}
        >
          <span />
          <ColHeader label={columnA} highlight={false} fs={fs} />
          <ColHeader label={columnB} highlight={!!highlightB} fs={fs} />
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: 12,
              alignItems: "center",
              padding: "16px 0",
              borderTop: `1px solid ${HAIRLINE}`,
            }}
          >
            <span style={{ fontSize: fs(18), fontWeight: 600, color: INFOGRAPHIC_INK }}>{r.label}</span>
            <span style={{ fontSize: fs(18), color: INFOGRAPHIC_INK_MUTED }}>{r.a}</span>
            <span style={{ fontSize: fs(18), fontWeight: highlightB ? 600 : 400, color: INFOGRAPHIC_INK }}>{r.b}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }}>
      <CompareCard title={columnA} items={rows.map((r) => r.a)} highlight={false} fs={fs} />
      <CompareCard title={columnB} items={rows.map((r) => r.b)} highlight={!!highlightB} fs={fs} />
    </div>
  );
}

function ColHeader({ label, highlight, fs }: { label: string; highlight: boolean; fs: (n: number) => number }) {
  return (
    <span
      style={{
        justifySelf: "start",
        fontSize: fs(13),
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: INFOGRAPHIC_INK,
        padding: "5px 12px",
        borderRadius: 6,
        background: highlight ? "var(--ig-accent)" : "rgba(0,0,0,0.05)",
      }}
    >
      {label}
    </span>
  );
}

function CompareCard({ title, items, highlight, fs }: { title: string; items: string[]; highlight: boolean; fs: (n: number) => number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: CARD_BG,
        border: highlight ? "1.5px solid var(--ig-accent)" : `1px solid ${HAIRLINE}`,
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {highlight && (
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ig-accent)", flexShrink: 0 }} />
        )}
        <span
          style={{
            fontSize: fs(14),
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: INFOGRAPHIC_INK,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {items.map((it, i) =>
          it ? (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: highlight ? "var(--ig-accent)" : INFOGRAPHIC_INK_MUTED,
                  marginTop: 8,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: fs(17), lineHeight: 1.45, color: INFOGRAPHIC_INK }}>{it}</span>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
