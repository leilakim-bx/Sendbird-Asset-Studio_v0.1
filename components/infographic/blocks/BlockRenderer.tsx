import type { InfographicBlock } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK_MUTED } from "@/lib/types/infographic";
import { StatBlock } from "./StatBlock";

/** Renders a single infographic block. Only `stat` is live in step 2. */
export function BlockRenderer({ block }: { block: InfographicBlock }) {
  switch (block.type) {
    case "stat":
      return <StatBlock block={block} />;
    case "kpi-group":
    case "bar-group":
    case "step":
    case "node-list":
      return <BlockPlaceholder type={block.type} />;
  }
}

function BlockPlaceholder({ type }: { type: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "28px 32px",
        border: "1.5px dashed rgba(124, 113, 102, 0.45)",
        borderRadius: 14,
        background: "rgba(124, 113, 102, 0.06)",
        color: INFOGRAPHIC_INK_MUTED,
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {type}
      </span>
      <span style={{ fontSize: 12, opacity: 0.8 }}>Coming in step 3</span>
    </div>
  );
}
