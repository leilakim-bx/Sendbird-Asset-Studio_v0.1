import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlockRenderer } from "@/components/infographic/blocks/BlockRenderer";
import { INFOGRAPHIC_BLOCK_LIMITS } from "@/lib/infographic-block-limits";
import type { InfographicBlock, InfographicFormat } from "@/lib/types/infographic";

function renderBlock(block: InfographicBlock, format: InfographicFormat = "product") {
  return renderToStaticMarkup(
    React.createElement(BlockRenderer, {
      block,
      format,
      scale: 1,
      maxHeight: 540,
    }),
  );
}

describe("infographic block render limits", () => {
  it("defensively limits card grid cards in the renderer", () => {
    const block: InfographicBlock = {
      id: "cards",
      type: "card-grid",
      cards: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.cardGridCards + 2 }, (_, index) => ({
        badge: `0${index + 1}`,
        title: `Card ${index + 1}`,
        body: "Short supporting copy.",
      })),
    };

    const html = renderBlock(block, "blog");

    expect(html).toContain("Card 4");
    expect(html).not.toContain("Card 5");
  });

  it("defensively limits product step blocks to the product frame cap", () => {
    const block: InfographicBlock = {
      id: "steps",
      type: "step",
      items: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stepItems.product + 2 }, (_, index) => ({
        title: `Step ${index + 1}`,
        desc: "Brief process detail.",
      })),
    };

    const html = renderBlock(block, "product");

    expect(html).toContain("Step 5");
    expect(html).not.toContain("Step 6");
  });

  it("defensively limits product process loops to the product frame cap", () => {
    const block: InfographicBlock = {
      id: "process-loop",
      type: "process-loop",
      title: "Level 2: Human steers",
      steps: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.processLoopSteps.product + 2 }, (_, index) => ({
        label: `Loop ${index + 1}`,
      })),
      activeStepIndex: 2,
      loopLabel: "Feedback loop: failures feed back into research",
    };

    const html = renderBlock(block, "product");

    expect(html).toContain("Loop 5");
    expect(html).not.toContain("Loop 6");
    expect(html).toContain("Feedback loop");
  });

  it("clamps product step title and detail copy without changing the card structure", () => {
    const block: InfographicBlock = {
      id: "steps",
      type: "step",
      items: [
        {
          title: "Search refund membership_level VIP cancellation pattern ".repeat(8),
          desc: "Search refund membership_level VIP to identify cancellation patterns before escalation ".repeat(8),
          badge: "Long badge copy",
        },
      ],
    };

    const html = renderBlock(block, "product");

    expect(html).toContain("-webkit-line-clamp:2");
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).toContain("text-overflow:ellipsis");
  });

  it("defensively limits product layer diagrams to three layers", () => {
    const block: InfographicBlock = {
      id: "stack",
      type: "stack",
      layers: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stackLayers.blog + 1 }, (_, index) => ({
        title: `Layer ${index + 1}`,
        caption: "Brief layer detail.",
        cells: [{ title: `Cell ${index + 1}` }],
      })),
    };

    const html = renderBlock(block, "product");

    expect(html).toContain("Layer 3");
    expect(html).not.toContain("Layer 4");
  });

  it("keeps blog layer diagrams at the broader layer cap", () => {
    const block: InfographicBlock = {
      id: "stack",
      type: "stack",
      layers: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stackLayers.blog + 1 }, (_, index) => ({
        title: `Layer ${index + 1}`,
        caption: "Brief layer detail.",
        cells: [{ title: `Cell ${index + 1}` }],
      })),
    };

    const html = renderBlock(block, "blog");

    expect(html).toContain("Layer 4");
    expect(html).not.toContain("Layer 5");
  });

  it("clamps product layer diagram copy inside each band and cell", () => {
    const block: InfographicBlock = {
      id: "stack",
      type: "stack",
      layers: [
        {
          title: "Long orchestration layer title ".repeat(6),
          caption: "Long layer caption explaining every routing rule and dependency ".repeat(6),
          cells: [
            {
              title: "Long cell title with policy and routing detail ".repeat(6),
              desc: "Long cell description that would otherwise push the layer taller than the product canvas ".repeat(6),
            },
          ],
        },
      ],
    };

    const html = renderBlock(block, "product");

    expect(html).toContain("-webkit-line-clamp:2");
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).toContain("text-overflow:ellipsis");
  });

  it("defensively limits multi-series bar rows and series", () => {
    const block: InfographicBlock = {
      id: "stacked",
      type: "stacked-bar",
      layout: "grouped",
      series: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stackedBarSeries + 2 }, (_, index) => `Series ${index + 1}`),
      rows: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stackedBarRows.product + 2 }, (_, rowIndex) => ({
        label: `Row ${rowIndex + 1}`,
        values: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.stackedBarSeries + 2 }, (_, seriesIndex) => 10 + rowIndex + seriesIndex),
      })),
    };

    const html = renderBlock(block, "product");

    expect(html).toContain("Series 4");
    expect(html).not.toContain("Series 5");
    expect(html).toContain("Row 6");
    expect(html).not.toContain("Row 7");
  });

  it("defensively limits column charts to six columns", () => {
    const block: InfographicBlock = {
      id: "columns",
      type: "bar-group",
      variant: "columns",
      items: Array.from({ length: INFOGRAPHIC_BLOCK_LIMITS.barColumnsItems + 2 }, (_, index) => ({
        heading: `Lv.${index + 1}`,
        label: `Column ${index + 1}`,
        tag: "ZTI",
        valueA: 10 + index,
      })),
    };

    const html = renderBlock(block, "product");

    expect(html).toContain("Column 6");
    expect(html).not.toContain("Column 7");
  });

  it("clamps line chart legend labels so trend comparisons stay inside the frame", () => {
    const block: InfographicBlock = {
      id: "trend",
      type: "line-chart",
      xLabels: ["Jan", "Feb", "Mar"],
      seriesA: { label: "Very long primary trend series label ".repeat(5), values: [10, 20, 30] },
      seriesB: { label: "Very long comparison trend series label ".repeat(5), values: [30, 24, 18] },
    };

    const html = renderBlock(block, "product");

    expect(html).toContain("max-width:190px");
    expect(html).toContain("text-overflow:ellipsis");
  });
});
