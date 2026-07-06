import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlockRenderer } from "@/components/infographic/blocks/BlockRenderer";
import type { InfographicBlock } from "@/lib/types/infographic";

const hubOrbitBlock: Extract<InfographicBlock, { type: "orbit" }> = {
  id: "hub-orbit-test",
  type: "orbit",
  variant: "hub-spoke",
  center: "delight",
  satellites: [{ key: "web" }, { key: "chat" }, { key: "slack" }, { key: "email" }],
};

describe("OrbitBlock", () => {
  it("uses a compact hub-spoke stage in Blog/Perspective format", () => {
    const html = renderToStaticMarkup(
      React.createElement(BlockRenderer, {
        block: hubOrbitBlock,
        format: "blog",
      }),
    );

    expect(html).toContain("height:404px");
    expect(html).toContain("viewBox=\"0 0 560 404\"");
  });

  it("keeps the larger hub-spoke stage in Product feature format", () => {
    const html = renderToStaticMarkup(
      React.createElement(BlockRenderer, {
        block: hubOrbitBlock,
        format: "product",
      }),
    );

    expect(html).toContain("height:460px");
    expect(html).toContain("viewBox=\"0 0 560 460\"");
  });
});
