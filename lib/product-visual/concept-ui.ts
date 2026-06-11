import type { ProductVisualConcept, ProductVisualConceptKind } from "@/lib/types/product-visual";

const DEFAULT_PROMPT = "A/B test production traffic between agent versions";

function cleanPrompt(prompt: string): string {
  return prompt.replace(/\s+/g, " ").trim();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function shortFeatureLabel(prompt: string): string {
  const cleaned = cleanPrompt(prompt);
  if (!cleaned) return "New AI agent feature";
  const firstSentence = cleaned.split(/[.!?]/)[0] ?? cleaned;
  return firstSentence.length > 58 ? `${firstSentence.slice(0, 55).trim()}...` : firstSentence;
}

export function detectProductVisualConceptKind(prompt: string): ProductVisualConceptKind {
  const text = cleanPrompt(prompt).toLowerCase();
  if (
    hasAny(text, [
      "deploy",
      "deployment",
      "version",
      "production",
      "staging",
      "development",
      "rollout",
      "rollback",
      "a/b",
      "ab test",
      "traffic",
    ])
  ) {
    return "deployment";
  }
  if (
    hasAny(text, [
      "conversation",
      "message",
      "chat",
      "reply",
      "inbox",
      "memory",
      "user detail",
      "handoff",
      "follow-up",
    ])
  ) {
    return "conversation";
  }
  if (
    hasAny(text, [
      "evaluation",
      "evaluate",
      "score",
      "quality",
      "csat",
      "sentiment",
      "safeguard",
      "hallucination",
      "resolution",
    ])
  ) {
    return "evaluation";
  }
  if (
    hasAny(text, [
      "insight",
      "analytics",
      "metric",
      "report",
      "dashboard",
      "rate",
      "trend",
      "suggestion",
    ])
  ) {
    return "analytics";
  }
  if (
    hasAny(text, [
      "setting",
      "settings",
      "personalize",
      "personalization",
      "api",
      "knowledge",
      "channel",
      "messenger",
      "welcome",
      "suggested reply",
    ])
  ) {
    return "settings";
  }
  if (hasAny(text, ["workspace", "agent", "organization", "region", "environment"])) {
    return "workspace";
  }
  return "analytics";
}

export function buildProductVisualConcept(promptInput: string): ProductVisualConcept {
  const prompt = cleanPrompt(promptInput) || DEFAULT_PROMPT;
  const kind = detectProductVisualConceptKind(prompt);
  const feature = shortFeatureLabel(prompt);

  if (kind === "deployment") {
    return {
      prompt,
      kind,
      title: "Version rollout control",
      subtitle: feature,
      badge: "Production",
      primaryLabel: "Traffic split",
      primaryValue: "80/20",
      metrics: [
        { label: "Current version", value: "Version 2", tone: "neutral" },
        { label: "New version", value: "Version 9", tone: "accent" },
        { label: "Status", value: "Active", delta: "Live", tone: "good" },
      ],
      chips: [
        { label: "Production", tone: "accent" },
        { label: "Development", tone: "good" },
        { label: "Rollback ready", tone: "neutral" },
      ],
      rows: [
        { label: "Production traffic", value: "80%", tone: "good" },
        { label: "New version traffic", value: "20%", tone: "accent" },
        { label: "Deployment mode", value: "A/B test", tone: "neutral" },
      ],
    };
  }

  if (kind === "conversation") {
    return {
      prompt,
      kind,
      title: "Conversation intelligence",
      subtitle: feature,
      badge: "Completed",
      primaryLabel: "AI handle time",
      primaryValue: "6m 3s",
      metrics: [
        { label: "Resolution", value: "Resolved", tone: "good" },
        { label: "Sentiment", value: "Positive", tone: "good" },
        { label: "Memory used", value: "3 items", tone: "accent" },
      ],
      chips: [
        { label: "User memory", tone: "accent" },
        { label: "Follow-up", tone: "neutral" },
        { label: "Handoff", tone: "warn" },
      ],
      rows: [
        { label: "Category", value: "Pricing & access", tone: "neutral" },
        { label: "Summary", value: "Upgrade request", tone: "neutral" },
        { label: "Next step", value: "Follow-up triggered", tone: "accent" },
      ],
    };
  }

  if (kind === "evaluation") {
    return {
      prompt,
      kind,
      title: "Evaluation review",
      subtitle: feature,
      badge: "Evaluation",
      primaryLabel: "Quality score",
      primaryValue: "Good",
      metrics: [
        { label: "Clarity", value: "Good", tone: "good" },
        { label: "Correctness", value: "Good", tone: "good" },
        { label: "Escalation", value: "Poor", tone: "warn" },
      ],
      chips: [
        { label: "Safeguards", tone: "accent" },
        { label: "Hallucination", tone: "neutral" },
        { label: "Human review", tone: "warn" },
      ],
      rows: [
        { label: "Evaluator", value: "Emily Choi", tone: "neutral" },
        { label: "Resolution", value: "Confirmed", tone: "good" },
        { label: "Comment", value: "Improve escalation", tone: "warn" },
      ],
    };
  }

  if (kind === "settings") {
    return {
      prompt,
      kind,
      title: "Personalized messenger setup",
      subtitle: feature,
      badge: "Settings",
      primaryLabel: "Personalize with AI",
      primaryValue: "On",
      metrics: [
        { label: "User memory", value: "Enabled", tone: "good" },
        { label: "API data", value: "Connected", tone: "accent" },
        { label: "Fallback", value: "5 sec", tone: "neutral" },
      ],
      chips: [
        { label: "Welcome message", tone: "good" },
        { label: "Suggested replies", tone: "accent" },
        { label: "Tester", tone: "neutral" },
      ],
      rows: [
        { label: "Instruction", value: "Use memory first", tone: "neutral" },
        { label: "Language", value: "English", tone: "neutral" },
        { label: "Preview", value: "Ready", tone: "good" },
      ],
    };
  }

  if (kind === "workspace") {
    return {
      prompt,
      kind,
      title: "AI agent workspace",
      subtitle: feature,
      badge: "Workspace",
      primaryLabel: "Agents in use",
      primaryValue: "2/10",
      metrics: [
        { label: "Development", value: "Active", tone: "good" },
        { label: "Staging", value: "Ready", tone: "neutral" },
        { label: "Production", value: "Live", tone: "accent" },
      ],
      chips: [
        { label: "Tokyo, Japan", tone: "neutral" },
        { label: "Workspace settings", tone: "neutral" },
        { label: "Add agent", tone: "accent" },
      ],
      rows: [
        { label: "My agent US", value: "Active", tone: "good" },
        { label: "Netflix AI agent", value: "A/B test", tone: "accent" },
        { label: "Available slots", value: "8", tone: "neutral" },
      ],
    };
  }

  return {
    prompt,
    kind,
    title: "AI insights dashboard",
    subtitle: feature,
    badge: "Insights",
    primaryLabel: "Suggestions",
    primaryValue: "12",
    metrics: [
      { label: "Resolution rate", value: "60.1%", delta: "+8.2%", tone: "good" },
      { label: "Containment", value: "12.5%", delta: "+1.5%", tone: "accent" },
      { label: "Avg. CSAT", value: "4.2", delta: "-0.2", tone: "warn" },
    ],
    chips: [
      { label: "Last 7 days", tone: "neutral" },
      { label: "Channel: All", tone: "neutral" },
      { label: "AI suggestions", tone: "accent" },
    ],
    rows: [
      { label: "Total conversations", value: "62,450", tone: "neutral" },
      { label: "User sentiment", value: "50% positive", tone: "good" },
      { label: "Avg. resolution time", value: "4m 3s", tone: "neutral" },
    ],
  };
}
