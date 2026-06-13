import { describe, expect, it } from "vitest";
import { mapDescriptionToArchetype, ruleBasedSpecProvider } from "@/lib/concept-ui/provider";
import { conceptUiArchetypes } from "@/lib/concept-ui/slots";

describe("ruleBasedSpecProvider", () => {
  it("maps Korean ticket descriptions to inbox", () => {
    const result = mapDescriptionToArchetype("AI가 고객 대화에서 티켓을 자동 생성");

    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.archetype).toBe("inbox");
      expect(result.confidence).toBeGreaterThan(0);
    }
  });

  it("maps Korean dashboard descriptions to dashboard", () => {
    const result = mapDescriptionToArchetype("AI 응답 품질 모니터링 대시보드");

    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.archetype).toBe("dashboard");
      expect(result.confidence).toBeGreaterThan(0);
    }
  });

  it("returns a choice when no archetype keywords match", () => {
    const result = mapDescriptionToArchetype("customer insights");

    expect(result).toEqual({ kind: "needs-choice", options: conceptUiArchetypes, confidence: 0 });
  });

  it("maps builder, table, and modal descriptions", () => {
    const builder = mapDescriptionToArchetype("actionbook workflow automation canvas");
    const table = mapDescriptionToArchetype("manage customer records list");
    const modal = mapDescriptionToArchetype("confirm settings result");

    expect(builder.kind === "resolved" && builder.archetype).toBe("builder");
    expect(table.kind === "resolved" && table.archetype).toBe("table");
    expect(modal.kind === "resolved" && modal.archetype).toBe("modal");
  });

  it("keeps dashboard shell hints while treating condition words as reusable blocks", () => {
    const dashboard = mapDescriptionToArchetype("dashboard with if else logic and condition outcomes");
    const logicOnly = mapDescriptionToArchetype("if else condition outcomes");

    expect(dashboard.kind === "resolved" && dashboard.archetype).toBe("dashboard");
    expect(logicOnly.kind === "resolved" && logicOnly.archetype).toBe("builder");
  });

  it("generates a valid sample spec with the description as title", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description: "AI agent automatically creates support tickets",
      uiTextLanguage: "en",
      forcedArchetype: "inbox",
    });

    expect(result.spec.archetype).toBe("inbox");
    expect(result.spec.content.title).toBe("AI agent automatically creates support tickets");
  });

  it("uses English samples when UI text language is English", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description: "AI response quality monitoring dashboard",
      uiTextLanguage: "en",
      forcedArchetype: "dashboard",
    });

    expect(result.spec.archetype).toBe("dashboard");
    if (result.spec.archetype !== "dashboard") throw new Error("Expected dashboard spec");
    expect(result.spec.content.productName).toMatch(/delight\.ai/i);
    expect(result.spec.content.kpis.map((kpi) => kpi.label)).not.toContain("자동 해결");
  });

  it("adds reusable logic blocks when a supported scene describes if else logic", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description: "Dashboard showing conditional blocks: if context_status == error, ask for missing context, else continue.",
      uiTextLanguage: "en",
      forcedArchetype: "dashboard",
    });

    expect(result.spec.archetype).toBe("dashboard");
    if (result.spec.archetype !== "dashboard") throw new Error("Expected dashboard spec");
    expect(result.spec.content.logicBlocks?.[0]?.condition).toBe("context_status == error");
    expect(result.spec.content.logicBlocks?.[0]?.outcomes).toHaveLength(2);
  });

  it("adds instruction, review, and tool call blocks from brief cues", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description: "Workspace with policy instructions, human review approval, and function call order lookup.",
      uiTextLanguage: "en",
      forcedArchetype: "workspace",
    });

    expect(result.spec.archetype).toBe("workspace");
    if (result.spec.archetype !== "workspace") throw new Error("Expected workspace spec");
    expect(result.spec.content.instructionSections?.[0]?.title).toBe("Agent instructions");
    expect(result.spec.content.reviewQueues?.[0]?.title).toBe("Human review queue");
    expect(result.spec.content.toolCallLists?.[0]?.title).toBe("Tool call sequence");
  });

  it("folds common AI agent platform patterns into existing reusable blocks", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description:
        "Dashboard with knowledge source training, procedure guardrails, QA observability alerts, and MCP data connector recommendations.",
      uiTextLanguage: "en",
      forcedArchetype: "dashboard",
    });

    expect(result.spec.archetype).toBe("dashboard");
    if (result.spec.archetype !== "dashboard") throw new Error("Expected dashboard spec");
    expect(result.spec.content.instructionSections?.[0]?.title).toBe("Knowledge and procedures");
    expect(result.spec.content.reviewQueues?.[0]?.title).toBe("Quality monitor");
    expect(result.spec.content.toolCallLists?.[0]?.title).toBe("Action sequence");
  });
});
