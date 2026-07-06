import dashboardActions from "@/lib/concept-ui/samples/dashboard-ai-actions.en.json";
import dashboardCsat from "@/lib/concept-ui/samples/dashboard-csat.en.json";
import dashboardDeflectionKo from "@/lib/concept-ui/samples/dashboard-deflection.ko.json";
import inboxAgentAction from "@/lib/concept-ui/samples/inbox-agent-action.en.json";
import inboxContextKo from "@/lib/concept-ui/samples/inbox-customer-context.ko.json";
import inboxSupportTicket from "@/lib/concept-ui/samples/inbox-support-ticket.en.json";
import { parseSceneSpec, type SceneSpec } from "./scene-spec";

export type ConceptUiSample = {
  id: string;
  label: string;
  language: "en" | "ko";
  spec: SceneSpec;
};

const builderRefundFlow = parseSceneSpec({
  archetype: "builder",
  theme: "light",
  content: {
    productName: "delight.ai Builder",
    title: "Refund automation workflow",
    subtitle: "AI checks policy, verifies eligibility, and routes edge cases to a teammate.",
    paletteTitle: "Node palette",
    paletteItems: [
      { type: "trigger", label: "Trigger", description: "Conversation event starts the workflow" },
      { type: "condition", label: "Condition", description: "Branch by policy or customer state" },
      { type: "ai", label: "AI step", description: "Summarize, classify, or draft a reply" },
      { type: "action", label: "Action", description: "Update systems or notify a teammate" },
    ],
    canvas: {
      title: "Refund request flow",
      nodes: [
        { slotId: "builder-refund-trigger", id: "trigger", type: "trigger", title: "Refund request", description: "Customer asks for a refund.", status: "Live", x: 30, y: 250 },
        { slotId: "builder-refund-policy", id: "policy", type: "condition", title: "Policy check", description: "Match amount and order status.", status: "Ready", x: 360, y: 110 },
        { slotId: "builder-refund-ai", id: "ai", type: "ai", title: "AI reason", description: "Explain the decision in plain language.", status: "AI", x: 660, y: 250 },
        { slotId: "builder-refund-action", id: "action", type: "action", title: "Create task", description: "Escalate review cases to Ops.", status: "Synced", x: 970, y: 250 },
      ],
      edges: [
        { from: "trigger", to: "policy", label: "request" },
        { from: "policy", to: "ai", label: "eligible" },
        { from: "ai", to: "action", label: "review" },
      ],
    },
    selectedNode: {
      nodeId: "ai",
      panelTitle: "AI reason",
      fields: [
        { label: "Model task", value: "Summarize the refund decision for the teammate." },
        { label: "Context", value: "Order status, plan tier, refund policy, recent sentiment." },
        { label: "Guardrail", value: "Never promise a refund before eligibility is verified." },
      ],
      actions: [
        { label: "Save step", tone: "primary" },
        { label: "Test flow", tone: "secondary" },
      ],
    },
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "builder-refund-ai",
      label: "AI reasoning",
      description: "The workflow explains why a refund needs review before it reaches an agent.",
    },
  },
});

const builderReviewFlow = parseSceneSpec({
  archetype: "builder",
  theme: "light",
  content: {
    productName: "delight.ai Builder",
    title: "Review queue automation",
    subtitle: "Flag high-risk replies, collect evidence, and assign the right owner automatically.",
    paletteTitle: "Steps",
    paletteItems: [
      { type: "trigger", label: "New draft", description: "A reply draft is ready for review" },
      { type: "condition", label: "Risk check", description: "Evaluate tone, policy, and claim risk" },
      { type: "ai", label: "Evidence", description: "Attach source notes and confidence" },
      { type: "action", label: "Assign", description: "Route to the best teammate" },
    ],
    canvas: {
      title: "Review routing",
      nodes: [
        { slotId: "builder-review-start", id: "start", type: "trigger", title: "Draft ready", description: "AI generated a customer reply.", status: "Live", x: 50, y: 80 },
        { slotId: "builder-review-risk", id: "risk", type: "condition", title: "Risk score", description: "Check policy and hallucination risk.", status: "Active", x: 325, y: 80 },
        { slotId: "builder-review-evidence", id: "evidence", type: "ai", title: "Attach evidence", description: "Add citations and source snippets.", status: "AI", x: 600, y: 80 },
        { slotId: "builder-review-safe", id: "safe", type: "action", title: "Auto approve", description: "Send safe replies to the agent.", status: "Ready", x: 600, y: 390 },
        { slotId: "builder-review-assign", id: "assign", type: "action", title: "Assign review", description: "Send risky replies to a lead.", status: "Ready", x: 870, y: 235 },
      ],
      edges: [
        { from: "start", to: "risk", label: "draft" },
        { from: "risk", to: "evidence", label: "risky" },
        { from: "risk", to: "safe", label: "safe" },
        { from: "evidence", to: "assign", label: "needs review" },
      ],
    },
    selectedNode: {
      nodeId: "evidence",
      panelTitle: "Attach evidence",
      fields: [
        { label: "Sources", value: "Conversation, policy article, order timeline." },
        { label: "Confidence", value: "Show confidence when below review threshold." },
        { label: "Output", value: "Short note with links to source blocks." },
      ],
      actions: [
        { label: "Save step", tone: "primary" },
        { label: "Preview output", tone: "secondary" },
      ],
    },
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "builder-review-evidence",
      label: "Source-linked",
      description: "AI adds the evidence a reviewer needs instead of just flagging risk.",
    },
  },
});

const builderActionbookFlow = parseSceneSpec({
  archetype: "builder",
  theme: "light",
  content: {
    productName: "delight.ai Actionbooks",
    title: "Actionbook rule flow",
    subtitle: "Editable rule blocks turn CX playbooks into testable AI behavior.",
    paletteTitle: "Blocks",
    paletteItems: [
      { type: "trigger", label: "When to use", description: "Define when this playbook applies" },
      { type: "condition", label: "If block", description: "Branch on context or customer state" },
      { type: "action", label: "Action", description: "Call tools or route the conversation" },
      { type: "ai", label: "AI reply", description: "Draft the next best response" },
    ],
    canvas: {
      title: "Cancellation playbook",
      nodes: [
        { slotId: "builder-book-use", id: "use", type: "trigger", title: "Cancel request", description: "Customer asks to cancel a plan.", status: "Live", x: 30, y: 270 },
        { slotId: "builder-book-plan", id: "plan", type: "condition", title: "Plan status", description: "Check active plan and renewal date.", status: "Ready", x: 360, y: 150 },
        { slotId: "builder-book-offer", id: "offer", type: "ai", title: "Save offer", description: "Generate a retention option.", status: "AI", x: 650, y: 70 },
        { slotId: "builder-book-cancel", id: "cancel", type: "action", title: "Cancel plan", description: "Confirm cancellation and send receipt.", status: "Ready", x: 650, y: 380 },
        { slotId: "builder-book-handoff", id: "handoff", type: "action", title: "Human loop", description: "Escalate exception cases.", status: "Review", x: 940, y: 230 },
      ],
      edges: [
        { from: "use", to: "plan", label: "match" },
        { from: "plan", to: "offer", label: "saveable" },
        { from: "plan", to: "cancel", label: "confirmed" },
        { from: "offer", to: "handoff", label: "declines" },
        { from: "cancel", to: "handoff", label: "exception" },
      ],
    },
    selectedNode: {
      nodeId: "plan",
      panelTitle: "Plan status",
      fields: [
        { label: "Condition", value: "If renewal is within 7 days, explain billing impact first." },
        { label: "Data", value: "Plan tier, renewal date, account owner, open invoices." },
        { label: "Fallback", value: "If billing data is missing, ask a clarifying question." },
      ],
      actions: [
        { label: "Save rule", tone: "primary" },
        { label: "Run test", tone: "secondary" },
      ],
    },
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "builder-book-plan",
      label: "Editable logic",
      description: "Ops can update conditions directly without waiting for engineering.",
    },
  },
});

const tableTickets = parseSceneSpec({
  archetype: "table",
  theme: "light",
  content: {
    productName: "delight.ai Ops",
    title: "AI-created ticket queue",
    subtitle: "Review customer requests that were converted into structured support tickets.",
    toolbar: {
      searchPlaceholder: "Search tickets",
      filters: ["AI-created", "Needs owner", "Last 24h"],
      bulkSelect: true,
    },
    columns: [
      { key: "ticket", label: "Ticket", width: 270 },
      { key: "owner", label: "Owner", width: 210 },
      { key: "status", label: "Status", width: 150 },
      { key: "impact", label: "Impact", width: 130 },
      { key: "created", label: "Created", width: 130 },
    ],
    rows: [
      { slotId: "table-ticket-1", cells: [{ kind: "text", value: "Refund for delayed order" }, { kind: "person", name: "Maya Chen", detail: "VIP customer" }, { kind: "badge", value: "Review", tone: "warn" }, { kind: "number", value: "$184", delta: "High", tone: "warn" }, { kind: "date", value: "Today" }] },
      { slotId: "table-ticket-2", cells: [{ kind: "text", value: "Reset account access" }, { kind: "person", name: "Luis Easton", detail: "Enterprise" }, { kind: "badge", value: "Ready", tone: "good" }, { kind: "number", value: "2m", delta: "-40%", tone: "good" }, { kind: "date", value: "Today" }] },
      { slotId: "table-ticket-3", cells: [{ kind: "text", value: "Shipment tracking issue" }, { kind: "person", name: "Nora Patel", detail: "Premium" }, { kind: "badge", value: "Open", tone: "neutral" }, { kind: "number", value: "4.8", delta: "CSAT", tone: "good" }, { kind: "date", value: "Yesterday" }] },
      { slotId: "table-ticket-4", cells: [{ kind: "text", value: "Billing address update" }, { kind: "person", name: "Theo Park", detail: "Starter" }, { kind: "badge", value: "Solved", tone: "good" }, { kind: "number", value: "1m", delta: "-12s", tone: "good" }, { kind: "date", value: "Jun 10" }] },
      { slotId: "table-ticket-5", cells: [{ kind: "text", value: "Escalate cancellation" }, { kind: "person", name: "Amara Stone", detail: "At risk" }, { kind: "badge", value: "Flagged", tone: "warn" }, { kind: "number", value: "91%", delta: "Risk", tone: "warn" }, { kind: "date", value: "Jun 10" }] },
      { slotId: "table-ticket-6", cells: [{ kind: "text", value: "Product return exception" }, { kind: "person", name: "Jon Bell", detail: "Loyalty" }, { kind: "badge", value: "Queued", tone: "neutral" }, { kind: "number", value: "$62", delta: "Low", tone: "neutral" }, { kind: "date", value: "Jun 9" }] },
    ],
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "table-ticket-1",
      label: "AI-created",
      description: "The row is pre-filled from the customer conversation and ready for review.",
    },
    highlightedSlotId: "table-ticket-1",
  },
});

const tableAgents = parseSceneSpec({
  archetype: "table",
  theme: "light",
  content: {
    productName: "delight.ai Monitor",
    title: "Agent performance records",
    subtitle: "Track AI agents by conversation volume, health, and review status.",
    toolbar: {
      searchPlaceholder: "Search agents",
      filters: ["Live agents", "Policy health", "This week"],
      bulkSelect: false,
    },
    columns: [
      { key: "agent", label: "Agent", width: 270 },
      { key: "owner", label: "Owner", width: 210 },
      { key: "health", label: "Health", width: 150 },
      { key: "volume", label: "Volume", width: 130 },
      { key: "updated", label: "Updated", width: 130 },
    ],
    rows: [
      { slotId: "table-agent-1", cells: [{ kind: "text", value: "Refund Concierge" }, { kind: "person", name: "Sarah Kim", detail: "CX Ops" }, { kind: "badge", value: "On policy", tone: "good" }, { kind: "number", value: "1,842", delta: "+12%", tone: "good" }, { kind: "date", value: "Today" }] },
      { slotId: "table-agent-2", cells: [{ kind: "text", value: "Order Tracker" }, { kind: "person", name: "Alex Morgan", detail: "Support" }, { kind: "badge", value: "Healthy", tone: "good" }, { kind: "number", value: "1,214", delta: "+5%", tone: "good" }, { kind: "date", value: "Today" }] },
      { slotId: "table-agent-3", cells: [{ kind: "text", value: "Plan Advisor" }, { kind: "person", name: "Priya Rao", detail: "Growth" }, { kind: "badge", value: "Review", tone: "warn" }, { kind: "number", value: "984", delta: "-2%", tone: "warn" }, { kind: "date", value: "Jun 11" }] },
      { slotId: "table-agent-4", cells: [{ kind: "text", value: "Trust Review Bot" }, { kind: "person", name: "Leo Grant", detail: "QA" }, { kind: "badge", value: "Learning", tone: "ai" }, { kind: "number", value: "641", delta: "+18%", tone: "good" }, { kind: "date", value: "Jun 11" }] },
      { slotId: "table-agent-5", cells: [{ kind: "text", value: "Cancellation Guide" }, { kind: "person", name: "Mina Cho", detail: "Retention" }, { kind: "badge", value: "Flagged", tone: "warn" }, { kind: "number", value: "312", delta: "Risk", tone: "warn" }, { kind: "date", value: "Jun 10" }] },
      { slotId: "table-agent-6", cells: [{ kind: "text", value: "Shipping Assistant" }, { kind: "person", name: "Owen Reed", detail: "Logistics" }, { kind: "badge", value: "Healthy", tone: "good" }, { kind: "number", value: "752", delta: "+7%", tone: "good" }, { kind: "date", value: "Jun 9" }] },
    ],
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "table-agent-4",
      label: "Learning mode",
      description: "The agent is live but still collecting review feedback before full rollout.",
    },
    highlightedSlotId: "table-agent-4",
  },
});

const tableAuditLog = parseSceneSpec({
  archetype: "table",
  theme: "light",
  content: {
    productName: "delight.ai Audit",
    title: "Action audit log",
    subtitle: "A structured record of AI actions, tool calls, and human approvals.",
    toolbar: {
      searchPlaceholder: "Search actions",
      filters: ["Tool calls", "Approved", "Last 7 days", "High impact"],
      bulkSelect: true,
    },
    columns: [
      { key: "action", label: "Action", width: 280 },
      { key: "actor", label: "Actor", width: 220 },
      { key: "state", label: "State", width: 150 },
      { key: "count", label: "Count", width: 120 },
      { key: "time", label: "Time", width: 140 },
    ],
    rows: [
      { slotId: "table-audit-1", cells: [{ kind: "text", value: "Refund eligibility check" }, { kind: "person", name: "AI Concierge", detail: "System" }, { kind: "badge", value: "Approved", tone: "good" }, { kind: "number", value: "312", delta: "+9%", tone: "good" }, { kind: "date", value: "10:42 AM" }] },
      { slotId: "table-audit-2", cells: [{ kind: "text", value: "Order lookup" }, { kind: "person", name: "AI Concierge", detail: "System" }, { kind: "badge", value: "Synced", tone: "good" }, { kind: "number", value: "286", delta: "+4%", tone: "good" }, { kind: "date", value: "10:31 AM" }] },
      { slotId: "table-audit-3", cells: [{ kind: "text", value: "Human handoff" }, { kind: "person", name: "Maya Chen", detail: "Support lead" }, { kind: "badge", value: "Review", tone: "warn" }, { kind: "number", value: "74", delta: "-6%", tone: "good" }, { kind: "date", value: "9:55 AM" }] },
      { slotId: "table-audit-4", cells: [{ kind: "text", value: "Policy citation added" }, { kind: "person", name: "AI Concierge", detail: "System" }, { kind: "badge", value: "Complete", tone: "good" }, { kind: "number", value: "129", delta: "+11%", tone: "good" }, { kind: "date", value: "9:14 AM" }] },
      { slotId: "table-audit-5", cells: [{ kind: "text", value: "Cancellation exception" }, { kind: "person", name: "Lena Ortiz", detail: "Retention" }, { kind: "badge", value: "Flagged", tone: "warn" }, { kind: "number", value: "18", delta: "High", tone: "warn" }, { kind: "date", value: "Yesterday" }] },
      { slotId: "table-audit-6", cells: [{ kind: "text", value: "Confirmation email sent" }, { kind: "person", name: "AI Concierge", detail: "System" }, { kind: "badge", value: "Sent", tone: "neutral" }, { kind: "number", value: "201", delta: "+3%", tone: "good" }, { kind: "date", value: "Yesterday" }] },
    ],
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "table-audit-1",
      label: "Policy-safe",
      description: "Every automated action keeps a reviewable audit trail.",
    },
    highlightedSlotId: "table-audit-1",
  },
});

const modalCreateTicket = parseSceneSpec({
  archetype: "modal",
  theme: "light",
  content: {
    productName: "delight.ai Inbox",
    title: "Create support ticket",
    subtitle: "AI turns a customer conversation into a ready-to-review ticket.",
    background: {
      type: "inbox",
      title: "Conversation workspace",
      items: ["Customer asked for account reset", "AI verified identity", "Suggested ticket fields", "Context panel synced"],
    },
    modal: {
      slotId: "modal-ticket",
      kind: "form",
      eyebrow: "Ready to review",
      title: "Convert to customer ticket",
      description: "Review the generated summary before creating the ticket in your helpdesk.",
      fields: [
        { slotId: "modal-ticket-subject", label: "Subject", value: "Reset account access after failed login attempts" },
        { slotId: "modal-ticket-type", label: "Type", value: "Account security" },
        { slotId: "modal-ticket-priority", label: "Priority", value: "High - customer verified identity" },
      ],
      actions: [
        { label: "Create ticket", tone: "primary" },
        { label: "Cancel", tone: "secondary" },
      ],
    },
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "modal-ticket",
      label: "Generated draft",
      description: "Pulls the subject, type, and priority from the conversation.",
    },
  },
});

const modalConfirmLaunch = parseSceneSpec({
  archetype: "modal",
  theme: "light",
  content: {
    productName: "delight.ai Builder",
    title: "Confirm workflow launch",
    subtitle: "A focused review step before publishing an automation.",
    background: {
      type: "builder",
      title: "Workflow canvas",
      items: ["New draft received", "Policy risk checked", "Evidence attached", "Review owner assigned"],
    },
    modal: {
      slotId: "modal-launch",
      kind: "confirmation",
      eyebrow: "Ready to launch",
      title: "Publish review workflow?",
      description: "This workflow will route risky AI replies to a lead before they reach customers.",
      fields: [
        { slotId: "modal-launch-scope", label: "Scope", value: "Refund and cancellation conversations" },
        { slotId: "modal-launch-checks", label: "Checks", value: "Policy risk, source citations, tone review" },
        { slotId: "modal-launch-owner", label: "Owner", value: "CX Ops team" },
      ],
      actions: [
        { label: "Publish workflow", tone: "primary" },
        { label: "Keep draft", tone: "secondary" },
      ],
    },
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "modal-launch-checks",
      label: "Guardrails",
      description: "The publish step summarizes what will be checked before launch.",
    },
  },
});

const modalAiResult = parseSceneSpec({
  archetype: "modal",
  theme: "light",
  content: {
    productName: "delight.ai Insights",
    title: "AI result reveal",
    subtitle: "Surface the reason behind a metric change without leaving the dashboard.",
    background: {
      type: "dashboard",
      title: "Quality monitor",
      items: ["CSAT trend increased", "Refund topic volume changed", "Human loop rate dropped", "Review queue stable"],
    },
    modal: {
      slotId: "modal-result",
      kind: "ai-result",
      eyebrow: "AI analysis",
      title: "Why CSAT improved",
      description: "The agent used customer memory in more refund conversations and reduced repeated questions.",
      fields: [
        { slotId: "modal-result-signal", label: "Signal", value: "Memory usage increased by 18 percent" },
        { slotId: "modal-result-impact", label: "Impact", value: "Average handle time dropped by 22 seconds" },
        { slotId: "modal-result-next", label: "Next step", value: "Roll out the same prompt to shipping support" },
      ],
      actions: [
        { label: "Apply insight", tone: "primary" },
        { label: "Dismiss", tone: "secondary" },
      ],
    },
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "modal-result",
      label: "Explained",
      description: "The modal reveals the product insight instead of showing only the metric.",
    },
  },
});

const workspaceActionbookSettings = parseSceneSpec({
  archetype: "workspace",
  theme: "light",
  content: {
    productName: "delight.ai Workspace",
    title: "Workspace settings",
    subtitle: "Edit actionbooks, preview behavior, and test an AI agent in one workspace.",
    filters: ["Messenger", "All countries", "Draft"],
    editor: {
      slotId: "workspace-editor",
      eyebrow: "When to use",
      title: "Cancel membership",
      body: "Use this actionbook when a user asks to cancel their subscription or plan. Do not use it when the customer mentions a free plan.",
      keyPoints: [
        "Always apply the correction guide before processing each customer message.",
        "If any function call fails, apologize and route the customer to a teammate.",
        "Keep replies concise and confirm the customer intent before taking action.",
      ],
      tags: ["No action needed", "Policy checked"],
    },
    preview: {
      slotId: "workspace-preview",
      title: "Preview",
      emptyLabel: "Preview",
      cards: ["Trigger matched: cancel membership", "Policy check ready", "Tool action available"],
    },
    tester: {
      slotId: "workspace-tester",
      agentName: "AI agent",
      status: "AI Agent-01",
      messages: [
        {
          author: "ai",
          text: "Welcome back, Johnny. I can help check your cancellation request and confirm the next step.",
        },
      ],
      replies: ["Yes, continue.", "Can you check my refund?", "I need help with something else."],
    },
  },
  modifiers: {
    aiCallout: {
      targetSlotId: "workspace-tester",
      label: "Live test",
      description: "The tester lets teams validate the actionbook before publishing it.",
    },
  },
});

export const conceptUiSamples: ConceptUiSample[] = [
  { id: "inbox-support-ticket", label: "Inbox - Support ticket", language: "en", spec: parseSceneSpec(inboxSupportTicket) },
  { id: "inbox-customer-context-ko", label: "Inbox - Customer context KR", language: "ko", spec: parseSceneSpec(inboxContextKo) },
  { id: "inbox-agent-action", label: "Inbox - Agent action", language: "en", spec: parseSceneSpec(inboxAgentAction) },
  { id: "workspace-actionbook-settings", label: "Workspace - Actionbook settings", language: "en", spec: workspaceActionbookSettings },
  { id: "dashboard-csat", label: "Dashboard - CX metrics", language: "en", spec: parseSceneSpec(dashboardCsat) },
  { id: "dashboard-deflection-ko", label: "Dashboard - Deflection KR", language: "ko", spec: parseSceneSpec(dashboardDeflectionKo) },
  { id: "dashboard-ai-actions", label: "Dashboard - AI actions", language: "en", spec: parseSceneSpec(dashboardActions) },
  { id: "builder-refund-flow", label: "Builder - Refund flow", language: "en", spec: builderRefundFlow },
  { id: "builder-review-flow", label: "Builder - Review flow", language: "en", spec: builderReviewFlow },
  { id: "builder-actionbook-flow", label: "Builder - Actionbook flow", language: "en", spec: builderActionbookFlow },
  { id: "table-tickets", label: "Table - Ticket queue", language: "en", spec: tableTickets },
  { id: "table-agents", label: "Table - Agent records", language: "en", spec: tableAgents },
  { id: "table-audit-log", label: "Table - Audit log", language: "en", spec: tableAuditLog },
  { id: "modal-create-ticket", label: "Modal - Create ticket", language: "en", spec: modalCreateTicket },
  { id: "modal-confirm-launch", label: "Modal - Confirm launch", language: "en", spec: modalConfirmLaunch },
  { id: "modal-ai-result", label: "Modal - AI result", language: "en", spec: modalAiResult },
];

export function getConceptUiSample(id: string): SceneSpec {
  return conceptUiSamples.find((sample) => sample.id === id)?.spec ?? conceptUiSamples[0].spec;
}
