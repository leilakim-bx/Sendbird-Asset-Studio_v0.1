import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "step" }>; scale?: number };

/** Numbered process steps. Ports prototype .b-step (badge uses var(--ig-accent)). */
export function StepBlock({ block, scale = 1 }: Props) {
  const fs = (n: number) => Math.round(n * scale);
  // All-or-nothing descriptions: show them only when every step has one, so the
  // cards never look uneven (some 2-line, some 1-line).
  const allHaveDesc = block.items.length > 0 && block.items.every((it) => !!it.desc?.trim());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {block.items.map((it, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr auto",
            alignItems: "center",
            gap: 14,
            background: "#FFFFFF",
            padding: "14px 16px",
            borderRadius: 14,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: INFOGRAPHIC_INK,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs(12),
              fontWeight: 600,
            }}
          >
            {i + 1}
          </div>
          <div>
            <div style={{ fontSize: fs(14), fontWeight: 600, color: INFOGRAPHIC_INK }}>{it.title}</div>
            {allHaveDesc && <div style={{ fontSize: fs(12), color: INFOGRAPHIC_INK_MUTED }}>{it.desc}</div>}
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
