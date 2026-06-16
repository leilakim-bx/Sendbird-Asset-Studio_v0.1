import type { InfographicBlock, InfographicFormat } from "@/lib/types/infographic";
import type { CSSProperties } from "react";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";
import { compareMaxRows } from "@/lib/infographic-block-limits";
import { brand } from "@/lib/tokens/brand";

type Props = {
  block: Extract<InfographicBlock, { type: "compare" }>;
  scale?: number;
  format?: InfographicFormat;
  maxHeight?: number;
};

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
export function CompareBlock({ block, scale = 1, format, maxHeight }: Props) {
  const { columnA, columnB, highlightB } = block;
  const rows = block.rows.slice(0, compareMaxRows(format ?? "blog"));
  const layout = block.layout ?? "cards";
  const fs = (n: number) => Math.round(n * scale);

  if (layout === "table") {
    const isProduct = format === "product";
    const productTableClamp: CSSProperties = isProduct
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
          overflowWrap: "anywhere",
        }
      : { overflowWrap: "anywhere" };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          ...(isProduct && maxHeight ? { maxHeight, overflow: "hidden" } : {}),
        }}
      >
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
                lineHeight: 1.25,
                color: INFOGRAPHIC_INK,
                minWidth: 0,
                ...productTableClamp,
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontSize: fs(18),
                lineHeight: 1.25,
                color: INFOGRAPHIC_INK_MUTED,
                minWidth: 0,
                ...productTableClamp,
              }}
            >
              {r.a}
            </span>
            <span
              style={{
                fontSize: fs(18),
                lineHeight: 1.25,
                fontWeight: highlightB ? 600 : 400,
                color: INFOGRAPHIC_INK,
                minWidth: 0,
                ...productTableClamp,
              }}
            >
              {r.b}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const bullets = block.bullets !== false;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        alignItems: "stretch",
        ...(format === "product" && maxHeight ? { maxHeight, overflow: "hidden" } : {}),
      }}
    >
      <CompareCard title={columnA} items={rows.map((r) => r.a)} highlight={false} bullets={bullets} fs={fs} format={format} />
      <CompareCard title={columnB} items={rows.map((r) => r.b)} highlight={!!highlightB} bullets={bullets} fs={fs} format={format} />
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
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
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
  format,
}: {
  title: string;
  items: string[];
  highlight: boolean;
  bullets: boolean;
  fs: (n: number) => number;
  format?: InfographicFormat;
}) {
  // Item text metrics — used to vertically center the bullet on the first line.
  const isProduct = format === "product";
  const itemBaseSize = isProduct ? 16 : 17;
  const itemFs = fs(itemBaseSize);
  const itemLineHeight = isProduct ? 1.38 : 1.45;
  // Product feature can accept more short points, but never lets a single long
  // point expand the fixed frame. Padding and text size stay fixed; gap only tightens by 1px.
  // Each point can read as a short paragraph, then clamps before it breaks export.
  const itemGap = isProduct && items.length >= 5 ? 8 : 9;
  const lineH = Math.round(itemFs * itemLineHeight);
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
        overflow: isProduct ? "hidden" : undefined,
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
      <div style={{ display: "flex", flexDirection: "column", gap: itemGap }}>
        {items.map((it, i) =>
          it ? (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", minWidth: 0 }}>
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
              <span
                style={{
                  minWidth: 0,
                  fontSize: itemFs,
                  lineHeight: itemLineHeight,
                  color: INFOGRAPHIC_INK,
                  overflowWrap: "anywhere",
                  ...(isProduct
                    ? {
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 5,
                        overflow: "hidden",
                      }
                    : {}),
                }}
              >
                {it}
              </span>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
