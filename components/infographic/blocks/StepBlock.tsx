import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "step" }> };

/** Numbered process steps. Ports prototype .b-step (badge uses var(--ig-accent)). */
export function StepBlock({ block }: Props) {
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
            background: "rgba(255,255,255,0.5)",
            padding: "14px 16px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.06)",
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
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {i + 1}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: INFOGRAPHIC_INK }}>{it.title}</div>
            {it.desc && <div style={{ fontSize: 12, color: INFOGRAPHIC_INK_MUTED }}>{it.desc}</div>}
          </div>
          {it.badge && (
            <div
              style={{
                fontSize: 9,
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
