import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK, INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "bar-group" }> };

const TRACK = "rgba(0,0,0,0.08)";
const BAR_B = "rgba(0,0,0,0.35)";

/**
 * Comparison bars (A vs optional B). Ports prototype .b-bar-group.
 * The "A" fill + legend swatch read var(--ig-accent) so the Accent picker
 * actually changes them (the prototype hardcoded lime).
 */
export function BarGroupBlock({ block }: Props) {
  const { items, unit, labelA, labelB } = block;
  const u = unit ?? "%";
  const maxV = Math.max(...items.flatMap((it) => [it.valueA, it.valueB ?? 0]), 1);
  const anyB = items.some((it) => (it.valueB ?? 0) > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((it, i) => {
        const aW = (it.valueA / maxV) * 100;
        const hasB = (it.valueB ?? 0) > 0;
        const bW = hasB ? ((it.valueB as number) / maxV) * 100 : 0;
        return (
          <div
            key={i}
            style={{ display: "grid", gridTemplateColumns: "200px 1fr", alignItems: "center", gap: 16 }}
          >
            <div
              style={{
                fontSize: 13,
                color: INFOGRAPHIC_INK,
                textAlign: "right",
                fontWeight: it.highlight ? 600 : 400,
              }}
            >
              {it.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ height: 14, borderRadius: 3, position: "relative", background: TRACK }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${aW}%`,
                    background: "var(--ig-accent)",
                    ...(it.highlight
                      ? { outline: `2px solid ${INFOGRAPHIC_INK}`, outlineOffset: 1 }
                      : {}),
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: -36,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: INFOGRAPHIC_INK,
                  }}
                >
                  {it.valueA}
                  {u}
                </span>
              </div>
              {hasB && (
                <div style={{ height: 14, borderRadius: 3, position: "relative", background: TRACK }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${bW}%`, background: BAR_B }} />
                  <span
                    style={{
                      position: "absolute",
                      right: -36,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 11,
                      fontWeight: 400,
                      color: INFOGRAPHIC_INK_MUTED,
                    }}
                  >
                    {it.valueB}
                    {u}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {anyB && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 6,
            paddingLeft: 216,
            fontSize: 11,
            color: INFOGRAPHIC_INK_MUTED,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--ig-accent)" }} />
            {labelA ?? "A"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: BAR_B }} />
            {labelB ?? "B"}
          </div>
        </div>
      )}
    </div>
  );
}
