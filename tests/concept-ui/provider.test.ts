import { describe, expect, it } from "vitest";
import {
  mapDescriptionToArchetype,
  recommendProductVisualRecipes,
  ruleBasedSpecProvider,
} from "@/lib/concept-ui/provider";
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

  it("adds improvement signals, validation loops, and governance review from agent improvement cues", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description:
        "Dashboard for automated agent improvement: production signals become proposed updates, self-validation runs a testing loop until tests pass, and enterprise governance requires human approvals with visibility into outcomes.",
      uiTextLanguage: "en",
    });

    expect(result.spec.archetype).toBe("dashboard");
    if (result.spec.archetype !== "dashboard") throw new Error("Expected dashboard spec");
    expect(result.spec.content.improvementSignals?.[0]?.title).toBe("Improvement signal");
    expect(result.spec.content.validationLoops?.[0]?.title).toBe("Validation loop");
    expect(result.spec.content.reviewQueues?.[0]?.title).toBe("Governance review");
  });

  it("adds self-service control panels from no-code configuration cues", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description:
        "Fin gives full confidence because CX teams are in control: they fully manage tone, behavior, knowledge, and experiments without engineering resources.",
      uiTextLanguage: "en",
    });

    expect(result.spec.archetype).toBe("dashboard");
    if (result.spec.archetype !== "dashboard") throw new Error("Expected dashboard spec");
    expect(result.spec.content.controlPanels?.[0]?.title).toBe("Self-service controls");
    expect(result.spec.content.controlPanels?.[0]?.items.map((item) => item.label)).toEqual([
      "Tone",
      "Behavior",
      "Knowledge",
      "Learning",
    ]);
  });

  it("adds operational dashboard blocks for autonomy, knowledge, evaluation, integrations, and channels", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description:
        "Dashboard for agent autonomy permissions, knowledge coverage gaps, evaluation scorecard pass rate, integration health sync status, and every customer channel across Voice, Chat, Email, and Slack.",
      uiTextLanguage: "en",
    });

    expect(result.spec.archetype).toBe("dashboard");
    if (result.spec.archetype !== "dashboard") throw new Error("Expected dashboard spec");
    expect(result.spec.content.autonomyMatrices?.[0]?.title).toBe("Autonomy matrix");
    expect(result.spec.content.knowledgeCoverages?.[0]?.title).toBe("Knowledge coverage");
    expect(result.spec.content.evaluationScorecards?.[0]?.title).toBe("Evaluation scorecard");
    expect(result.spec.content.integrationHealths?.[0]?.title).toBe("Integration health");
    expect(result.spec.content.channelMatrices?.[0]?.title).toBe("Channel matrix");
  });

  it("keeps generic chat requests mapped to inbox instead of channel dashboards", () => {
    const result = mapDescriptionToArchetype("chat support inbox");

    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.archetype).toBe("inbox");
    }
  });

  it("routes generic feature flows to dashboard kit instead of a fixed builder canvas", async () => {
    const gamingFlow = mapDescriptionToArchetype("Gaming support resolution flow");
    const procedureFlow = mapDescriptionToArchetype("Procedure-trained agent flow");
    const explicitBuilder = mapDescriptionToArchetype("Actionbook workflow automation canvas");

    expect(gamingFlow.kind === "resolved" && gamingFlow.archetype).toBe("dashboard");
    expect(procedureFlow.kind === "resolved" && procedureFlow.archetype).toBe("dashboard");
    expect(explicitBuilder.kind === "resolved" && explicitBuilder.archetype).toBe("builder");

    const result = await ruleBasedSpecProvider.generate({
      description: "Gaming support resolution flow",
      uiTextLanguage: "en",
    });

    expect(result.spec.archetype).toBe("dashboard");
    if (result.spec.archetype !== "dashboard") throw new Error("Expected dashboard spec");
    expect(result.spec.content.actionTrails?.[0]?.title).toBe("AI action trail");
  });

  it("adds an action trail for visible agent steps and approval gates", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description:
        "Dashboard with AI action trail for billing dispute: looked up booking, found refund policy, drafted refund, then paused because it requires agent approval.",
      uiTextLanguage: "en",
    });

    expect(result.spec.archetype).toBe("dashboard");
    if (result.spec.archetype !== "dashboard") throw new Error("Expected dashboard spec");
    expect(result.spec.content.actionTrails?.[0]?.title).toBe("AI action trail");
    expect(result.spec.content.actionTrails?.[0]?.steps.at(-1)?.status).toBe("Gate");
    expect(result.spec.content.actionTrails?.[0]?.gate?.primaryAction).toBe("Approve");
  });

  it("recommends a limited set of product visual recipes", () => {
    const recipes = recommendProductVisualRecipes("Procedure-trained agent flow with visible agent steps and approval gate");

    expect(recipes).toHaveLength(2);
    expect(recipes.map((recipe) => recipe.id)).toEqual(["approval-modal", "response-card"]);
    expect(recipes[0]).toMatchObject({
      label: "Details panel",
      archetype: "modal",
    });
  });

  it("shows default product visual recipes before a brief is entered", () => {
    const recipes = recommendProductVisualRecipes("");

    expect(recipes).toHaveLength(2);
    expect(recipes.map((recipe) => recipe.id)).toEqual(["response-card", "approval-modal"]);
    expect(recipes.map((recipe) => recipe.label)).toEqual(["Card", "Details panel"]);
  });

  it("keeps product visual recipe choices focused on compact blocks", () => {
    const recipes = recommendProductVisualRecipes("Actionbook workflow builder canvas with trigger node and condition rule editor");

    expect(recipes).toHaveLength(2);
    expect(recipes[0]).toMatchObject({
      id: "approval-modal",
      label: "Details panel",
      archetype: "modal",
    });
  });

  it("routes conversation search briefs to the card recipe", async () => {
    const description = [
      "Conversation Search brings comprehensive filtering to delight.ai, letting you find conversations by what customers said, who they are, or both to turn buried insights into immediate action.",
      "Search by keywords and customer attributes to find exactly what you need.",
    ].join(" ");

    const choice = mapDescriptionToArchetype(description);
    const recipes = recommendProductVisualRecipes(description);
    const result = await ruleBasedSpecProvider.generate({
      description,
      uiTextLanguage: "en",
      forcedArchetype: recipes[0].archetype,
      recipeId: recipes[0].id,
    });

    expect(choice.kind === "resolved" && choice.archetype).toBe("table");
    expect(recipes[0]).toMatchObject({
      id: "response-card",
      label: "Card",
      archetype: "modal",
    });
    expect(result.spec.archetype).toBe("modal");
    if (result.spec.archetype !== "modal") throw new Error("Expected modal spec");
    expect(result.spec.content.modal.slotId).toBe("moment-ai-response");
    expect(result.spec.content.modal.fields.find((field) => field.slotId === "moment-source-1")?.value).toContain("Conversation filters");
  });

  it("generates compact response and approval moment specs from product visual recipes", async () => {
    const response = await ruleBasedSpecProvider.generate({
      description: "AI-prepared response with reviewer, knowledge sources used, and send as-is CTA",
      uiTextLanguage: "en",
      forcedArchetype: "modal",
      recipeId: "response-card",
    });
    const approval = await ruleBasedSpecProvider.generate({
      description: "AI action trail for billing dispute with looked up booking, checked refund policy, and requires agent approval",
      uiTextLanguage: "en",
      forcedArchetype: "modal",
      recipeId: "approval-modal",
    });

    expect(response.spec.archetype).toBe("modal");
    if (response.spec.archetype !== "modal") throw new Error("Expected modal response spec");
    expect(response.spec.content.modal.slotId).toBe("moment-ai-response");
    expect(response.spec.content.modal.actions.map((action) => action.label)).toEqual(["Edit first", "Send as-is"]);

    expect(approval.spec.archetype).toBe("modal");
    if (approval.spec.archetype !== "modal") throw new Error("Expected modal approval spec");
    expect(approval.spec.content.modal.slotId).toBe("moment-approval");
    expect(approval.spec.content.modal.fields.find((field) => field.slotId === "moment-show-information")?.value).toBe("true");
    expect(approval.spec.content.modal.fields.find((field) => field.slotId === "moment-detail-type")?.value).toBe("Flight cancellation — multi-step");
    expect(approval.spec.content.modal.fields.find((field) => field.slotId === "moment-detail-status")?.value).toBe("RESOLUTION");
    expect(approval.spec.content.modal.fields.find((field) => field.slotId === "moment-activity-1-tag")?.value).toBe("Steward triggered");
    expect(approval.spec.content.modal.fields.find((field) => field.slotId === "moment-activity-3-text")?.value).toContain("United Airlines");
    expect(approval.spec.content.modal.fields).toHaveLength(11);
    expect(approval.spec.content.modal.fields.find((field) => field.slotId === "moment-activity-4-tag")).toBeUndefined();
    expect(approval.spec.content.actionTrails?.[0]?.steps.at(-1)?.status).toBe("Gate");
  });

  it("varies response-card copy and evidence from the product brief", async () => {
    const searchResponse = await ruleBasedSpecProvider.generate({
      description: "Conversation Search helps teams find conversations by keywords and customer attributes.",
      uiTextLanguage: "en",
      forcedArchetype: "modal",
      recipeId: "response-card",
    });
    const refundResponse = await ruleBasedSpecProvider.generate({
      description: "AI-prepared response for a billing dispute refund that requires a policy check.",
      uiTextLanguage: "en",
      forcedArchetype: "modal",
      recipeId: "response-card",
    });

    expect(searchResponse.spec.archetype).toBe("modal");
    expect(refundResponse.spec.archetype).toBe("modal");
    if (searchResponse.spec.archetype !== "modal" || refundResponse.spec.archetype !== "modal") {
      throw new Error("Expected modal specs");
    }

    const searchFields = searchResponse.spec.content.modal.fields;
    const refundFields = refundResponse.spec.content.modal.fields;
    const searchBody = searchFields.find((field) => field.label === "Response")?.value;
    const refundBody = refundFields.find((field) => field.label === "Response")?.value;

    expect(searchBody).toContain("matching what customers said");
    expect(refundBody).toContain("refund policy");
    expect(searchFields.find((field) => field.slotId === "moment-source-1")?.value).toContain("Conversation filters");
    expect(refundFields.find((field) => field.slotId === "moment-source-1")?.value).toContain("Refund policy");
  });

  it("keeps response-card generated copy within layout-safe limits", async () => {
    const result = await ruleBasedSpecProvider.generate({
      description: [
        "Title: AI-prepared response for a very long customer resolution workflow",
        "Reviewer: Alexandra Catherine Montgomery",
        "Response: I reviewed the entire customer history, plan metadata, channel transcript, knowledge evidence, eligibility rules, and proposed next action before preparing a response for agent review.",
        "Source 1: Customer conversation history and subscription eligibility evidence|100% confirmed match",
        "Source 2: Internal refund and rebooking policy documentation archive|99% high confidence match",
        "Secondary CTA: Edit before sending",
        "Primary CTA: Send exactly as written",
      ].join("\n"),
      uiTextLanguage: "en",
      forcedArchetype: "modal",
      recipeId: "response-card",
    });

    expect(result.spec.archetype).toBe("modal");
    if (result.spec.archetype !== "modal") throw new Error("Expected modal spec");

    const fields = result.spec.content.modal.fields;
    const title = result.spec.content.modal.title;
    const reviewer = fields.find((field) => field.label === "Reviewer")?.value ?? "";
    const response = fields.find((field) => field.label === "Response")?.value ?? "";
    const source = fields.find((field) => field.slotId === "moment-source-1")?.value ?? "";
    const [sourceLabel, sourceMatch] = source.split("|");

    expect(title.length).toBeLessThanOrEqual(34);
    expect(reviewer.length).toBeLessThanOrEqual(24);
    expect(response.length).toBeLessThanOrEqual(150);
    expect(sourceLabel.length).toBeLessThanOrEqual(36);
    expect(sourceMatch.length).toBeLessThanOrEqual(10);
    expect(result.spec.content.modal.actions.every((action) => action.label.length <= 12)).toBe(true);
  });
});
