import type { InfographicBlock } from "@/lib/types/infographic";
import { StatBlock } from "./StatBlock";
import { KpiGroupBlock } from "./KpiGroupBlock";
import { BarGroupBlock } from "./BarGroupBlock";
import { StepBlock } from "./StepBlock";
import { NodeListBlock } from "./NodeListBlock";
import { CompareBlock } from "./CompareBlock";
import { LineChartBlock } from "./LineChartBlock";

/**
 * Renders a single infographic block by type.
 *
 * `scale` multiplies text sizes only (not spacing) — the canvas passes >1 for
 * the fixed-height product format so its copy isn't dwarfed by the larger box.
 * LineChartBlock is intentionally excluded: its SVG already scales with the
 * wider product canvas, so a font scale on top would double-enlarge it.
 */
export function BlockRenderer({ block, scale = 1 }: { block: InfographicBlock; scale?: number }) {
  switch (block.type) {
    case "stat":
      return <StatBlock block={block} scale={scale} />;
    case "kpi-group":
      return <KpiGroupBlock block={block} scale={scale} />;
    case "bar-group":
      return <BarGroupBlock block={block} scale={scale} />;
    case "step":
      return <StepBlock block={block} scale={scale} />;
    case "node-list":
      return <NodeListBlock block={block} scale={scale} />;
    case "compare":
      return <CompareBlock block={block} scale={scale} />;
    case "line-chart":
      return <LineChartBlock block={block} />;
  }
}
