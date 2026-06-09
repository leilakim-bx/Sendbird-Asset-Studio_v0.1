import type { InfographicBlock } from "@/lib/types/infographic";
import {
  INFOGRAPHIC_INK,
  INFOGRAPHIC_INK_MUTED,
  INFOGRAPHIC_SERIF,
} from "@/lib/types/infographic";

type Props = { block: Extract<InfographicBlock, { type: "node-list" }>; scale?: number };

/** Single hub→list arrow color (palette mid gray). */
const ARROW = "#8C867E";

/**
 * Hub + list. A circular brand hub (delight logo) on the left points — via a
 * single left-to-right arrow — to a vertical list of node cards on the right.
 * Each card shows a title with an inline tag chip and an optional description.
 */
export function NodeListBlock({ block, scale = 1 }: Props) {
  const fs = (n: number) => Math.round(n * scale);
  const hubSize = Math.round(120 * scale);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
      {/* Hub — the circle is the alignment anchor (arrow + nodes center on it).
          The title floats absolutely below so it never shifts that centering. */}
      <div style={{ position: "relative", flexShrink: 0, lineHeight: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/preview/delight_logo.png"
          alt=""
          width={hubSize}
          height={hubSize}
          style={{ display: "block", width: hubSize, height: hubSize, objectFit: "contain" }}
        />
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 14px)",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontFamily: INFOGRAPHIC_SERIF, fontSize: fs(24), lineHeight: 1.1, letterSpacing: "-0.01em", color: INFOGRAPHIC_INK }}>
            {block.hubTitle}
          </div>
          {block.hubSub && (
            <div style={{ fontSize: fs(11), color: INFOGRAPHIC_INK_MUTED, lineHeight: 1.4 }}>{block.hubSub}</div>
          )}
        </div>
      </div>

      {/* Single hub → list arrow */}
      <svg width={40} height={16} viewBox="0 0 40 16" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M2 8 H36 M30 3 L36 8 L30 13"
          stroke={ARROW}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Node cards — fixed-ish width (shrinks on the narrow blog canvas) so the
          whole hub → list group reads as a centered composition. */}
      <div style={{ flexShrink: 1, width: 440, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {block.items.map((it, i) => (
          <div
            key={i}
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "12px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: fs(15),
                  fontWeight: 600,
                  color: INFOGRAPHIC_INK,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {it.label}
              </span>
              {it.tag && (
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: fs(10),
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    background: "#D9D6D2",
                    padding: "3px 8px",
                    borderRadius: 6,
                    color: INFOGRAPHIC_INK_MUTED,
                  }}
                >
                  {it.tag}
                </span>
              )}
            </div>
            {it.desc && (
              <div style={{ marginTop: 3, fontSize: fs(12), color: INFOGRAPHIC_INK_MUTED, lineHeight: 1.4 }}>{it.desc}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
