import { describe, expect, it } from "vitest";
import {
  WORK_BACKUP_LIMIT,
  createBackupFilePayload,
  listWorkSnapshots,
  parseBackupFileText,
  preserveWorkSnapshot,
  type StorageLike,
} from "@/lib/work-preservation";
import { WORK_DATA_SCHEMA_VERSION } from "@/lib/work-data-schema";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

type TestWork = {
  schemaVersion: number;
  title: string;
  blocks: Array<{ id: string; value: string }>;
};

function work(index: number): TestWork {
  return {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    title: `Work ${index}`,
    blocks: [{ id: `b-${index}`, value: String(index) }],
  };
}

describe("work preservation", () => {
  it("keeps only the five newest automatic snapshots per work unit", () => {
    const storage = new MemoryStorage();

    for (let index = 0; index < 8; index += 1) {
      preserveWorkSnapshot("infographic", "infographic", work(index), {
        storage,
        now: 1_000 + index,
      });
    }

    const snapshots = listWorkSnapshots<TestWork>("infographic", "infographic", storage);

    expect(snapshots).toHaveLength(WORK_BACKUP_LIMIT);
    expect(snapshots[0]?.data.title).toBe("Work 7");
    expect(snapshots.at(-1)?.data.title).toBe("Work 3");
  });

  it("round-trips a backup file without losing work data", () => {
    const original = work(12);
    const payload = createBackupFilePayload("infographic", "infographic", original, 1_234);
    const imported = parseBackupFileText<TestWork>("infographic", JSON.stringify(payload));

    expect(imported.schemaVersion).toBe(WORK_DATA_SCHEMA_VERSION);
    expect(imported.kind).toBe("infographic");
    expect(imported.templateId).toBe("infographic");
    expect(imported.data).toEqual(original);
  });

  it("rejects backup files for a different tool", () => {
    const payload = createBackupFilePayload("chat", "feature-mockup", {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      messages: [],
    }, 1_234);

    expect(() =>
      parseBackupFileText("infographic", JSON.stringify(payload)),
    ).toThrow("different Studio tool");
  });
});
