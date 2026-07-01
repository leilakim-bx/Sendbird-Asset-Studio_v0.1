import { describe, expect, it } from "vitest";
import { extractInfographicCandidates } from "@/lib/infographic-article-extractor";

const base = {
  format: "product" as const,
  bg: "warmgray" as const,
  accent: "lime" as const,
};

describe("extractInfographicCandidates", () => {
  it("routes single-interaction value props to resolution-specific infographic candidates", () => {
    const candidates = extractInfographicCandidates(
      [
        "Resolve needs in a single interaction.",
        "Complete requests without transfers or follow-ups, eliminating repeated calls and fragmented handoffs.",
      ].join("\n"),
      base,
    );

    expect(candidates.length).toBeGreaterThanOrEqual(3);
    expect(candidates[0]).toMatchObject({
      title: "One interaction resolution",
      blockType: "compare",
    });
    expect(candidates[0].content.blocks[0]).toMatchObject({
      type: "compare",
      columnA: "Fragmented",
      columnB: "Resolved",
      rows: expect.arrayContaining([
        expect.objectContaining({ a: "Repeated calls", b: "One complete answer" }),
        expect.objectContaining({ a: "Transfers reset context", b: "Context stays intact" }),
      ]),
    });
    expect(candidates.map((candidate) => candidate.title)).toContain("How one-touch resolution works");
    expect(candidates.map((candidate) => candidate.title)).not.toContain("Manual QA vs AI evaluation");
  });

  it("varies actionbook source copy inside the existing infographic block templates", () => {
    const candidates = extractInfographicCandidates(
      [
        "Openbook renders your actionbook as a visual flow.",
        "The Source view still holds the markup, but Flow view shows sections, intents, conditions, and content cards.",
        "Click any node to jump directly to that section in the editor.",
        "When legal changes a return window from 30 to 45 days, teams can find the responsible branch and update it.",
        "The loop is simple: zoom out, find the branch, click the node, edit the rule, and save the actionbook.",
      ].join(" "),
      base,
    );

    const blockTypes = candidates.map((candidate) => candidate.blockType);

    expect(candidates).toHaveLength(5);
    expect(blockTypes).toContain("stack");
    expect(blockTypes).toContain("node-list");
    expect(blockTypes).toContain("orbit");
    expect(candidates.every((candidate) => candidate.content.blocks.length === 1)).toBe(true);
    expect(candidates.every((candidate) => candidate.content.blocks[0].type === candidate.blockType)).toBe(true);
  });

  it("creates chart templates from pasted metric rows", () => {
    const candidates = extractInfographicCandidates(
      [
        "Billing 52% resolved, 31% assisted, 17% manual.",
        "Orders 61% resolved, 24% assisted, 15% manual.",
        "Access 44% resolved, 38% assisted, 18% manual.",
        "Overall automation reached 83% before escalation.",
      ].join("\n"),
      base,
    );

    expect(candidates.map((candidate) => candidate.blockType)).toContain("stacked-bar");
    const stacked = candidates.find((candidate) => candidate.blockType === "stacked-bar");
    expect(stacked?.content.blocks[0]).toMatchObject({
      type: "stacked-bar",
      rows: [
        { label: "Billing", values: [52, 31, 17] },
        { label: "Orders", values: [61, 24, 15] },
        { label: "Access", values: [44, 38, 18] },
      ],
    });
  });

  it("honors source guidance when ranking infographic candidates", () => {
    const candidates = extractInfographicCandidates(
      [
        "Asset type: infographic",
        "Structure: comparison",
        "Main message: Structured inputs improve routing accuracy.",
        "Proof points:",
        "- Unstructured notes leave block choice ambiguous.",
        "- Structured proof points give the router explicit visual anchors.",
        "Avoid: reservation, restaurant, booking examples",
      ].join("\n"),
      base,
    );

    expect(candidates[0]).toMatchObject({
      blockType: "compare",
    });
    expect(candidates[0].content.blocks[0]).toMatchObject({
      type: "compare",
      rows: expect.arrayContaining([
        expect.objectContaining({ b: expect.stringContaining("Unstructured notes") }),
      ]),
    });
    expect(JSON.stringify(candidates)).not.toMatch(/reservation|restaurant|booking/i);
  });

  it("uses structured process briefs to prioritize step candidates", () => {
    const candidates = extractInfographicCandidates(
      [
        "Structure: process",
        "Main message: Resolve needs in one interaction.",
        "Proof points:",
        "- Understand the request.",
        "- Complete the task.",
        "- Confirm the outcome.",
      ].join("\n"),
      base,
    );

    expect(candidates[0]).toMatchObject({
      blockType: "step",
    });
    expect(candidates[0].content.blocks[0]).toMatchObject({
      type: "step",
      items: [
        expect.objectContaining({ title: "Understand the request" }),
        expect.objectContaining({ title: "Complete the task" }),
        expect.objectContaining({ title: "Confirm the outcome" }),
      ],
    });
  });
});
