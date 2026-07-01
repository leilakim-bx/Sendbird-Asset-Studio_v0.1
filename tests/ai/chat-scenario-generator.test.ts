import { describe, expect, it } from "vitest";
import {
  chatScenarioGeneratorInternals,
  generateChatScenarioMessages,
} from "@/lib/ai/chat-scenario-generator";
import { validateScenario } from "@/lib/ai/validate-scenario";

describe("generateChatScenarioMessages", () => {
  it("routes repeated calls and fragmented handoffs to single-interaction resolution, not voice", () => {
    const prompt = [
      "Resolve needs in a single interaction.",
      "Complete requests without transfers or follow-ups, eliminating repeated calls and fragmented handoffs.",
    ].join(" ");

    expect(chatScenarioGeneratorInternals.selectIntent(prompt)).toBe("single-interaction");

    const messages = validateScenario(generateChatScenarioMessages(prompt));

    expect(messages.map((message) => message.block.type)).toEqual([
      "text",
      "text",
      "checklist",
      "status",
    ]);
    expect(messages.some((message) => message.block.type === "voice")).toBe(false);
    expect(messages[1]).toMatchObject({
      role: "bot",
      block: {
        type: "text",
        text: expect.stringContaining("one clear confirmation"),
        verifications: expect.arrayContaining([
          "Confirmed no handoff is needed",
        ]),
      },
    });
    expect(messages[3].block).toMatchObject({
      type: "status",
      label: "Resolved in one interaction",
      variant: "success",
    });
  });

  it("only chooses voice for voice-specific call language", () => {
    const prompt = "Use an outbound phone call to confirm a reservation.";

    expect(chatScenarioGeneratorInternals.selectIntent(prompt)).toBe("voice");

    const messages = validateScenario(generateChatScenarioMessages(prompt));

    expect(messages).toHaveLength(1);
    expect(messages[0].block).toMatchObject({
      type: "voice",
      eyebrow: "Voice AI",
    });
  });

  it("keeps generic request copy when no strong intent is detected", () => {
    const prompt = "Give customers a helpful answer.";
    const messages = validateScenario(generateChatScenarioMessages(prompt));

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      role: "user",
      block: { type: "text", text: prompt },
    });
  });

  it("does not treat structured brief option placeholders as selected intents", () => {
    const prompt = [
      "Scenario: customer support / voice AI / ecommerce / escalation",
      "Customer goal: Give customers a helpful answer.",
      "Agent action: Answer the question.",
      "Outcome: Clear next step.",
      "Avoid: voice card, reservation, booking examples",
    ].join("\n");

    expect(chatScenarioGeneratorInternals.selectIntent(prompt)).toBe("generic");

    const messages = validateScenario(generateChatScenarioMessages(prompt));
    expect(messages.some((message) => message.block.type === "voice")).toBe(false);
  });

  it("uses structured outcome fields to prioritize single-interaction resolution", () => {
    const prompt = [
      "Scenario: customer support",
      "Customer goal: Resolve needs in a single interaction.",
      "Agent action: Complete the request without transfer.",
      "Outcome: No follow-up and one final confirmation.",
      "Avoid: reservation, restaurant, booking examples",
    ].join("\n");

    expect(chatScenarioGeneratorInternals.selectIntent(prompt)).toBe("single-interaction");

    const messages = validateScenario(generateChatScenarioMessages(prompt));
    expect(messages.map((message) => message.block.type)).toEqual([
      "text",
      "text",
      "checklist",
      "status",
    ]);
  });
});
