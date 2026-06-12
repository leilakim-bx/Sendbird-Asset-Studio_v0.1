import { describe, expect, it, vi } from "vitest";
import { validateScenario } from "@/lib/ai/validate-scenario";

describe("validateScenario", () => {
  it("converts valid flat model output into nested chat messages", () => {
    const messages = validateScenario([
      {
        type: "text",
        role: "user",
        sender: "Taylor",
        text: "Can you find a dress?",
      },
      {
        type: "text",
        sender: "bot",
        text: "Here are two options.",
        verifications: ["Checked inventory"],
        buttons: ["Show more"],
      },
      {
        type: "products",
        items: [
          {
            name: "Lace Dress",
            sub: "$82",
            cta: "Add to cart",
            imageQuery: "lace dress",
          },
        ],
      },
      {
        type: "checklist",
        items: [
          { label: "Check inventory", status: "done", badge: "API" },
          { label: "Reserve item", status: "pending" },
        ],
      },
      {
        type: "status",
        label: "Ready to purchase",
        variant: "success",
      },
    ]);

    expect(messages).toHaveLength(5);
    expect(messages[0]).toMatchObject({
      role: "user",
      sender: "Taylor",
      block: { type: "text", text: "Can you find a dress?" },
    });
    expect(messages[1]).toMatchObject({
      role: "bot",
      block: {
        type: "text",
        text: "Here are two options.",
        verifications: ["Checked inventory"],
        buttons: ["Show more"],
      },
    });
    expect(messages[2]).toMatchObject({
      role: "bot",
      block: {
        type: "products",
        items: [
          {
            img: "",
            name: "Lace Dress",
            sub: "$82",
            cta: "Add to cart",
            imageQuery: "lace dress",
          },
        ],
      },
    });
    expect(messages[3].block).toMatchObject({
      type: "checklist",
      items: [
        { label: "Check inventory", status: "done", badge: "API" },
        { label: "Reserve item", status: "pending" },
      ],
    });
  });

  it("drops malformed messages and caps non-voice scenarios", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const raw = [
      { type: "text", role: "user", text: "Start" },
      { type: "status", label: "One", variant: "success" },
      { type: "status", label: "Two", variant: "warning" },
      { type: "status", label: "Three", variant: "success" },
      { type: "status", label: "Four", variant: "success" },
      { type: "status", label: "Five", variant: "success" },
      { type: "status", label: "Six", variant: "success" },
      { type: "status", label: "Bad variant", variant: "danger" },
    ];

    const messages = validateScenario(raw);

    expect(messages).toHaveLength(6);
    expect(messages.map((message) => message.block.type)).toEqual([
      "text",
      "status",
      "status",
      "status",
      "status",
      "status",
    ]);
    expect(warn).toHaveBeenCalled();
  });

  it("collapses any voice output to one standalone voice card", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const messages = validateScenario([
      { type: "text", role: "user", text: "Call me" },
      {
        type: "voice",
        style: "player",
        transcript: "Your appointment is confirmed.",
        eyebrow: "Voice AI",
      },
      { type: "status", label: "Confirmed", variant: "success" },
    ]);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      role: "bot",
      block: {
        type: "voice",
        style: "player",
        transcript: "Your appointment is confirmed.",
        eyebrow: "Voice AI",
      },
    });
    expect(warn).toHaveBeenCalled();
  });
});
