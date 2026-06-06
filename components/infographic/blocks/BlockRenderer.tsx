import type { InfographicBlock } from "@/lib/types/infographic";
import { StatBlock } from "./StatBlock";
import { KpiGroupBlock } from "./KpiGroupBlock";
import { BarGroupBlock } from "./BarGroupBlock";
import { StepBlock } from "./StepBlock";
import { NodeListBlock } from "./NodeListBlock";

/** Renders a single infographic block by type. */
export function BlockRenderer({ block }: { block: InfographicBlock }) {
  switch (block.type) {
    case "stat":
      return <StatBlock block={block} />;
    case "kpi-group":
      return <KpiGroupBlock block={block} />;
    case "bar-group":
      return <BarGroupBlock block={block} />;
    case "step":
      return <StepBlock block={block} />;
    case "node-list":
      return <NodeListBlock block={block} />;
  }
}
