import {
  TrendingUp,
  LayoutGrid,
  BarChart3,
  ListOrdered,
  Workflow,
  Plus,
  type LucideIcon,
} from "lucide-react";
import type {
  InfographicBlock,
  InfographicBlockType,
  InfographicBg,
} from "@/lib/types/infographic";

/** A curated starting point. Loading one replaces bg/title/footnote/blocks
 *  (format + accent are preserved from the current canvas). */
export type InfographicPreset = {
  id: string;
  name: string;
  bg: InfographicBg;
  title: string;
  footnote: string;
  blocks: InfographicBlock[];
};

export type PresetMeta = { Icon: LucideIcon; typeLabel: string; soon: boolean };

export const PRESET_META: Record<string, PresetMeta> = {
  "brand-stat": { Icon: TrendingUp, typeLabel: "stat", soon: false },
  "impact-metrics": { Icon: LayoutGrid, typeLabel: "kpi", soon: false },
  "channel-comparison": { Icon: BarChart3, typeLabel: "bar", soon: false },
  "how-it-works": { Icon: ListOrdered, typeLabel: "step", soon: false },
  "agent-overview": { Icon: Workflow, typeLabel: "node", soon: false },
  empty: { Icon: Plus, typeLabel: "blank", soon: false },
};

export const INFOGRAPHIC_PRESETS: InfographicPreset[] = [
  {
    id: "brand-stat",
    name: "Big number",
    bg: "warmgray",
    title: "",
    footnote: "",
    blocks: [
      {
        id: "p-stat-1",
        type: "stat",
        eyebrow: "💸 CX technology spend per year",
        number: "$22B",
        highlightNumber: false,
        label: "All of it managing the fact that companies are organized around functions, not customers",
      },
    ],
  },
  {
    id: "impact-metrics",
    name: "Impact metrics",
    bg: "sky",
    title: "What we shipped this year",
    footnote: "",
    blocks: [
      {
        id: "p-kpi-1",
        type: "kpi-group",
        items: [
          { number: "2,000+", label: "Bug fixes & improvements shipped" },
          { number: "30%+", label: "Reduction in misattribution rate" },
        ],
      },
    ],
  },
  {
    id: "channel-comparison",
    name: "Channel comparison",
    bg: "warmgray",
    title: "Shopper preference by task",
    footnote: "",
    blocks: [
      {
        id: "p-bar-1",
        type: "bar-group",
        labelA: "prefer AI",
        labelB: "prefer human",
        unit: "%",
        items: [
          { label: "Check order status", valueA: 49, valueB: 34, highlight: true },
          { label: "Process a refund", valueA: 32, valueB: 50 },
          { label: "Dispute a price", valueA: 30, valueB: 54 },
          { label: "Submit a complaint", valueA: 22, valueB: 51 },
        ],
      },
    ],
  },
  {
    id: "how-it-works",
    name: "How it works",
    bg: "stone",
    title: "How Proactive Voice works",
    footnote: "* AI calls only when an order is delayed > 48hr and the customer has not contacted support.",
    blocks: [
      {
        id: "p-step-1",
        type: "step",
        items: [
          { title: "Signal detected", desc: "Order delayed, ticket stalled, payment failed" },
          { title: "Rule evaluated", desc: "Priority, timing, and channel logic applied" },
          { title: "AI calls out", desc: "Outbound call placed with full context loaded" },
          { title: "Resolved", desc: "Issue closed before customer needed to reach out", badge: "Family trigger" },
        ],
      },
    ],
  },
  {
    id: "agent-overview",
    name: "Agent overview",
    bg: "warmgray",
    title: "",
    footnote: "",
    blocks: [
      {
        id: "p-node-1",
        type: "node-list",
        hubTitle: "Agent Steward",
        hubSub: "Decomposes the problem and dispatches sub-stewards in parallel.",
        items: [
          { label: "Data Agent", desc: "Queries systems, pulls records, checks policies", tag: "API" },
          { label: "Customer Agent", desc: "Sends proactive updates as each step resolves", tag: "SMS" },
          { label: "Negotiation Agent", desc: "Places AI calls, negotiates in real time", tag: "Voice" },
          { label: "Outreach Agent", desc: "Drafts emails to partners, waits for replies", tag: "Email" },
          { label: "Approval Agent", desc: "Packages evidence for one-click human approval", tag: "Desk" },
        ],
      },
    ],
  },
  {
    id: "empty",
    name: "Empty",
    bg: "warmgray",
    title: "",
    footnote: "",
    blocks: [],
  },
];

export function getPreset(id: string): InfographicPreset | undefined {
  return INFOGRAPHIC_PRESETS.find((p) => p.id === id);
}

let blockSeq = 0;
/** Unique id for a freshly created block (shared by "+ Add block" and AI apply). */
export function newBlockId() {
  blockSeq += 1;
  return `blk-${Date.now().toString(36)}-${blockSeq}`;
}

/** Default block of a given type, used by "+ Add block". */
export function createBlock(type: InfographicBlockType): InfographicBlock {
  const id = newBlockId();
  switch (type) {
    case "stat":
      return { id, type: "stat", eyebrow: "", number: "00%", highlightNumber: true, label: "" };
    case "kpi-group":
      return { id, type: "kpi-group", items: [{ number: "00", label: "Label" }] };
    case "bar-group":
      return {
        id,
        type: "bar-group",
        labelA: "A",
        labelB: "B",
        unit: "%",
        items: [{ label: "Row", valueA: 50 }],
      };
    case "step":
      return { id, type: "step", items: [{ title: "Step", desc: "" }] };
    case "node-list":
      return { id, type: "node-list", hubTitle: "Hub", hubSub: "", items: [{ label: "Node" }] };
    case "compare":
      return {
        id,
        type: "compare",
        layout: "cards",
        columnA: "Before",
        columnB: "After",
        highlightB: true,
        rows: [
          { a: "Manual, slow", b: "Automated, instant" },
          { a: "Reactive", b: "Proactive" },
          { a: "Costly", b: "Efficient" },
        ],
      };
    case "line-chart":
      return {
        id,
        type: "line-chart",
        xLabels: ["Wk 1", "Wk 4", "Wk 8", "Wk 12"],
        seriesA: { label: "With AI", values: [40, 58, 74, 90] },
        fill: true,
      };
  }
}
