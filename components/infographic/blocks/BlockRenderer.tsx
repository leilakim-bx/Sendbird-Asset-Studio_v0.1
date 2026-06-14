import type { InfographicBlock, InfographicFormat } from "@/lib/types/infographic";
import { StatBlock } from "./StatBlock";
import { KpiGroupBlock } from "./KpiGroupBlock";
import { CardGridBlock } from "./CardGridBlock";
import { BarGroupBlock } from "./BarGroupBlock";
import { StackedBarBlock } from "./StackedBarBlock";
import { StepBlock } from "./StepBlock";
import { StackBlock } from "./StackBlock";
import { NodeListBlock } from "./NodeListBlock";
import { CompareBlock } from "./CompareBlock";
import { LineChartBlock } from "./LineChartBlock";
import { OrbitBlock } from "./OrbitBlock";

/**
 * Renders a single infographic block by type.
 *
 * `scale` lets blocks enlarge product-format typography and key sizing so their
 * content isn't dwarfed by the larger fixed frame.
 * `maxHeight` is a product-format safety bound for dense blocks that can
 * otherwise overflow the fixed 866×660 frame.
 * LineChartBlock is intentionally excluded: its SVG already scales with the
 * wider product canvas, so a font scale on top would double-enlarge it.
 */
export function BlockRenderer({
  block,
  scale = 1,
  maxHeight,
  format,
}: {
  block: InfographicBlock;
  scale?: number;
  maxHeight?: number;
  format?: InfographicFormat;
}) {
  switch (block.type) {
    case "stat":
      return <StatBlock block={block} scale={scale} />;
    case "kpi-group":
      return <KpiGroupBlock block={block} scale={scale} format={format} />;
    case "card-grid":
      return <CardGridBlock block={block} scale={scale} maxHeight={maxHeight} format={format} />;
    case "bar-group":
      return <BarGroupBlock block={block} scale={scale} maxHeight={maxHeight} />;
    case "stacked-bar":
      return <StackedBarBlock block={block} scale={scale} maxHeight={maxHeight} format={format} />;
    case "step":
      return <StepBlock block={block} scale={scale} format={format} />;
    case "stack":
      return <StackBlock block={block} scale={scale} format={format} />;
    case "node-list":
      return <NodeListBlock block={block} scale={scale} format={format} />;
    case "compare":
      return <CompareBlock block={block} scale={scale} format={format} />;
    case "line-chart":
      return <LineChartBlock block={block} />;
    case "orbit":
      return <OrbitBlock block={block} scale={scale} />;
  }
}
