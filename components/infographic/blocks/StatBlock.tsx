import type { InfographicBlock } from "@/lib/types/infographic";
import {
  INFOGRAPHIC_INK,
  INFOGRAPHIC_INK_MUTED,
} from "@/lib/types/infographic";

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
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: INFOGRAPHIC_INK_MUTED,
          }}
        >
          {eyebrow}
        </span>
      )}

      <span
        style={{
          fontFamily: '"Serrif", Georgia, "Times New Roman", serif',
          fontSize: 140,
          lineHeight: 0.95,
          letterSpacing: "-0.05em",
          color: INFOGRAPHIC_INK,
          width: "fit-content",
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
        <span style={{ fontSize: 16, color: INFOGRAPHIC_INK_MUTED, maxWidth: 480 }}>
          {label}
        </span>
      )}
    </div>
  );
}
