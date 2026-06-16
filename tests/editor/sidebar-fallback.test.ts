import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { InfographicSidebar } from "@/components/infographic/InfographicSidebar";
import {
  buildOptimizedPlannerSource,
  getPlannerInfographicVariant,
  getPlannerThumbnailSrc,
} from "@/components/layout/Sidebar";
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
    expect(html).toContain("Create from brief");
    expect(html).toContain("Show Product Visual blocks");
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

  it("matches Create with Codex thumbnails to suggested visual intent", () => {
    expect(
      getPlannerInfographicVariant({
        id: "supporting-infographic",
        template: "Infographic",
        title: "Before and after explanation",
        use: "Use after the hero to explain the improvement",
        brief: "Show what changed before and after.",
      }),
    ).toBe("comparison");

    expect(
      getPlannerInfographicVariant({
        id: "infographic-workflow",
        template: "Infographic",
        title: "Workflow explanation",
        use: "Use in the how-it-works section",
        brief: "Explain the workflow in simple steps or a loop.",
      }),
    ).toBe("diagram");

    expect(
      getPlannerThumbnailSrc({
        id: "primary-product-visual",
        template: "Product Visual",
        title: "Main product visual",
        use: "Use as the main page or release visual",
        brief: "Show the core feature as a polished product moment.",
      }),
    ).toBe("/preview/productvisual_card.png");
  });

  it("prepends an optimized brief while preserving the original page copy", () => {
    const source = [
      "Introducing Actionbook Editor: Edit your AI's rules like a Notion doc.",
      "",
      "Actionbooks get long. Fast.",
      "Ops teams know exactly what needs to change, but engineering owns the backlog.",
      "The editor shows rules on the left, live Preview and Tester on the right, and a Tree view for conditional branches.",
    ].join("\n");

    const optimized = buildOptimizedPlannerSource(source);

    expect(optimized).toContain("Brief for image suggestions:");
    expect(optimized).toContain("Feature: Actionbook Editor");
    expect(optimized).toContain("Core message: Edit your AI's rules like a Notion doc");
    expect(optimized).toContain("Visual priority: Product Visual Details panel, Card, Infographic workflow");
    expect(optimized).toContain("Original copy:");
    expect(optimized).toContain(source);
    expect(buildOptimizedPlannerSource(optimized)).toBe(optimized);
  });
});
