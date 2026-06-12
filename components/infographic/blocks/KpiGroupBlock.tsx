import type { InfographicBlock, InfographicFormat } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK_MUTED, INFOGRAPHIC_SERIF } from "@/lib/types/infographic";

type Props = {
  block: Extract<InfographicBlock, { type: "kpi-group" }>;
  scale?: number;
  format?: InfographicFormat;
};

/** A row of big KPI numbers (one column per item). Ports prototype .b-kpi-group. */
export function KpiGroupBlock({ block, scale = 1, format }: Props) {
  const isBlog = format === "blog";
  const useTwoColumnBlog = isBlog && block.items.length >= 4;
  const cols = useTwoColumnBlog ? 2 : block.items.length || 1;
  const columnGap = useTwoColumnBlog ? 28 : 32;
  const rowGap = useTwoColumnBlog ? 34 : 32;
  const fs = (n: number) => Math.round(n * scale);
  return (
    <div
      style={{
        display: "grid",
        width: "100%",
        maxWidth: "100%",
        gap: `${rowGap}px ${columnGap}px`,
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {block.items.map((it, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            minWidth: 0,
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: INFOGRAPHIC_SERIF,
              fontSize: fs(72),
              fontWeight: 400,
              letterSpacing: isBlog ? "-0.02em" : "-0.04em",
              lineHeight: 1,
              color: "#292016",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {it.number}
          </div>
          <div
            style={{
              fontSize: fs(13),
              color: INFOGRAPHIC_INK_MUTED,
              lineHeight: 1.4,
              maxWidth: "100%",
              // Clamp to at most 2 lines so uneven label lengths don't stretch a column.
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
