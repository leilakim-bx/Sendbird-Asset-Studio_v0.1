import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK_MUTED, INFOGRAPHIC_SERIF } from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "kpi-group" }>; scale?: number };

/** A row of big KPI numbers (one column per item). Ports prototype .b-kpi-group. */
export function KpiGroupBlock({ block, scale = 1 }: Props) {
  const cols = block.items.length || 1;
  const fs = (n: number) => Math.round(n * scale);
  return (
    <div style={{ display: "grid", gap: 32, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {block.items.map((it, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6 }}>
          <div
            style={{
              fontFamily: INFOGRAPHIC_SERIF,
              fontSize: fs(72),
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "#292016",
            }}
          >
            {it.number}
          </div>
          <div style={{ fontSize: fs(13), color: INFOGRAPHIC_INK_MUTED }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}
