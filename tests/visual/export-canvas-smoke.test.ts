import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeatureMockup } from "@/components/templates/FeatureMockup";
import { InfographicCanvas } from "@/components/infographic/InfographicCanvas";
import { ProductVisualCanvas } from "@/components/product-visual/ProductVisualCanvas";
import { ProductVisualSidebar } from "@/components/product-visual/ProductVisualSidebar";
import { ModalScene } from "@/components/concept-ui/archetypes/ModalScene";
import { brand } from "@/lib/tokens/brand";
import { WORK_DATA_SCHEMA_VERSION } from "@/lib/work-data-schema";
import type { ChatMessage } from "@/lib/store";
import { getTemplate } from "@/lib/template-registry";
import type { ModalSceneSpec } from "@/lib/concept-ui/scene-spec";
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

  it("uses a compact number size for four-up product metrics", () => {
    const content: InfographicContent = {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      format: "product",
      bg: "warmgray",
      accent: "lime",
      showTitle: false,
      blocks: [
        {
          id: "metric",
          type: "kpi-group",
          items: [
            { number: "1,000", label: "We surveyed U.S consumers" },
            { number: "2,000", label: "consumers across five industries" },
            { number: "47%", label: "of consumers want to stay in control" },
            { number: "16%", label: "are comfortable with AI acting alone" },
          ],
        },
      ],
    };

    const html = renderToStaticMarkup(React.createElement(InfographicCanvas, { content, exportMode: true }));

    expectStableMarkup(html);
    expect(html).toContain("font-size:69px");
    expect(html).toContain("gap:32px 22px");
    expect(html).toContain("1,000");
  });

  it("suppresses content title and footnote for process loops in product and blog formats", () => {
    for (const format of ["product", "blog"] as const) {
      const content: InfographicContent = {
        schemaVersion: WORK_DATA_SCHEMA_VERSION,
        format,
        bg: "warmgray",
        accent: "lime",
        title: "Global title should not render",
        footnote: "Global footnote should not render",
        showTitle: true,
        blocks: [
          {
            id: "loop",
            type: "process-loop",
            title: "Process loop title",
            steps: [{ label: "Detect" }, { label: "Prioritize" }, { label: "Resolve" }],
            activeStepIndex: 1,
            loopLabel: "Feedback loop stays visible",
          },
        ],
      };

      const html = renderToStaticMarkup(React.createElement(InfographicCanvas, { content, exportMode: true }));

      expectStableMarkup(html);
      expect(html).toContain("Process loop title");
      expect(html).toContain("Feedback loop stays visible");
      expect(html).not.toContain("Global title should not render");
      expect(html).not.toContain("Global footnote should not render");
    }
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

  it("uses the light product card image as the default Product Visual placeholder", () => {
    const template = getTemplate("product-visual");
    if (!template || template.kind !== "product-visual") throw new Error("Missing product visual template");

    expect(template.defaultContent.format).toBe("blog");
    const html = renderToStaticMarkup(
      React.createElement(ProductVisualCanvas, { content: template.defaultContent, exportMode: true }),
    );

    expectStableMarkup(html);
    expect(html).toContain("/preview/product_visual.png");
  });

  it("uses actual Product Visual block preview images in the block picker", () => {
    const template = getTemplate("product-visual");
    if (!template || template.kind !== "product-visual") throw new Error("Missing product visual template");

    const html = renderToStaticMarkup(React.createElement(ProductVisualSidebar, { content: template.defaultContent }));

    expectStableMarkup(html);
    expect(html).toContain("Choose a block");
    expect(html).toContain("/preview/productvisual_card.png");
    expect(html).toContain("/preview/productvisual_floatingmodal.png");
  });

  it("exposes only compact editable slots for the Product Visual details panel", () => {
    const template = getTemplate("product-visual");
    if (!template || template.kind !== "product-visual") throw new Error("Missing product visual template");
    const conceptScene = {
      archetype: "modal",
      theme: "light",
      content: {
        productName: "delight.ai Actions",
        title: "Steward details",
        subtitle: "A compact details panel.",
        background: { type: "inbox", title: "Case context", items: ["Customer request", "Tool lookup", "Policy check"] },
        modal: {
          slotId: "moment-approval",
          kind: "confirmation",
          eyebrow: "Steward details",
          title: "Steward details",
          description: "Review before approving.",
          fields: [
            { slotId: "moment-detail-type", label: "Detail type", value: "Customer request — multi-step" },
            { slotId: "moment-detail-name", label: "Detail name", value: "Resolution Review Request" },
            { slotId: "moment-detail-status", label: "Detail status", value: "RESOLUTION" },
            { slotId: "moment-detail-time", label: "Detail time", value: "8 minutes" },
            { slotId: "moment-activity-1-tag", label: "Activity 1 tag", value: "Steward triggered" },
            { slotId: "moment-activity-1-text", label: "Activity 1 text", value: "Customer resolution workflow initiated" },
            { slotId: "moment-activity-2-tag", label: "Activity 2 tag", value: "Policy check" },
            { slotId: "moment-activity-2-text", label: "Activity 2 text", value: "Looked up customer context" },
            { slotId: "moment-activity-3-tag", label: "Activity 3 tag", value: "AI prepared" },
            { slotId: "moment-activity-3-text", label: "Activity 3 text", value: "Checked policy guardrail" },
          ],
          actions: [
            { label: "Approve", tone: "primary" },
            { label: "Modify", tone: "secondary" },
          ],
        },
        actionTrails: [],
      },
      modifiers: {},
    } satisfies ModalSceneSpec;
    const content = {
      ...template.defaultContent,
      sourceMode: "concept",
      conceptScene,
      screenshot: {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='820' height='720'/%3E",
        displayMode: "crop",
        naturalWidth: 820,
        naturalHeight: 720,
      },
    } satisfies ProductVisualContent;

    const html = renderToStaticMarkup(React.createElement(ProductVisualSidebar, { content }));

    expectStableMarkup(html);
    expect(html).toContain("Show information");
    expect(html).toContain("role=\"switch\"");
    expect(html).toContain("aria-checked=\"true\"");
    expect(html).toContain("Information");
    expect(html).toContain("Activity");
    expect(html).toContain("Tag 1");
    expect(html).toContain("Text 3");
    expect(html).not.toContain("Tag 4");
    expect(html).toContain("Resolution Review Request");
    expect(html).not.toContain("Update visual");
    expect(html).not.toContain("Body type");
  });

  it("contains uncropped Product Visual screenshots inside the fixed thumbnail height", () => {
    const content: ProductVisualContent = {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      format: "release-thumbnail",
      layout: "center",
      bg: "warmgray",
      sourceMode: "screenshot",
      title: "Product moment",
      screenshot: {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'/%3E",
        displayMode: "crop",
        naturalWidth: 1600,
        naturalHeight: 900,
      },
    };

    const html = renderToStaticMarkup(React.createElement(ProductVisualCanvas, { content, exportMode: true }));

    expectStableMarkup(html);
    expect(html).toContain("height:252px");
    expect(html).not.toContain("max-height:252px");
  });

  it("preserves 60px vertical padding for Concept UI auto-height formats", () => {
    const conceptScene = {
      archetype: "modal",
      theme: "light",
      content: {
        productName: "delight.ai",
        title: "AI-prepared response",
        subtitle: "A compact review card.",
        background: { type: "inbox", title: "Conversation", items: ["Customer request"] },
        modal: {
          slotId: "moment-ai-response",
          kind: "ai-result",
          eyebrow: "Generated draft",
          title: "AI-prepared response",
          description: "Review before sending.",
          fields: [],
          actions: [],
        },
      },
      modifiers: {},
    } satisfies ModalSceneSpec;

    for (const format of ["blog", "release-insert"] as const) {
      const content = {
        schemaVersion: WORK_DATA_SCHEMA_VERSION,
        format,
        layout: "center",
        bg: "warmgray",
        sourceMode: "concept",
        title: "Product moment",
        conceptScene,
        screenshot: {
          url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='920'/%3E",
          displayMode: "crop",
          naturalWidth: 1000,
          naturalHeight: 920,
        },
      } satisfies ProductVisualContent;

      const html = renderToStaticMarkup(React.createElement(ProductVisualCanvas, { content, exportMode: true }));

      expectStableMarkup(html);
      expect(html).toContain("padding:60px 48px");
      expect(html).not.toContain("padding:12px 12px");
      expect(html).toContain(format === "blog" ? "width:408px" : "width:584px");
    }
  });

  it("uses top-only padding for Product Visual details panel auto-height formats", () => {
    const conceptScene = {
      archetype: "modal",
      theme: "light",
      content: {
        productName: "delight.ai Actions",
        title: "Steward details",
        subtitle: "A compact details panel.",
        background: { type: "inbox", title: "Case context", items: ["Customer request"] },
        modal: {
          slotId: "moment-approval",
          kind: "confirmation",
          eyebrow: "Steward details",
          title: "Steward details",
          description: "Review before approving.",
          fields: [],
          actions: [],
        },
        actionTrails: [],
      },
      modifiers: {},
    } satisfies ModalSceneSpec;
    const content = {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      format: "blog",
      layout: "center",
      bg: "warmgray",
      sourceMode: "concept",
      title: "Product moment",
      conceptScene,
      screenshot: {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='820' height='720'/%3E",
        displayMode: "crop",
        naturalWidth: 820,
        naturalHeight: 720,
      },
    } satisfies ProductVisualContent;

    const html = renderToStaticMarkup(React.createElement(ProductVisualCanvas, { content, exportMode: true }));

    expectStableMarkup(html);
    expect(html).toContain("align-items:flex-start");
    expect(html).toContain("padding:60px 48px 0");
    expect(html).not.toContain("padding:60px 48px 60px");
  });

  it("renders Product Visual details panel as a cropped dashboard view", () => {
    const spec = {
      archetype: "modal",
      theme: "light",
      content: {
        productName: "delight.ai Actions",
        title: "Approve proposed action?",
        subtitle: "A compact details panel.",
        background: {
          type: "inbox",
          title: "Case context",
          items: ["Customer request", "Tool lookup", "Policy check"],
        },
        modal: {
          slotId: "moment-approval",
          kind: "confirmation",
          eyebrow: "Steward details",
          title: "Steward details",
          description: "Review the task history before approving.",
          fields: [
            { slotId: "moment-detail-type", label: "Detail type", value: "Flight cancellation — multi-step" },
            { slotId: "moment-detail-name", label: "Detail name", value: "Refund Approval Request" },
            { slotId: "moment-detail-status", label: "Detail status", value: "RESOLUTION" },
            { slotId: "moment-detail-time", label: "Detail time", value: "12 minutes" },
            { slotId: "moment-activity-1-tag", label: "Activity 1 tag", value: "Steward triggered" },
            { slotId: "moment-activity-1-text", label: "Activity 1 text", value: "Flight cancellation workflow initiated" },
            { slotId: "moment-activity-2-tag", label: "Activity 2 tag", value: "API call" },
            { slotId: "moment-activity-2-text", label: "Activity 2 text", value: "Booking system pulled policy context" },
            { slotId: "moment-activity-3-tag", label: "Activity 3 tag", value: "Voice call" },
            { slotId: "moment-activity-3-text", label: "Activity 3 text", value: "United Airlines desk confirmed the rebook" },
          ],
          actions: [
            { label: "Approve", tone: "primary" },
            { label: "Modify", tone: "secondary" },
          ],
        },
        actionTrails: [
          {
            slotId: "moment-action-trail",
            title: "AI action trail",
            steps: [
              { label: "Looked up customer context", duration: "0.8s", status: "Done", tone: "good" },
              { label: "Paused for approval", status: "Gate", tone: "warn" },
            ],
            gate: {
              title: "Approve proposed action?",
              detail: "Human approval required before publish",
              primaryAction: "Approve",
              secondaryAction: "Modify",
            },
          },
        ],
      },
      modifiers: {},
    } satisfies ModalSceneSpec;

    const html = renderToStaticMarkup(React.createElement(ModalScene, { spec }));

    expectStableMarkup(html);
    expect(html).toContain('data-concept-crop-bounds="true"');
    expect(html).toContain("width:820px");
    expect(html).toContain("height:720px");
    expect(html).toContain("overflow:hidden");
    expect(html).toContain("margin-top:60px");
    expect(html).toContain("font-size:18px;font-weight:500");
    expect(html).not.toContain(`border:1px solid ${brand.color.concept.border}`);
    expect(html).toContain("font-weight:400");
    expect(html).toContain("Steward details");
    expect(html).toContain("Information");
    expect(html).toContain("Activity");
    expect(html).toContain("RESOLUTION");
    expect(html).toContain("Refund Approval Request");
    expect(html).toContain("Booking system pulled policy context");
    expect(html).not.toContain("font-size:24px");
    expect(html).not.toContain("AI ACTION TRAIL");
    expect(html).not.toContain("Approve proposed action?");
    expect(html).not.toContain(brand.color.concept.surface);
  });

  it("renders Product Visual details panel as timeline-only when information is hidden", () => {
    const spec = {
      archetype: "modal",
      theme: "light",
      content: {
        productName: "delight.ai Actions",
        title: "Case #DC-2291 · Damage claim",
        subtitle: "Timeline-only details panel.",
        background: {
          type: "inbox",
          title: "Claim context",
          items: ["Carrier update", "Driver evidence", "AI follow-up"],
        },
        modal: {
          slotId: "moment-approval",
          kind: "confirmation",
          eyebrow: "Case details",
          title: "Case #DC-2291 · Damage claim",
          description: "Timeline-only claim history.",
          fields: [
            { slotId: "moment-show-information", label: "Show information", value: "false" },
            { slotId: "moment-detail-type", label: "Detail type", value: "Damage claim — multi-step" },
            { slotId: "moment-detail-name", label: "Detail name", value: "Carrier claim follow-up" },
            { slotId: "moment-detail-status", label: "Detail status", value: "RESOLUTION" },
            { slotId: "moment-detail-time", label: "Detail time", value: "4 days" },
            { slotId: "moment-activity-1-tag", label: "Activity 1 tag", value: "Carrier" },
            { slotId: "moment-activity-1-text", label: "Activity 1 text", value: "Promised revised ETA of 4:00 PM" },
            { slotId: "moment-activity-2-tag", label: "Activity 2 tag", value: "Driver" },
            { slotId: "moment-activity-2-text", label: "Activity 2 text", value: "Sent 3 photos of damaged pallets, logged to case" },
            { slotId: "moment-activity-3-tag", label: "Activity 3 tag", value: "Delight AI" },
            { slotId: "moment-activity-3-text", label: "Activity 3 text", value: "Adjuster follow-up sent automatically" },
          ],
          actions: [],
        },
        actionTrails: [],
      },
      modifiers: {},
    } satisfies ModalSceneSpec;

    const html = renderToStaticMarkup(React.createElement(ModalScene, { spec }));

    expectStableMarkup(html);
    expect(html).toContain("Case #DC-2291 · Damage claim");
    expect(html).toContain("Carrier");
    expect(html).toContain("Promised revised ETA of 4:00 PM");
    expect(html).toContain("Delight AI");
    expect(html).not.toContain("Information");
    expect(html).not.toContain("Activity");
    expect(html).not.toContain("Damage claim — multi-step");
    expect(html).toContain("margin-top:52px");
    expect(html).toContain("grid-template-columns:56px minmax(0, 1fr)");
    expect(html).toContain("min-height:92px");
    expect(html).toContain("min-height:40px");
    expect(html).toContain("border-radius:10px");
    expect(html).toContain("padding:0 10px");
    expect(html).toContain("font-size:17px");
    expect(html).toContain("font-size:22px");
  });

  it("ignores legacy Product Visual details panel body variant fields", () => {
    const baseSpec = {
      archetype: "modal",
      theme: "light",
      content: {
        productName: "delight.ai Actions",
        title: "Approve proposed action?",
        subtitle: "A compact details panel.",
        background: {
          type: "inbox",
          title: "Case context",
          items: ["Customer request", "Tool lookup", "Policy check"],
        },
        modal: {
          slotId: "moment-approval",
          kind: "confirmation",
          eyebrow: "Steward details",
          title: "Steward details",
          description: "Review each AI step before approving.",
          fields: [
            { slotId: "moment-body-type", label: "Body type", value: "text-note" },
            { slotId: "moment-note", label: "Note", value: "AI checked the refund policy before pausing." },
            { slotId: "moment-customer", label: "Customer", value: "Maria Chen" },
            { slotId: "moment-customer-message", label: "Customer message", value: "Can you confirm this refund?" },
            { slotId: "moment-show-avatar", label: "Show avatar", value: "true" },
          ],
          actions: [
            { label: "Approve", tone: "primary" },
            { label: "Modify", tone: "secondary" },
          ],
        },
        actionTrails: [
          {
            slotId: "moment-action-trail",
            title: "AI action trail",
            steps: [
              { label: "Looked up customer context", duration: "0.8s", status: "Done", tone: "good" },
              { label: "Paused for approval", status: "Gate", tone: "warn" },
            ],
            gate: {
              title: "Approve proposed action?",
              detail: "Human approval required before publish",
              primaryAction: "Approve",
              secondaryAction: "Modify",
            },
          },
        ],
      },
      modifiers: {},
    } satisfies ModalSceneSpec;

    const noteHtml = renderToStaticMarkup(React.createElement(ModalScene, { spec: baseSpec }));
    const messageHtml = renderToStaticMarkup(React.createElement(ModalScene, {
      spec: {
        ...baseSpec,
        content: {
          ...baseSpec.content,
          modal: {
            ...baseSpec.content.modal,
            fields: baseSpec.content.modal.fields.map((field) =>
              field.label === "Body type" ? { ...field, value: "customer-message" } : field,
            ),
          },
        },
      },
    }));

    expectStableMarkup(noteHtml);
    expectStableMarkup(messageHtml);
    expect(noteHtml).toContain("Activity");
    expect(noteHtml).toContain("AI prepared");
    expect(noteHtml).not.toContain("AI NOTE");
    expect(noteHtml).not.toContain("AI checked the refund policy before pausing.");
    expect(messageHtml).toContain("Activity");
    expect(messageHtml).not.toContain("CUSTOMER MESSAGE");
    expect(messageHtml).not.toContain("Can you confirm this refund?");
  });

  it("keeps Product Visual response card CTAs inside the primary panel", () => {
    const spec = {
      archetype: "modal",
      theme: "light",
      content: {
        productName: "delight.ai",
        title: "AI-prepared response",
        subtitle: "A compact review card.",
        background: {
          type: "inbox",
          title: "Conversation",
          items: ["Customer request", "AI draft", "Source check"],
        },
        modal: {
          slotId: "moment-ai-response",
          kind: "ai-result",
          eyebrow: "Generated draft",
          title: "AI-prepared response",
          description: "Review before sending.",
          fields: [
            { slotId: "moment-reviewer", label: "Reviewer", value: "Emily Choi" },
            {
              slotId: "moment-response",
              label: "Response",
              value: "I checked the refund policy and billing history, then prepared the safest next step for agent review before any customer-impacting action.",
            },
            { slotId: "moment-source-1", label: "Source", value: "Refund policy|98% match" },
            { slotId: "moment-source-2", label: "Source", value: "Billing dispute history|95% match" },
          ],
          actions: [
            { label: "Edit first", tone: "secondary" },
            { label: "Send as-is", tone: "primary" },
          ],
        },
      },
      modifiers: {},
    } satisfies ModalSceneSpec;

    const html = renderToStaticMarkup(React.createElement(ModalScene, { spec }));

    expectStableMarkup(html);
    expect(html).toContain("width:1000px");
    expect(html).toContain("min-height:920px");
    expect(html).toContain("padding:64px 64px 56px");
    expect(html).toContain("font-size:40px");
    expect(html).toContain("/preview/Avatar/Woman-08.png");
    expect(html).toContain("font-weight:500");
    expect(html).toContain("Send as-is");
    expect(html).toContain(brand.color.concept.evidenceSurface);
    expect(html).not.toContain("margin-top:16px;height:1px");
    expect(html).not.toContain(brand.color.concept.surface);
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
