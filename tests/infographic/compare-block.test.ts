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
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).not.toContain("-webkit-line-clamp");
  });

  it("clamps product comparison table cells inside the fixed product frame", () => {
    const html = renderToStaticMarkup(
      React.createElement(CompareBlock, {
        block: {
          ...comparisonTableBlock,
          rows: Array.from({ length: 6 }, (_, index) => ({
            label: `Long comparison row label ${index + 1} `.repeat(8),
            a: `Long before value ${index + 1} `.repeat(8),
            b: `Long after value ${index + 1} `.repeat(8),
          })),
        },
        format: "product",
        maxHeight: 540,
      }),
    );

    expect(html).toContain("max-height:540px");
    expect(html).toContain("-webkit-line-clamp:2");
    expect(html).toContain("overflow-wrap:anywhere");
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
    expect(html).toContain("font-size:16px");
    expect(html).not.toContain("font-size:14px;line-height:1.35");
    expect(html).not.toContain("font-size:15px;line-height:1.35");
    expect(html).toContain("gap:8px");
    expect(html).toContain("-webkit-line-clamp:5");
    expect(html).toContain("overflow-wrap:anywhere");
  });
});
