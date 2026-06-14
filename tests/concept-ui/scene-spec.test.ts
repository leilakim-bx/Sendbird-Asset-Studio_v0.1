import { describe, expect, it } from "vitest";
import { parseLlmSceneSpecResponse } from "@/lib/concept-ui/llm-response";
import { longestStringFixtures } from "@/lib/concept-ui/longest-fixtures";
import { conceptUiSamples } from "@/lib/concept-ui/samples";
import { parseSceneSpec, sceneSpecSchema } from "@/lib/concept-ui/scene-spec";

describe("SceneSpec", () => {
  it("bundles 16 concept UI samples across six archetypes", () => {
    expect(conceptUiSamples).toHaveLength(16);
    expect(new Set(conceptUiSamples.map((sample) => sample.spec.archetype))).toEqual(
      new Set(["inbox", "dashboard", "builder", "table", "modal", "workspace"]),
    );
  });

  it("parses all bundled concept UI samples", () => {
    for (const sample of conceptUiSamples) {
      expect(() => parseSceneSpec(sample.spec)).not.toThrow();
    }
  });

  it("parses max-length Korean fixtures for every archetype", () => {
    expect(longestStringFixtures).toHaveLength(6);
    for (const fixture of longestStringFixtures) {
      expect(() => parseSceneSpec(fixture.spec)).not.toThrow();
    }
  });

  it("recovers malformed workspace replies to the workspace kit", () => {
    const result = parseLlmSceneSpecResponse(JSON.stringify({
      layout: "workspace settings",
      content: {
        title: "Workspace settings",
      },
    }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.archetype).toBe("workspace");
    }
  });

  it("parses reusable blocks inside supported scene kits", () => {
    const spec = structuredClone(conceptUiSamples.find((sample) => sample.spec.archetype === "dashboard")!.spec);
    if (spec.archetype !== "dashboard") throw new Error("Expected dashboard spec");
    spec.content.logicBlocks = [
      {
        slotId: "logic-error-path",
        title: "Error path",
        conditionLabel: "IF",
        condition: "context_status == error",
        description: "Show condition on top and branch outcomes below.",
        outcomes: [
          { label: "When true", action: "Ask for missing context before running lookup.", tone: "warn" },
          { label: "Otherwise", action: "Continue with normal intent clarification.", tone: "good" },
        ],
      },
    ];
    spec.content.instructionSections = [
      {
        slotId: "instruction-policy",
        title: "Agent guidance",
        eyebrow: "Guide",
        body: "Plain-language guidance keeps variables and anchors readable in product UI.",
        items: [
          { label: "When to use", text: "Apply only when the matching intent is active.", tone: "neutral" },
          { label: "Variables", text: "Expose template variables as editable UI tokens.", tone: "ai" },
        ],
        tags: ["Editable"],
      },
    ];
    spec.content.reviewQueues = [
      {
        slotId: "review-queue",
        title: "Human review",
        summary: "Review rows show why an action needs approval.",
        items: [
          { label: "Policy risk", detail: "Needs lead review before sending.", status: "Review", tone: "warn" },
          { label: "Safe path", detail: "Low-risk actions can continue.", status: "Ready", tone: "good" },
        ],
      },
    ];
    spec.content.toolCallLists = [
      {
        slotId: "tool-calls",
        title: "Tool calls",
        summary: "Function calls are visible as readable steps.",
        calls: [
          { name: "order_lookup", detail: "Fetch the current order state.", status: "Ready", tone: "ai" },
          { name: "route_result", detail: "Route the result to the next branch.", status: "Next", tone: "good" },
        ],
      },
    ];
    spec.content.actionTrails = [
      {
        slotId: "action-trail",
        title: "AI action trail",
        summary: "Every agent step is visible before approval.",
        steps: [
          { label: "Looked up booking #FL-4821", detail: "Customer context loaded.", duration: "0.8s", status: "Done", tone: "good" },
          { label: "Checked refund policy", detail: "Policy matched this case.", duration: "1.2s", status: "Done", tone: "good" },
          { label: "Paused for approval", detail: "Agent gate required.", status: "Gate", tone: "warn" },
        ],
        gate: {
          title: "Approve refund of $89.00?",
          detail: "To Visa ending 4242",
          primaryAction: "Approve",
          secondaryAction: "Modify",
        },
      },
    ];
    spec.content.improvementSignals = [
      {
        slotId: "improvement-signal",
        title: "Improvement signal",
        signal: "Production signal found a gap",
        proposal: "Propose a targeted update to the affected policy path.",
        impact: "Expected to reduce repeat contacts before publish.",
        confidence: "82%",
        status: "Suggested",
        tone: "ai",
      },
    ];
    spec.content.validationLoops = [
      {
        slotId: "validation-loop",
        title: "Validation loop",
        summary: "Proposed updates iterate through tests before approval.",
        iterationCount: "3 runs",
        passRate: "96% pass",
        status: "Ready",
        steps: [
          { label: "Draft update", detail: "Create a proposed change.", status: "Done", tone: "good" },
          { label: "Run tests", detail: "Validate against saved scenarios.", status: "Pass", tone: "good" },
        ],
      },
    ];
    spec.content.controlPanels = [
      {
        slotId: "control-panel",
        title: "Self-service controls",
        summary: "Teams can manage tone, behavior, knowledge, and rollout settings without engineering support.",
        items: [
          { label: "Tone", value: "Brand voice", detail: "Adjust how the agent sounds across conversations.", status: "Editable", tone: "ai" },
          { label: "Behavior", value: "Live rules", detail: "Change escalation and handoff behavior from the UI.", status: "No code", tone: "good" },
        ],
        footer: "Every configurable area stays visible and reversible.",
      },
    ];
    spec.content.autonomyMatrices = [
      {
        slotId: "autonomy-matrix",
        title: "Autonomy matrix",
        summary: "Shows which actions the agent can observe, suggest, approve, or run on its own.",
        levels: [
          { label: "Observe", scope: "Read customer context", detail: "Summarize data without changing customer state.", status: "Safe", tone: "neutral" },
          { label: "Approve", scope: "Human-gated action", detail: "Refunds pause for approval.", status: "Gate", tone: "warn" },
        ],
        guardrail: "Risky actions always route through a visible approval gate.",
      },
    ];
    spec.content.knowledgeCoverages = [
      {
        slotId: "knowledge-coverage",
        title: "Knowledge coverage",
        summary: "Track topics that are ready for automation and source gaps that need work.",
        topics: [
          { label: "Billing", coverage: "94%", detail: "Refund policies are mapped to agent answers.", status: "Ready", tone: "good" },
          { label: "Shipping", coverage: "82%", detail: "Delay edge cases need source updates.", status: "Watch", tone: "warn" },
        ],
        freshness: "Missing and stale sources become reviewable tasks.",
      },
    ];
    spec.content.evaluationScorecards = [
      {
        slotId: "evaluation-scorecard",
        title: "Evaluation scorecard",
        summary: "Summarizes scenario tests, policy checks, and quality signals before launch.",
        checks: [
          { label: "Policy fit", score: "98%", detail: "Responses match approved rules.", status: "Pass", tone: "good" },
          { label: "Grounding", score: "96%", detail: "Claims use trusted sources.", status: "Pass", tone: "good" },
        ],
        verdict: "Only passing checks can move to rollout.",
      },
    ];
    spec.content.integrationHealths = [
      {
        slotId: "integration-health",
        title: "Integration health",
        summary: "Monitor systems the agent depends on before it reads data or takes action.",
        systems: [
          { name: "CRM", metric: "99.9%", detail: "Customer profile fields are syncing normally.", status: "Live", tone: "good" },
          { name: "Billing", metric: "2 alerts", detail: "Payment failures route to review.", status: "Watch", tone: "warn" },
        ],
        lastSync: "Synced 4m ago",
      },
    ];
    spec.content.channelMatrices = [
      {
        slotId: "channel-matrix",
        title: "Channel matrix",
        summary: "Compare agent performance across customer channels from one view.",
        channels: [
          { channel: "Voice", volume: "1.8k convos", resolution: "71% solved", latency: "0.8s", tone: "ai" },
          { channel: "Chat", volume: "4.2k convos", resolution: "84% solved", latency: "1.4s", tone: "good" },
        ],
      },
    ];

    expect(() => parseSceneSpec(spec)).not.toThrow();
  });

  it("keeps builder sample node bodies from overlapping", () => {
    const stageW = 700;
    const stageH = 560;
    const nodeW = 150;
    const nodeH = 92;
    for (const sample of conceptUiSamples.filter((item) => item.spec.archetype === "builder")) {
      if (sample.spec.archetype !== "builder") continue;
      const rects = sample.spec.content.canvas.nodes.map((node) => ({
        id: node.id,
        left: (node.x / 1000) * (stageW - nodeW),
        top: (node.y / 640) * (stageH - nodeH),
        right: (node.x / 1000) * (stageW - nodeW) + nodeW,
        bottom: (node.y / 640) * (stageH - nodeH) + nodeH,
      }));
      for (let i = 0; i < rects.length; i += 1) {
        for (let j = i + 1; j < rects.length; j += 1) {
          const a = rects[i];
          const b = rects[j];
          const overlaps = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          expect(overlaps, `${sample.id}: ${a.id} overlaps ${b.id}`).toBe(false);
        }
      }
    }
  });

  it("rejects overlong text fields with a zod error", () => {
    const spec = structuredClone(conceptUiSamples[0].spec);
    if (spec.archetype !== "inbox") throw new Error("Expected inbox sample");
    spec.content.conversations[0].title = "x".repeat(41);

    const result = sceneSpecSchema.safeParse(spec);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path.join(".")).toBe("content.conversations.0.title");
    }
  });
});
