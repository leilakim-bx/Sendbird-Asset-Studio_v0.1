import type { InfographicBlock } from "@/lib/types/infographic";
import {
  INFOGRAPHIC_INK,
  INFOGRAPHIC_INK_MUTED,
  INFOGRAPHIC_SERIF,
} from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "node-list" }>; scale?: number };

/** Hub + spokes diagram. Ports prototype .b-node-list. */
export function NodeListBlock({ block, scale = 1 }: Props) {
  const fs = (n: number) => Math.round(n * scale);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 40, alignItems: "center" }}>
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}
      >
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: INFOGRAPHIC_INK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 38,
          }}
        >
          ✱
        </div>
        <div>
          <div style={{ fontFamily: INFOGRAPHIC_SERIF, fontSize: fs(24), letterSpacing: "-0.01em", color: INFOGRAPHIC_INK }}>
            {block.hubTitle}
          </div>
          {block.hubSub && (
            <div style={{ fontSize: fs(11), color: INFOGRAPHIC_INK_MUTED, lineHeight: 1.4 }}>{block.hubSub}</div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {block.items.map((it, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr auto",
              alignItems: "center",
              gap: 12,
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(0,0,0,0.06)",
              padding: "10px 14px",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: INFOGRAPHIC_INK,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
              }}
            >
              ◈
            </div>
            <div>
              <div style={{ fontSize: fs(13), fontWeight: 600, color: INFOGRAPHIC_INK }}>{it.label}</div>
              {it.desc && <div style={{ fontSize: fs(11), color: INFOGRAPHIC_INK_MUTED }}>{it.desc}</div>}
            </div>
            {it.tag && (
              <div
                style={{
                  fontSize: fs(9),
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "rgba(0,0,0,0.06)",
                  padding: "3px 7px",
                  borderRadius: 4,
                  color: INFOGRAPHIC_INK_MUTED,
                }}
              >
                {it.tag}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
