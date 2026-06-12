import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";
import { brand } from "@/lib/tokens/brand";

type Props = { block: Extract<InfographicBlock, { type: "compare" }>; scale?: number };

const CARD_BG = brand.color.infographic.paper;
const HAIRLINE = brand.color.infographic.grid;
/** Highlight color — black (not the lime accent) for the "new/better" side. */
const HL = brand.color.ink;
/** Neutral chip background for non-highlighted column names — infographic gray. */
const CHIP_BG = brand.color.infographic.chip;

/**
 * Two-column comparison. Renders as side-by-side cards (default) or an aligned
 * table with row labels. Column B can be highlighted (black) as the "new/better"
 * side. Column names sit in rounded chips.
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
            <span
              style={{
                fontSize: fs(18),
                fontWeight: 600,
                color: INFOGRAPHIC_INK,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {r.label}
            </span>
            <span style={{ fontSize: fs(18), color: INFOGRAPHIC_INK_MUTED }}>{r.a}</span>
            <span style={{ fontSize: fs(18), fontWeight: highlightB ? 600 : 400, color: INFOGRAPHIC_INK }}>{r.b}</span>
          </div>
        ))}
      </div>
    );
  }

  const bullets = block.bullets !== false;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }}>
      <CompareCard title={columnA} items={rows.map((r) => r.a)} highlight={false} bullets={bullets} fs={fs} />
      <CompareCard title={columnB} items={rows.map((r) => r.b)} highlight={!!highlightB} bullets={bullets} fs={fs} />
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
        color: highlight ? brand.color.white : INFOGRAPHIC_INK,
        padding: "5px 12px",
        borderRadius: 8,
        background: highlight ? HL : CHIP_BG,
      }}
    >
      {label}
    </span>
  );
}

function CompareCard({
  title,
  items,
  highlight,
  bullets,
  fs,
}: {
  title: string;
  items: string[];
  highlight: boolean;
  bullets: boolean;
  fs: (n: number) => number;
}) {
  // Item text metrics — used to vertically center the bullet on the first line.
  const itemFs = fs(17);
  const lineH = Math.round(itemFs * 1.45);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: CARD_BG,
        // No outline — the highlight reads through the black chip + bullets only.
        border: "none",
        borderRadius: 12,
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          alignSelf: "flex-start",
          fontSize: fs(14),
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: highlight ? brand.color.white : INFOGRAPHIC_INK,
          background: highlight ? HL : CHIP_BG,
          padding: "5px 12px",
          borderRadius: 8,
        }}
      >
        {title}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {items.map((it, i) =>
          it ? (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              {bullets && (
                // Wrapper spans one line-height and centers the dot, so the dot
                // aligns to the middle of the first text line at any scale.
                <span style={{ display: "flex", alignItems: "center", height: lineH, flexShrink: 0 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: highlight ? HL : INFOGRAPHIC_INK_MUTED,
                    }}
                  />
                </span>
              )}
              <span style={{ fontSize: itemFs, lineHeight: 1.45, color: INFOGRAPHIC_INK }}>{it}</span>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
