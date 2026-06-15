import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompareBlock } from "@/components/infographic/blocks/CompareBlock";
import type { InfographicBlock } from "@/lib/types/infographic";

const comparisonTableBlock: Extract<InfographicBlock, { type: "compare" }> = {
  id: "compare-table-test",
  type: "compare",
  layout: "table",
  columnA: "Before",
  columnB: "After",
  highlightB: true,
  rows: [
    {
      label: "Manual review queue with a long row label",
      a: "Manual review queue",
      b: "Risk surfaced automatically",
    },
  ],
};

const productCardsBlock: Extract<InfographicBlock, { type: "compare" }> = {
  id: "compare-cards-product-test",
  type: "compare",
  layout: "cards",
  columnA: "Before",
  columnB: "After",
  highlightB: true,
  rows: Array.from({ length: 6 }, (_, index) => ({
    a: index === 1
      ? "Manual review queue Manual review queue Manual review queue Manual review queue Manual review queue"
      : `Short before point ${index + 1}`,
    b: `Short after point ${index + 1}`,
  })),
};

describe("CompareBlock", () => {
  it("allows table row labels to wrap inside their fixed grid column", () => {
    const html = renderToStaticMarkup(
      React.createElement(CompareBlock, {
        block: comparisonTableBlock,
        format: "blog",
      }),
    );

    expect(html).toContain("Manual review queue with a long row label");
    expect(html).toContain("grid-template-columns:1.2fr 1fr 1fr");
    expect(html).toContain("white-space:normal");
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).not.toContain("text-overflow:ellipsis");
  });

  it("keeps product comparison cards bounded while preserving padding and readable bullet gaps", () => {
    const html = renderToStaticMarkup(
      React.createElement(CompareBlock, {
        block: productCardsBlock,
        format: "product",
        maxHeight: 540,
      }),
    );

    expect(html).toContain("max-height:540px");
    expect(html).toContain("padding:20px");
    expect(html).toContain("gap:8px");
    expect(html).toContain("-webkit-line-clamp:5");
    expect(html).toContain("overflow-wrap:anywhere");
  });
});
