import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

// This constant is synchronized with the Block union in lib/store.ts.
const EXPECTED_CHAT_BLOCK_TYPES = [
  "text",
  "actions",
  "products",
  "checklist",
  "status",
  "voice",
  "itinerary",
] as const;

// This constant is synchronized with the InfographicBlock union in lib/types/infographic.ts.
const EXPECTED_INFOGRAPHIC_BLOCK_TYPES = [
  "stat",
  "kpi-group",
  "card-grid",
  "bar-group",
  "step",
  "process-loop",
  "stack",
  "node-list",
  "compare",
  "stacked-bar",
  "line-chart",
  "orbit",
] as const;

function readRepoFile(repoPath: string) {
  return readFileSync(path.join(rootDir, repoPath), "utf8");
}

function hasStringLiteral(source: string, value: string) {
  return source.includes(`"${value}"`) || source.includes(`'${value}'`);
}

function expectTypeLiteral(repoPath: string, type: string) {
  expect(
    hasStringLiteral(readRepoFile(repoPath), type),
    `블록 '${type}'가 ${repoPath}에 없음 — 새 블록을 추가했다면 이 파일에도 분기를 추가할 것`,
  ).toBe(true);
}

describe("chat block conformance", () => {
  const requiredFiles = [
    "components/templates/FeatureMockup.tsx",
    "components/editor/FormPanel.tsx",
    "lib/ai/validate-scenario.ts",
  ];

  it("keeps renderer, editor, and validator branches in sync", () => {
    for (const type of EXPECTED_CHAT_BLOCK_TYPES) {
      for (const repoPath of requiredFiles) {
        expectTypeLiteral(repoPath, type);
      }
    }
  });
});

describe("infographic block conformance", () => {
  it("keeps renderer and editor branches in sync", () => {
    for (const type of EXPECTED_INFOGRAPHIC_BLOCK_TYPES) {
      expectTypeLiteral("components/infographic/blocks/BlockRenderer.tsx", type);
      expectTypeLiteral("components/infographic/sidebar/BlockEditor.tsx", type);
    }
  });

  it("keeps every block reachable from presets or the sidebar", () => {
    const presets = readRepoFile("lib/infographic-presets.ts");
    const sidebar = readRepoFile("components/infographic/InfographicSidebar.tsx");

    for (const type of EXPECTED_INFOGRAPHIC_BLOCK_TYPES) {
      expect(
        hasStringLiteral(presets, type) || hasStringLiteral(sidebar, type),
        `블록 '${type}'가 lib/infographic-presets.ts 또는 components/infographic/InfographicSidebar.tsx에 없음 — 새 블록을 추가했다면 이 파일에도 진입 경로를 추가할 것`,
      ).toBe(true);
    }
  });
});
