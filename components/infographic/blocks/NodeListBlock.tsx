import type { InfographicBlock, InfographicFormat } from "@/lib/types/infographic";
import {
  INFOGRAPHIC_INK,
  INFOGRAPHIC_INK_MUTED,
  INFOGRAPHIC_SERIF,
} from "@/lib/types/infographic";
import { INFOGRAPHIC_BLOCK_LIMITS } from "@/lib/infographic-block-limits";
import { brand } from "@/lib/tokens/brand";
import { DelightMark } from "./DelightMark";

type Props = {
  block: Extract<InfographicBlock, { type: "node-list" }>;
  scale?: number;
  format?: InfographicFormat;
};

/** Single hub→list arrow color (palette mid gray). */
const ARROW = brand.color.inkMuted;

/**
 * Hub + list. A circular brand hub (delight logo) on the left points — via a
 * single left-to-right arrow — to a vertical list of node cards on the right.
 * Each card shows a title with an inline tag chip and an optional description.
 */
export function NodeListBlock({ block, scale = 1, format }: Props) {
  const items = block.items.slice(0, INFOGRAPHIC_BLOCK_LIMITS.nodeListItems);
  const isBlog = format === "blog";
  const fs = (n: number) => Math.round(n * scale);
  const hubSize = Math.round((isBlog ? 88 : 120) * scale);
  const titleWidth = Math.round((isBlog ? 136 : 220) * scale);
  const titleFontSize = fs(isBlog ? 18 : 24);
  const groupGap = isBlog ? 20 : 24;
  const arrowWidth = isBlog ? 34 : 40;
  const listWidth = isBlog ? 360 : 440;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: groupGap }}>
      {/* Hub — the circle is the alignment anchor (arrow + nodes center on it).
          The title floats absolutely below so it never shifts that centering. */}
      <div style={{ position: "relative", flexShrink: 0, lineHeight: 0 }}>
        <DelightMark size={hubSize} />
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 14px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: titleWidth,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: INFOGRAPHIC_SERIF,
              fontSize: titleFontSize,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: INFOGRAPHIC_INK,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {block.hubTitle}
          </div>
          {block.hubSub && (
            <div style={{ fontSize: fs(11), color: INFOGRAPHIC_INK_MUTED, lineHeight: 1.4 }}>{block.hubSub}</div>
          )}
        </div>
      </div>

      {/* Single hub → list arrow */}
      <svg width={arrowWidth} height={16} viewBox="0 0 40 16" fill="none" style={{ flexShrink: 0 }}>
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
      <div style={{ flexShrink: 1, width: listWidth, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              background: brand.color.infographic.paper,
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
                    background: brand.color.infographic.chip,
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
