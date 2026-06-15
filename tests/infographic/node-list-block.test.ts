import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NodeListBlock } from "@/components/infographic/blocks/NodeListBlock";
import { BlockEditor } from "@/components/infographic/sidebar/BlockEditor";
import { INFOGRAPHIC_BLOCK_LIMITS } from "@/lib/infographic-block-limits";
import { brand } from "@/lib/tokens/brand";
import type { InfographicBlock } from "@/lib/types/infographic";

const nodeListBlock: Extract<InfographicBlock, { type: "node-list" }> = {
  id: "node-list-test",
  type: "node-list",
  hubTitle: "Hub",
  hubSub: "hub sub title max like this max 2 lines max 2 lines blah blah THIS SHOULD NOT RENDER",
  items: [{ label: "Manual review queue", desc: "Risk surfaced automatically", tag: "Tag" }],
};

describe("NodeListBlock", () => {
  it("limits Hub map subtitle editing to the shared character cap", () => {
    const html = renderToStaticMarkup(
      React.createElement(BlockEditor, {
        block: nodeListBlock,
        format: "blog",
        onChange: () => undefined,
      }),
    );

    expect(html).toContain(`Hub subtitle (max ${INFOGRAPHIC_BLOCK_LIMITS.hubSubtitleChars})`);
    expect(html).toContain(`maxLength="${INFOGRAPHIC_BLOCK_LIMITS.hubSubtitleChars}"`);
  });

  it("renders the Hub map subtitle as a capped two-line label", () => {
    const html = renderToStaticMarkup(
      React.createElement(NodeListBlock, {
        block: nodeListBlock,
        format: "blog",
      }),
    );

    expect(html).toContain("-webkit-line-clamp:2");
    expect(html).toContain("hub sub title max like this");
    expect(html).not.toContain("THIS SHOULD NOT RENDER");
  });

  it("renders Hub map node tags with stronger muted text", () => {
    const html = renderToStaticMarkup(
      React.createElement(NodeListBlock, {
        block: nodeListBlock,
        format: "blog",
      }),
    );

    expect(html).toContain("Tag");
    expect(html).toContain(`color:${brand.color.inkMutedStrong}`);
  });
});
