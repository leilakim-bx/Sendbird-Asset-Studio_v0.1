import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "stat" }> };

/**
 * Big-number stat. The accent highlight reads `var(--ig-accent)`, which the
 * parent canvas sets to a resolved hex (see InfographicCanvas) — so the export
 * clone never depends on CSS custom properties resolving against :root.
 */
export function StatBlock({ block }: Props) {
  const { eyebrow, number, highlightNumber, label } = block;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {eyebrow && (
        <span
          style={{
            alignSelf: "center",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.015em",
            color: INFOGRAPHIC_INK_MUTED,
            background: "rgba(0,0,0,0.05)",
            padding: "6px 14px",
            borderRadius: 8,
          }}
        >
          {eyebrow}
        </span>
      )}

      <span
        style={{
          fontFamily: '"Serrif", Georgia, "Times New Roman", serif',
          fontSize: 116,
          lineHeight: 0.95,
          letterSpacing: "-0.05em",
          color: "#292016",
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
            fontSize: 15,
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
