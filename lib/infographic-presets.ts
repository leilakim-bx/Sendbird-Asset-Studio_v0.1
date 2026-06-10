import {
  TrendingUp,
  LayoutGrid,
  BarChart3,
  ListOrdered,
  Circle,
  Layers,
  LineChart,
  Columns2,
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
  "brand-stat": { Icon: TrendingUp, typeLabel: "number", soon: false },
  "impact-metrics": { Icon: LayoutGrid, typeLabel: "metrics", soon: false },
  "channel-comparison": { Icon: BarChart3, typeLabel: "bar", soon: false },
  "trend-over-time": { Icon: LineChart, typeLabel: "trend", soon: false },
  "before-after": { Icon: Columns2, typeLabel: "compare", soon: false },
  "split-ratio": { Icon: BarChart3, typeLabel: "bar", soon: false },
  "maturity-levels": { Icon: BarChart3, typeLabel: "bar", soon: false },
  "how-it-works": { Icon: ListOrdered, typeLabel: "step", soon: false },
  architecture: { Icon: Layers, typeLabel: "layers", soon: false },
  "agent-overview": { Icon: Circle, typeLabel: "hub", soon: false },
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
        highlightNumber: true,
        label: "Spent managing teams built around functions — not customers",
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
          { number: "12", label: "New languages supported end-to-end" },
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
    id: "split-ratio",
    name: "Split ratio",
    bg: "warmgray",
    title: "Where the buying journey actually happens",
    footnote: "",
    blocks: [
      {
        id: "p-split-1",
        type: "bar-group",
        variant: "split",
        unit: "%",
        items: [
          { label: "Self-directed", valueA: 83, highlight: true },
          { label: "Sales involved", valueA: 17 },
        ],
      },
    ],
  },
  {
    id: "maturity-levels",
    name: "Maturity levels",
    bg: "warmgray",
    title: "How autonomy grows over time",
    footnote: "",
    blocks: [
      {
        id: "p-col-1",
        type: "bar-group",
        variant: "columns",
        items: [
          { label: "Reactive bots", valueA: 35, heading: "Lv.0", desc: "Single-turn answers. Stops when it gets hard." },
          { label: "AI works, human decides", valueA: 62, heading: "Lv.1", tag: "Co-pilot", desc: "Investigates, recommends. Human approves." },
          { label: "Graduated autonomy", valueA: 82, heading: "Lv.2", tag: "Supervised", desc: "Autonomy grows with AI. Alignment improves." },
          { label: "Self-authored", valueA: 100, heading: "Lv.3", tag: "Autonomous", desc: "Designs and runs its own workflows.", highlight: true },
        ],
      },
    ],
  },
  {
    id: "trend-over-time",
    name: "Trend over time",
    bg: "warmgray",
    title: "CSAT trend over the year",
    footnote: "",
    blocks: [
      {
        id: "p-line-1",
        type: "line-chart",
        xLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        seriesA: { label: "With AI agent", values: [65, 66, 68, 69, 71, 72, 74, 76, 77, 79, 81, 82] },
        seriesB: { label: "Without AI agent", values: [60, 61, 60, 61, 60, 62, 61, 62, 61, 62, 62, 63] },
        fill: true,
        yMax: 100,
      },
    ],
  },
  {
    id: "before-after",
    name: "Before · After",
    bg: "warmgray",
    title: "Old motion vs collapsed motion",
    footnote: "",
    blocks: [
      {
        id: "p-compare-1",
        type: "compare",
        layout: "cards",
        columnA: "The Old Motion",
        columnB: "The Collapsed Motion",
        highlightB: true,
        rows: [
          { a: "Step-by-step support tickets", b: "One conversation, full resolution" },
          { a: "Customer navigates handoffs", b: "AI orchestrates behind the scenes" },
          { a: "Hours to resolve", b: "Minutes to resolve" },
          { a: "Reactive responses", b: "Proactive outreach" },
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
          { title: "Resolved", desc: "Issue closed before customer needed to reach out", badge: "Zero tickets" },
        ],
      },
    ],
  },
  {
    id: "architecture",
    name: "Layers",
    bg: "warmgray",
    title: "The Agent Era Stack",
    footnote: "",
    blocks: [
      {
        id: "p-stack-1",
        type: "stack",
        layers: [
          {
            title: "THE AGENT",
            highlight: true,
            cells: [{ title: "Does the work", desc: "Compounds with every interaction" }],
          },
          {
            title: "THE BRIDGE",
            cells: [{ title: "Memory layer", desc: "Conversational intelligence" }],
          },
          {
            title: "DATA",
            cells: [{ title: "System of record", desc: "CRM, databases, ERP" }],
          },
        ],
      },
    ],
  },
  {
    id: "agent-overview",
    name: "Hub (Steward)",
    bg: "warmgray",
    title: "",
    footnote: "",
    blocks: [
      {
        id: "p-node-1",
        type: "node-list",
        hubTitle: "Steward",
        hubSub: "",
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
        // Blank by default: labelA/labelB only surface as headers in "ranked" or
        // "bars" + labelInside, where literal "A"/"B" would be noise.
        labelA: "",
        labelB: "",
        unit: "%",
        // Both series filled so the default "bars" (A/B) variant loads as a real
        // two-series comparison, not a single bar. valueB is ignored by the
        // split/columns/ranked variants.
        items: [{ label: "Row", valueA: 50, valueB: 50 }],
      };
    case "stacked-bar":
      return {
        id,
        type: "stacked-bar",
        series: ["Series A", "Series B"],
        unit: "",
        rows: [
          { label: "Row 1", values: [60, 40] },
          { label: "Row 2", values: [45, 55] },
          { label: "Row 3", values: [70, 30] },
        ],
      };
    case "step":
      return { id, type: "step", items: [{ title: "Step", desc: "" }] };
    case "stack":
      return {
        id,
        type: "stack",
        layers: [
          { title: "Intelligence", highlight: true, cells: [{ title: "The agent", desc: "Does the work" }] },
          { title: "The bridge", cells: [{ title: "Memory layer", desc: "Conversational intelligence" }] },
          { title: "Data", cells: [{ title: "System of record", desc: "CRM, databases, ERP" }] },
        ],
      };
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
