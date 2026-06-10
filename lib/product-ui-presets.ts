import type { ProductUiContent, ProductUiScene } from "@/lib/types/product-ui";

export type ProductUiPreset = {
  id: ProductUiScene;
  name: string;
  description: string;
  content: ProductUiContent;
};

export const PRODUCT_UI_PRESETS: ProductUiPreset[] = [
  {
    id: "ai-response",
    name: "AI-prepared response",
    description: "A reviewer-ready response with grounded sources.",
    content: {
      format: "homepage-wide",
      scene: "ai-response",
      composition: "photo-card",
      backgroundId: "bg-101",
      title: "AI-prepared response",
      eyebrow: "Reviewer",
      primaryText:
        "Hi Maria, great news. I've found a flight to LAX on March 18 at your preferred time. Since you're a Gold loyalty member, the change fee is waived.",
      secondaryText: "Emily Choi",
      metricA: "98% match",
      metricB: "Send as-is",
      items: [
        { id: "i1", label: "Rebooking policy v3.2", status: "success", value: "98% match" },
        { id: "i2", label: "Loyalty tier benefits", status: "success", value: "96% match" },
      ],
      nodes: [],
    },
  },
  {
    id: "review-queue",
    name: "Oversight queue",
    description: "A compact Trust OS review list with policy status.",
    content: {
      format: "homepage-wide",
      scene: "review-queue",
      composition: "plain-stage",
      backgroundId: "bg-302",
      title: "Oversight AI Concierge",
      eyebrow: "Response review",
      primaryText: "94% on policy",
      secondaryText: "12 flagged today",
      metricA: "94%",
      metricB: "Kill switch",
      items: [
        { id: "i1", label: "Refund on lost package?", detail: "CSAT 4.8 · 1m 12s", status: "success" },
        { id: "i2", label: "Cancel after shipment", detail: "CSAT 2.1 · 4m 39s", status: "warning" },
        { id: "i3", label: "Account balance inquiry", detail: "CSAT 1.0 · 0m 48s", status: "danger" },
        { id: "i4", label: "Loyalty points redemption", detail: "CSAT 4.9 · 0m 52s", status: "success" },
      ],
      nodes: [],
    },
  },
  {
    id: "test-results",
    name: "Test result details",
    description: "A simplified build/test/evaluate validation scene.",
    content: {
      format: "homepage-wide",
      scene: "test-results",
      composition: "photo-card",
      backgroundId: "bg-201",
      title: "Test set result details",
      eyebrow: "Results",
      primaryText: "4 passed / 2 failed",
      secondaryText: "AI agent's answer",
      metricA: "4 passed",
      metricB: "2 failed",
      items: [
        { id: "i1", label: "Cancel my subscription", status: "success", value: "Passed" },
        { id: "i2", label: "Membership cancellation", status: "danger", value: "Failed" },
        { id: "i3", label: "Change billing cycle", status: "success", value: "Passed" },
        { id: "i4", label: "Trial period questions", status: "danger", value: "Failed" },
        { id: "i5", label: "Pause membership", status: "success", value: "Passed" },
      ],
      nodes: [
        {
          id: "n1",
          title: "I'm sorry to hear you'd like to cancel. Could you tell me why you're leaving?",
          detail: "Matches expected answer",
          status: "success",
        },
        {
          id: "n2",
          title: "Yes, you can pause your membership any time from account settings.",
          detail: "Missing retention offer",
          status: "warning",
        },
      ],
    },
  },
  {
    id: "traffic-allocation",
    name: "Traffic allocation",
    description: "A tiny launch-control card for rollout percentages.",
    content: {
      format: "square",
      scene: "traffic-allocation",
      composition: "plain-stage",
      backgroundId: "bg-300",
      title: "Traffic allocation",
      eyebrow: "Version rollout",
      primaryText: "Version B",
      secondaryText: "Version B (Candidate)",
      metricA: "70%",
      metricB: "30%",
      items: [],
      nodes: [],
    },
  },
  {
    id: "workflow",
    name: "Proactive workflow",
    description: "A trigger-to-action moment for proactive concierge flows.",
    content: {
      format: "square",
      scene: "workflow",
      composition: "plain-stage",
      backgroundId: "bg-500",
      title: "Proactive chat: Email",
      eyebrow: "Start proactive chat",
      primaryText: "Messenger",
      secondaryText: "Enter message",
      metricA: "Email",
      metricB: "Send",
      items: [
        { id: "i1", label: "Messenger", value: "Email", status: "accent" },
      ],
      nodes: [],
    },
  },
  {
    id: "version-history",
    name: "Version history",
    description: "A stacked prompt/version comparison card.",
    content: {
      format: "homepage-wide",
      scene: "version-history",
      composition: "photo-card",
      backgroundId: "bg-100",
      title: "Version history",
      eyebrow: "Current version",
      primaryText: "You are a customer service assistant focused on providing helpful, and efficient support.",
      secondaryText:
        "Maintain a friendly, empathetic, and professional tone, ensuring users feel valued and supported.",
      metricA: "Mar 7, 2025 at 2:10 PM",
      metricB: "Copy to editor",
      items: [
        { id: "i1", label: "Common goal", detail: "Provide helpful, efficient support." },
        { id: "i2", label: "Communication style", detail: "Friendly, empathetic, professional." },
      ],
      nodes: [],
    },
  },
  {
    id: "steward-detail",
    name: "Steward detail",
    description: "A single agent task detail with activity trail.",
    content: {
      format: "homepage-wide",
      scene: "steward-detail",
      composition: "photo-card",
      backgroundId: "bg-301",
      title: "Steward details",
      eyebrow: "Information",
      primaryText: "Refund Approval Request",
      secondaryText: "Matched",
      metricA: "HUMAN APPROVAL",
      metricB: "RESOLUTION",
      items: [
        { id: "i1", label: "Action type", value: "HUMAN APPROVAL", status: "accent" },
        { id: "i2", label: "Name", value: "Refund Approval Request" },
        { id: "i3", label: "Status", value: "RESOLUTION", status: "success" },
        { id: "i4", label: "Task handling time", value: "1d 2h 13m" },
      ],
      nodes: [
        { id: "n1", title: "Actionbook trigger", detail: "Order Refund" },
        { id: "n2", title: "Group | Steward", detail: "Flight Cancellation Group" },
      ],
    },
  },
  {
    id: "ab-test",
    name: "A/B test result",
    description: "Connected environment cards plus a compact result card.",
    content: {
      format: "homepage-wide",
      scene: "ab-test",
      composition: "wide-system",
      backgroundId: "bg-504",
      title: "A/B test result",
      eyebrow: "AI Concierge Environments",
      primaryText: "Version 11",
      secondaryText: "Version 12",
      metricA: "68%",
      metricB: "84%",
      items: [
        { id: "i1", label: "Development", value: "Version 11", status: "neutral" },
        { id: "i2", label: "Staging", value: "Version 12", status: "neutral" },
        { id: "i3", label: "Production", value: "Version 11", status: "neutral" },
      ],
      nodes: [
        { id: "n1", title: "Version 11", value: "68%", detail: "Resolution rate" },
        { id: "n2", title: "Version 12", value: "84%", detail: "Resolution rate", status: "live" },
      ],
    },
  },
];

export const DEFAULT_PRODUCT_UI_CONTENT: ProductUiContent = PRODUCT_UI_PRESETS[0].content;

export function getProductUiPreset(scene: ProductUiScene): ProductUiPreset {
  return PRODUCT_UI_PRESETS.find((preset) => preset.id === scene) ?? PRODUCT_UI_PRESETS[0];
}

export function cloneProductUiContent(content: ProductUiContent): ProductUiContent {
  return JSON.parse(JSON.stringify(content)) as ProductUiContent;
}

