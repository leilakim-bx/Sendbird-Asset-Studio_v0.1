import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeatureMockup } from "@/components/templates/FeatureMockup";
import { InfographicCanvas } from "@/components/infographic/InfographicCanvas";
import { ProductVisualCanvas } from "@/components/product-visual/ProductVisualCanvas";
import { WORK_DATA_SCHEMA_VERSION } from "@/lib/work-data-schema";
import type { ChatMessage } from "@/lib/store";
import type { InfographicContent } from "@/lib/types/infographic";
import type { ProductVisualContent } from "@/lib/types/product-visual";

function expectStableMarkup(html: string) {
  expect(html).not.toContain("NaN");
  expect(html).not.toContain("Infinity");
  expect(html).not.toContain("undefined");
}

const chatMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    sender: "Aubrey",
    block: { type: "text", text: "Continuing from my email yesterday..." },
  },
  {
    id: "m2",
    role: "bot",
    sender: "delight.ai",
    block: { type: "text", text: "Order #4821 delay — I already escalated it. Refund on the way." },
  },
];

function renderChatMockup(layout: "center" | "split", exportSize: "desktop" | "mobile") {
  return renderToStaticMarkup(React.createElement(FeatureMockup, {
    layout,
    exportSize,
    backgroundUrl: "/background/bg-200.png",
    appName: "delight.ai",
    messages: chatMessages,
    userName: "Aubrey",
  }));
}

function extractPhoneFrameWidth(html: string, radius: number) {
  const match = html.match(new RegExp(`width:(\\d+)px;border-radius:${radius}px;overflow:hidden;box-shadow`));
  expect(match).not.toBeNull();
  return Number(match?.[1]);
}

describe("export canvas visual smoke", () => {
  it("keeps the desktop chat phone frame size stable between center and split layouts", () => {
    const center = renderChatMockup("center", "desktop");
    const split = renderChatMockup("split", "desktop");

    expectStableMarkup(center);
    expectStableMarkup(split);
    expect(extractPhoneFrameWidth(center, 32)).toBe(370);
    expect(extractPhoneFrameWidth(split, 32)).toBe(370);
  });

  it("keeps the mobile chat phone frame size stable regardless of layout selection", () => {
    const center = renderChatMockup("center", "mobile");
    const split = renderChatMockup("split", "mobile");

    expectStableMarkup(center);
    expectStableMarkup(split);
    expect(extractPhoneFrameWidth(center, 26)).toBe(250);
    expect(extractPhoneFrameWidth(split, 26)).toBe(250);
  });

  it("renders a product infographic frame with fixed export dimensions", () => {
    const content: InfographicContent = {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      format: "product",
      bg: "warmgray",
      accent: "lime",
      title: "AI support impact",
      footnote: "Resolution rate increased after automation.",
      blocks: [
        {
          id: "bars",
          type: "bar-group",
          variant: "ranked",
          unit: "%",
          items: [
            { label: "Resolved", valueA: 72, highlight: true },
            { label: "Assisted", valueA: 51 },
            { label: "Manual", valueA: 34 },
          ],
        },
      ],
    };

    const html = renderToStaticMarkup(React.createElement(InfographicCanvas, { content, exportMode: true }));

    expectStableMarkup(html);
    expect(html).toContain("width:866px");
    expect(html).toContain("height:660px");
    expect(html).toContain("Resolved");
  });

  it("renders a blog infographic frame without collapsing variable height", () => {
    const content: InfographicContent = {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      format: "blog",
      bg: "warmgray",
      accent: "lime",
      title: "Support impact metrics",
      blocks: [
        {
          id: "metric",
          type: "kpi-group",
          items: [
            { number: "83%", label: "Automated before review" },
            { number: "3.1x", label: "Faster triage" },
            { number: "18k", label: "Resolved messages" },
          ],
        },
      ],
    };

    const html = renderToStaticMarkup(React.createElement(InfographicCanvas, { content, exportMode: true }));

    expectStableMarkup(html);
    expect(html).toContain("width:664px");
    expect(html).toContain("min-height:360px");
    expect(html).toContain("Support impact metrics");
  });

  it("renders a product visual Blob screenshot URL without embedding a data URL", () => {
    const content: ProductVisualContent = {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      format: "release-thumbnail",
      layout: "side-by-side",
      bg: "warmgray",
      sourceMode: "screenshot",
      title: "Release thumbnail",
      screenshot: {
        url: "https://store.public.blob.vercel-storage.com/asset-images/product-visual-screenshot/demo.png",
        displayMode: "crop",
        naturalWidth: 1440,
        naturalHeight: 900,
        crop: { x: 0.1, y: 0.12, width: 0.72, height: 0.52 },
      },
    };

    const html = renderToStaticMarkup(React.createElement(ProductVisualCanvas, { content, exportMode: true }));

    expectStableMarkup(html);
    expect(html).toContain("width:667px");
    expect(html).toContain("height:316px");
    expect(html).toContain("blob.vercel-storage.com");
    expect(html).not.toContain("data:image");
  });

  it("does not render a screenshot source in product feature format", () => {
    const content: ProductVisualContent = {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      format: "feature-desktop",
      layout: "center",
      bg: "warmgray",
      bgImage: "/background/bg-200.png",
      sourceMode: "screenshot",
      title: "Product feature",
      screenshot: {
        url: "https://store.public.blob.vercel-storage.com/asset-images/product-visual-screenshot/feature.png",
        displayMode: "highlight",
        naturalWidth: 1440,
        naturalHeight: 900,
        crop: { x: 0.12, y: 0.14, width: 0.62, height: 0.48 },
      },
    };

    const html = renderToStaticMarkup(React.createElement(ProductVisualCanvas, { content, exportMode: true }));

    expectStableMarkup(html);
    expect(html).toContain("width:866px");
    expect(html).toContain("height:660px");
    expect(html).not.toContain("product-visual-screenshot/feature.png");
  });
});
