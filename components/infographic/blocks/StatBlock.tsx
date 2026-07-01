import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK_MUTED, INFOGRAPHIC_SERIF } from "@/lib/types/infographic";
import { brand } from "@/lib/tokens/brand";

type Props = { block: Extract<InfographicBlock, { type: "stat" }>; scale?: number };

/**
 * Big-number stat. The accent highlight reads `var(--ig-accent)`, which the
 * parent canvas sets to a resolved hex (see InfographicCanvas) — so the export
 * clone never depends on CSS custom properties resolving against :root.
 */
export function StatBlock({ block, scale = 1 }: Props) {
  const { eyebrow, number, highlightNumber, label } = block;
  const fs = (n: number) => Math.round(n * scale);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {eyebrow && (
        <span
          style={{
            alignSelf: "center",
            fontSize: fs(14),
            fontWeight: 500,
            letterSpacing: "-0.015em",
            color: INFOGRAPHIC_INK_MUTED,
            background: brand.color.infographic.subtleFill,
            padding: "6px 14px",
            borderRadius: 8,
          }}
        >
          {eyebrow}
        </span>
      )}

      <span
        style={{
          fontFamily: INFOGRAPHIC_SERIF,
          fontSize: fs(116),
          lineHeight: 0.95,
          letterSpacing: "-0.05em",
          color: brand.color.ink,
          width: "fit-content",
          alignSelf: "center",
          ...(highlightNumber
            ? {
                background: "var(--ig-accent)",
                padding: "0.02em 0.12em",
                borderRadius: 8,
              }
            : {}),
        }}
      >
        {number}
      </span>

      {label && (
        <span
          style={{
            alignSelf: "center",
            textAlign: "center",
            fontSize: fs(15),
            lineHeight: 1.4,
            color: INFOGRAPHIC_INK_MUTED,
            maxWidth: 480,
            // max 3 lines, ellipsis on overflow
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
