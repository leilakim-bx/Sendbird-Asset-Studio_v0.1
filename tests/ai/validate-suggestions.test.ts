import { describe, expect, it, vi } from "vitest";
import {
  suggestionToBlock,
  validateSuggestions,
} from "@/lib/ai/validate-suggestions";

describe("validateSuggestions", () => {
  it("keeps valid high-confidence suggestions and converts them into blocks", () => {
    const suggestions = validateSuggestions({
      suggestions: [
        {
          blockType: "stat",
          confidence: 0.92,
          sourceQuote: "83% of consumers credit the brand for using AI.",
          suggestedTitle: "AI is brand equity now.",
          suggestedContent: {
            type: "stat",
            eyebrow: "Retail",
            number: "83%",
            highlightNumber: true,
            label: "link AI to brand trust",
          },
        },
        {
          blockType: "bar-group",
          confidence: "0.86",
          sourceQuote: "49% prefer AI versus 34% for human agents.",
          suggestedContent: {
            type: "bar-group",
            labelA: "prefer AI",
            labelB: "prefer human",
            unit: "%",
            items: [
              {
                label: "Check order status",
                valueA: "49",
                valueB: "34",
                highlight: true,
              },
            ],
          },
        },
      ],
    });

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toMatchObject({
      blockType: "stat",
      confidence: 0.92,
      suggestedContent: {
        type: "stat",
        number: "83%",
      },
    });
    expect(suggestions[1]).toMatchObject({
      blockType: "bar-group",
      confidence: 0.86,
      suggestedContent: {
        type: "bar-group",
        items: [{ valueA: 49, valueB: 34 }],
      },
    });

    const block = suggestionToBlock(suggestions[0]);
    expect(block).toMatchObject({
      type: "stat",
      eyebrow: "Retail",
      number: "83%",
      label: "link AI to brand trust",
    });
    expect(block.id).toMatch(/^blk-/);
  });

  it("drops malformed, low-confidence, and mismatched suggestions", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const suggestions = validateSuggestions([
      {
        blockType: "stat",
        confidence: 0.69,
        sourceQuote: "83% of consumers credit the brand for using AI.",
        suggestedContent: {
          type: "stat",
          number: "83%",
        },
      },
      {
        blockType: "stat",
        confidence: 0.9,
        sourceQuote: "49% prefer AI versus 34% for human agents.",
        suggestedContent: {
          type: "bar-group",
          items: [{ label: "Check order status", valueA: 49, valueB: 34 }],
        },
      },
      {
        blockType: "step",
        confidence: 0.8,
        sourceQuote: "The system detects a signal and resolves the issue.",
        suggestedContent: {
          type: "step",
          items: [],
        },
      },
      {
        blockType: "node-list",
        confidence: 0.82,
        sourceQuote: "Agents coordinate across channels.",
        suggestedContent: {
          type: "node-list",
          hubTitle: "Agent orchestration",
          items: [{ label: "Email" }],
        },
      },
    ]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      blockType: "node-list",
      suggestedContent: {
        type: "node-list",
        hubTitle: "Agent orchestration",
      },
    });
    expect(warn).toHaveBeenCalled();
  });

  it("keeps suggestions when sourceQuote is not verbatim but warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const suggestions = validateSuggestions(
      [
        {
          blockType: "stat",
          confidence: 0.9,
          sourceQuote: "83% credit the brand.",
          suggestedContent: {
            type: "stat",
            number: "83%",
          },
        },
      ],
      "Most consumers say they associate AI experiences with the company behind them.",
    );

    expect(suggestions).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("sourceQuote not found verbatim"),
      expect.any(String),
    );
  });
});
