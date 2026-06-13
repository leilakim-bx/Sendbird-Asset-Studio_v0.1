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
