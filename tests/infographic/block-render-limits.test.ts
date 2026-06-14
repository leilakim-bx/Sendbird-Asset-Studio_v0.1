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

    expect(html).toContain("Step 8");
    expect(html).not.toContain("Step 9");
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
});
