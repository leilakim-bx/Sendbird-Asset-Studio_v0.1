import { describe, expect, it } from "vitest";
import { parseLlmSceneSpecResponse } from "@/lib/concept-ui/llm-response";
import { buildAiChatPrompt } from "@/lib/concept-ui/promptTemplates";
import { mapDescriptionToArchetype } from "@/lib/concept-ui/provider";
import { conceptUiSamples } from "@/lib/concept-ui/samples";

describe("AI chat Concept UI workflow", () => {
  it("builds a complete external chat prompt with schema, hint, example, and description", () => {
    const description = "AI response quality monitoring dashboard";
    const prompt = buildAiChatPrompt({
      description,
      uiTextLanguage: "en",
      choice: mapDescriptionToArchetype(description),
    });

    expect(prompt).toContain("Respond with ONLY a single JSON object");
    expect(prompt).toContain("SceneSpec schema");
    expect(prompt).toContain("Use archetype: \"dashboard\"");
    expect(prompt).toContain('The top-level object MUST use the key "archetype"');
    expect(prompt).toContain(description);
    expect(prompt).toContain("Few-shot example for dashboard");
    expect(prompt).toContain('"titleText": "string, 1-56 chars"');
    expect(prompt).toContain("Treat the marketer description as a feature brief");
    expect(prompt).toContain("Convert long paragraphs into compact SaaS UI labels");
    expect(prompt).toContain("Use delight.ai domain context");
  });

  it("guides generic agent flows toward dashboard kit instead of builder canvas", () => {
    const description = "Procedure-trained agent flow";
    const prompt = buildAiChatPrompt({
      description,
      uiTextLanguage: "en",
      choice: mapDescriptionToArchetype(description),
    });

    expect(prompt).toContain('Use archetype: "dashboard"');
    expect(prompt).toContain("For generic resolution flows");
    expect(prompt).toContain("Few-shot example for dashboard");
  });

  it("parses fenced JSON with prose before and after it", () => {
    const spec = conceptUiSamples[0].spec;
    const response = [
      "Here is the data:",
      "```json",
      JSON.stringify(spec, null, 2),
      "```",
      "Done.",
    ].join("\n");

    const result = parseLlmSceneSpecResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.archetype).toBe(spec.archetype);
      expect(result.shortened).toBe(false);
    }
  });

  it("auto-shortens overlong text fields instead of rejecting them", () => {
    const spec = structuredClone(conceptUiSamples[0].spec);
    if (spec.archetype !== "inbox") throw new Error("Expected inbox sample");
    spec.content.conversations[0].title = "x".repeat(80);

    const result = parseLlmSceneSpecResponse(JSON.stringify(spec));

    expect(result.ok).toBe(true);
    if (result.ok && result.spec.archetype === "inbox") {
      expect(result.shortened).toBe(true);
      expect(result.notice).toBe("Some text was shortened to fit.");
      expect(result.spec.content.conversations[0].title).toHaveLength(40);
    }
  });

  it("accepts common AI wrappers and layout aliases", () => {
    const spec = structuredClone(conceptUiSamples.find((sample) => sample.spec.archetype === "dashboard")!.spec);
    const response = JSON.stringify({
      sceneSpec: {
        ...spec,
        archetype: undefined,
        layout: "analytics dashboard",
      },
    });

    const result = parseLlmSceneSpecResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.archetype).toBe("dashboard");
      expect(result.notice).toBe("AI reply adjusted to fit Studio.");
    }
  });

  it("converts recognizable non-Studio AI JSON to the closest valid layout", () => {
    const response = JSON.stringify({
      layout: "conversation detail screen",
      title: "AI agent conversation details",
      header: { product: "delight.ai Inbox" },
      panels: [
        { type: "conversation_list", title: "Customer conversations" },
        { type: "message_thread", title: "AI handled reply" },
        { type: "customer_context", title: "AI detail" },
      ],
    });

    const result = parseLlmSceneSpecResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.archetype).toBe("inbox");
      expect(result.spec.content.title).toBe("AI agent conversation details");
      expect(result.notice).toBe("AI reply was converted to the closest Studio layout.");
    }
  });

  it("normalizes table cells when AI omits explicit cell kinds", () => {
    const response = JSON.stringify({
      archetype: "table",
      theme: "light",
      content: {
        productName: "delight.ai Control",
        title: "AI action oversight",
        subtitle: "Review proposed AI actions, confirm risk, and keep a clear approval trail.",
        toolbar: {
          searchPlaceholder: "Search AI actions",
          filters: ["Needs review", "High impact", "Approved", "Blocked", "Auto run"],
          bulkSelect: true,
        },
        columns: [
          { key: "action", label: "Action", width: 220 },
          { key: "customer", label: "Customer", width: 190 },
          { key: "risk", label: "Risk", width: 110 },
          { key: "status", label: "Status", width: 130 },
          { key: "reviewer", label: "Reviewer", width: 150 },
          { key: "time", label: "Time", width: 110 },
        ],
        rows: Array.from({ length: 6 }, (_, index) => ({
          slotId: `row-action-${index}`,
          cells: [
            { value: index === 0 ? "Apply service credit" : "Refund shipping fee" },
            { name: "Ava Brooks", detail: "Premium account" },
            { value: index === 0 ? "High" : "Low", tone: index === 0 ? "warn" : "good" },
            { value: index === 0 ? "Needs review" : "Approved", tone: index === 0 ? "ai" : "good" },
            { name: "Sam Lee", detail: "Support lead" },
            { value: "2m ago" },
          ],
        })),
      },
      modifiers: {
        aiCallout: {
          targetSlotId: "row-action-0",
          label: "AI review",
          description: "Surfaces action risk, customer impact, and reviewer state before approval.",
        },
        cursor: { targetSlotId: "row-action-0" },
        highlightedSlotId: "row-action-0",
      },
    });

    const result = parseLlmSceneSpecResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.archetype).toBe("table");
      expect(result.notice).toBe("AI reply adjusted to fit Studio.");
      if (result.spec.archetype !== "table") throw new Error("Expected table spec");
      expect(result.spec.content.rows[0].cells[0].kind).toBe("text");
      expect(result.spec.content.rows[0].cells[1].kind).toBe("person");
      expect(result.spec.content.rows[0].cells[2].kind).toBe("badge");
      expect(result.spec.content.rows[0].cells[5].kind).toBe("date");
    }
  });

  it("hard-fails structural problems with a plain-language error", () => {
    const result = parseLlmSceneSpecResponse(JSON.stringify({ archetype: "calendar", theme: "light" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorType).toBe("structural");
      expect(result.message).not.toMatch(/Zod|invalid_union/i);
    }
  });
});
