import type { InfographicBlock } from "@/lib/types/infographic";
import {
  INFOGRAPHIC_INK,
  INFOGRAPHIC_INK_MUTED,
  INFOGRAPHIC_SERIF,
} from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "kpi-group" }> };

/** A row of big KPI numbers (one column per item). Ports prototype .b-kpi-group. */
export function KpiGroupBlock({ block }: Props) {
  const cols = block.items.length || 1;
  return (
    <div style={{ display: "grid", gap: 32, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {block.items.map((it, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontFamily: INFOGRAPHIC_SERIF,
              fontSize: 72,
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: INFOGRAPHIC_INK,
            }}
          >
            {it.number}
          </div>
          <div style={{ fontSize: 13, color: INFOGRAPHIC_INK_MUTED }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}
