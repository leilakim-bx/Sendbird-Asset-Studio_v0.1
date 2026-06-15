import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { InfographicSidebar } from "@/components/infographic/InfographicSidebar";
import { ProductVisualSidebar } from "@/components/product-visual/ProductVisualSidebar";
import { useEditorStore } from "@/lib/store";
import { getTemplate } from "@/lib/template-registry";

function resetTransientEditorState() {
  useEditorStore.setState({
    infographicContent: null,
    productVisualContent: null,
  });
}

describe("editor sidebars", () => {
  beforeEach(() => {
    resetTransientEditorState();
  });

  it("renders Product Visual controls from fallback content before store hydration", () => {
    const template = getTemplate("product-visual");
    if (!template || template.kind !== "product-visual") throw new Error("Missing product visual template");

    const html = renderToStaticMarkup(
      React.createElement(ProductVisualSidebar, { content: template.defaultContent }),
    );

    expect(html).toContain("Format");
    expect(html).toContain("Concept UI");
  });

  it("renders Infographic controls from fallback content before store hydration", () => {
    const template = getTemplate("infographic");
    if (!template || template.kind !== "infographic") throw new Error("Missing infographic template");

    const html = renderToStaticMarkup(
      React.createElement(InfographicSidebar, {
        content: template.defaultContent,
        articleImages: [],
        activeArticleImageId: null,
        onSuggestArticleImages: async () => ({ count: 0, notice: "" }),
        onSelectArticleImage: () => undefined,
        onToggleArticleImage: () => undefined,
      }),
    );

    expect(html).toContain("Create from source");
    expect(html).toContain("Selected image");
    expect(html).toContain("Orbit diagram");
    expect(html).toContain("Hub map");
    expect(html).toContain("Comparison cards");
    expect(html).not.toContain("Layer diagram");
  });

  it("keeps a library-selected Infographic block at the top of the block section", () => {
    const template = getTemplate("infographic");
    if (!template || template.kind !== "infographic") throw new Error("Missing infographic template");
    const content = {
      ...template.defaultContent,
      showTitle: false,
      blocks: [
        {
          id: "trend-test",
          type: "line-chart" as const,
          xLabels: ["Point 1", "Point 2", "Point 3"],
          seriesA: { label: "Value", values: [1, 2, 3] },
          fill: true,
        },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(InfographicSidebar, {
        content,
        articleImages: [],
        activeArticleImageId: null,
        onSuggestArticleImages: async () => ({ count: 0, notice: "" }),
        onSelectArticleImage: () => undefined,
        onToggleArticleImage: () => undefined,
      }),
    );

    expect(html).toContain("Trend");
    expect(html.indexOf("Trend")).toBeLessThan(html.indexOf("Orbit diagram"));
    expect(html).toContain("Hub map");
    expect(html).toContain("Comparison cards");
    expect(html).not.toContain("Layer diagram");
  });
});
