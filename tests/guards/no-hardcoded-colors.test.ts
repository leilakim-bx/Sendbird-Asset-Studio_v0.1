import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();
const componentsDir = path.join(rootDir, "components");

const LINE_ALLOWLIST = new Set<string>();

const colorPatterns = [
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F\w])/g,
  /\brgba?\(/g,
  /\boklch\(/g,
  /\bhsl\(/g,
];

function toRepoPath(filePath: string) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function isTargetSourceFile(filePath: string) {
  return filePath.endsWith(".ts") || filePath.endsWith(".tsx");
}

function isExcludedPath(repoPath: string) {
  return repoPath.startsWith("components/concept-ui/dev/");
}

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const absolutePath = path.join(dir, entry);
    const repoPath = toRepoPath(absolutePath);

    if (isExcludedPath(repoPath)) continue;

    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
      continue;
    }

    if (stats.isFile() && isTargetSourceFile(absolutePath)) {
      files.push(absolutePath);
    }
  }

  return files;
}

describe("component color token guard", () => {
  it("does not hardcode component colors outside dev harnesses", () => {
    const violations: string[] = [];

    for (const filePath of collectSourceFiles(componentsDir)) {
      const repoPath = toRepoPath(filePath);
      const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

      lines.forEach((line, index) => {
        const location = `${repoPath}:${index + 1}`;
        if (LINE_ALLOWLIST.has(location)) return;

        if (colorPatterns.some((pattern) => {
          pattern.lastIndex = 0;
          return pattern.test(line);
        })) {
          violations.push(`${location}:${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
