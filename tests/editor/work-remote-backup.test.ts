import { describe, expect, it, vi } from "vitest";
import {
  WORK_BACKUP_CLIENT_ID_KEY,
  canSyncRemoteSnapshot,
  getWorkBackupClientId,
  listRemoteWorkSnapshots,
  saveRemoteWorkSnapshot,
} from "@/lib/work-remote-backup";
import type { StorageLike, WorkSnapshot } from "@/lib/work-preservation";
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

function snapshot(title = "Draft"): WorkSnapshot {
  return {
    id: "infographic-infographic-1234",
    kind: "infographic",
    templateId: "infographic",
    createdAt: 1_234,
    data: {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      title,
    },
  };
}

describe("remote work backups", () => {
  it("keeps a stable browser client id", () => {
    const storage = new MemoryStorage();
    const first = getWorkBackupClientId(storage);
    const second = getWorkBackupClientId(storage);

    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(storage.getItem(WORK_BACKUP_CLIENT_ID_KEY)).toBe(first);
  });

  it("skips snapshots that exceed the remote payload budget", () => {
    const bigSnapshot = snapshot("x".repeat(100));

    expect(canSyncRemoteSnapshot(bigSnapshot, 20)).toBe(false);
  });

  it("posts a snapshot to the work backup route", async () => {
    const storage = new MemoryStorage();
    storage.setItem(WORK_BACKUP_CLIENT_ID_KEY, "client-12345678");
    const fetcher = vi.fn(async (_input: string | URL, _init?: RequestInit) => {
      void _input;
      void _init;
      return Response.json({ enabled: true, saved: true });
    });

    const result = await saveRemoteWorkSnapshot(snapshot(), { storage, fetcher });

    expect(result).toEqual({ enabled: true, saved: true });
    expect(fetcher).toHaveBeenCalledOnce();
    const call = fetcher.mock.calls[0];
    expect(call).toBeDefined();
    const init = call?.[1];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      clientId: "client-12345678",
      snapshot: {
        id: "infographic-infographic-1234",
        kind: "infographic",
        templateId: "infographic",
      },
    });
  });

  it("returns an empty list when remote backup storage is disabled", async () => {
    const storage = new MemoryStorage();
    storage.setItem(WORK_BACKUP_CLIENT_ID_KEY, "client-12345678");
    const fetcher = vi.fn(async (_input: string | URL, _init?: RequestInit) => {
      void _input;
      void _init;
      return Response.json({ enabled: false, snapshots: [] });
    });

    const snapshots = await listRemoteWorkSnapshots("infographic", "infographic", {
      storage,
      fetcher,
    });

    expect(snapshots).toEqual([]);
  });
});
