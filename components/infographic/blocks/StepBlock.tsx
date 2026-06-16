import type { InfographicBlock, InfographicFormat } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";
import { stepMaxItems } from "@/lib/infographic-block-limits";
import { brand } from "@/lib/tokens/brand";

type Props = {
  block: Extract<InfographicBlock, { type: "step" }>;
  scale?: number;
  format?: InfographicFormat;
};

/** Numbered process steps. Ports prototype .b-step (badge uses var(--ig-accent)). */
export function StepBlock({ block, scale = 1, format }: Props) {
  const isProduct = format === "product";
  const items = block.items.slice(0, stepMaxItems(format ?? "blog"));
  const fs = (n: number) => Math.round(n * scale);
  // All-or-nothing descriptions: show them only when every step has one, so the
  // cards never look uneven (some 2-line, some 1-line).
  const allHaveDesc = items.length > 0 && items.every((it) => !!it.desc?.trim());
  const clampStyle = isProduct
    ? {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical" as const,
        WebkitLineClamp: 2,
        overflow: "hidden",
        overflowWrap: "anywhere" as const,
      }
    : {
        overflowWrap: "anywhere" as const,
      };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr auto",
            alignItems: "center",
            gap: 14,
            background: brand.color.infographic.paper,
            padding: "14px 16px",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: INFOGRAPHIC_INK,
              color: brand.color.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs(12),
              fontWeight: 600,
            }}
          >
            {i + 1}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: fs(14),
                lineHeight: 1.28,
                fontWeight: 600,
                color: INFOGRAPHIC_INK,
                ...clampStyle,
              }}
            >
              {it.title}
            </div>
            {allHaveDesc && (
              <div
                style={{
                  fontSize: fs(12),
                  lineHeight: 1.35,
                  color: INFOGRAPHIC_INK_MUTED,
                  ...clampStyle,
                }}
              >
                {it.desc}
              </div>
            )}
          </div>
          {it.badge && (
            <div
              style={{
                fontSize: fs(9),
                fontWeight: 700,
                letterSpacing: "0.08em",
                background: "var(--ig-accent)",
                padding: "4px 8px",
                borderRadius: 4,
                textTransform: "uppercase",
                color: INFOGRAPHIC_INK,
                whiteSpace: "nowrap",
                maxWidth: 110,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {it.badge}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
