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
    expect(prompt).toContain(description);
    expect(prompt).toContain("Few-shot example for dashboard");
    expect(prompt).toContain('"titleText": "string, 1-56 chars"');
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

  it("hard-fails structural problems with a plain-language error", () => {
    const result = parseLlmSceneSpecResponse(JSON.stringify({ archetype: "calendar", theme: "light" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorType).toBe("structural");
      expect(result.message).not.toMatch(/Zod|invalid_union/i);
    }
  });
});
