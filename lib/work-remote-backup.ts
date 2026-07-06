import type { WorkDataKind } from "@/lib/work-data-schema";
import {
  WORK_REMOTE_BACKUP_MAX_BYTES,
  type StorageLike,
  type WorkSnapshot,
} from "@/lib/work-preservation";

export const WORK_BACKUP_CLIENT_ID_KEY = "asset-studio-work-backup-client-v1";

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

type ClientOptions = {
  fetcher?: FetchLike;
  storage?: StorageLike | null;
};

type SaveRemoteResult = {
  enabled: boolean;
  saved: boolean;
  skipped?: "too-large" | "no-client-id";
};

type ListRemoteResponse<T> = {
  enabled: boolean;
  snapshots: WorkSnapshot<T>[];
};

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getWorkBackupClientId(storage: StorageLike | null = getBrowserStorage()) {
  if (!storage) return null;
  const existing = storage.getItem(WORK_BACKUP_CLIENT_ID_KEY);
  if (existing) return existing;

  const next = createClientId();
  try {
    storage.setItem(WORK_BACKUP_CLIENT_ID_KEY, next);
    return next;
  } catch {
    return null;
  }
}

function serializedByteLength(value: unknown) {
  const serialized = JSON.stringify(value);
  return new TextEncoder().encode(serialized).byteLength;
}

export function canSyncRemoteSnapshot(snapshot: WorkSnapshot, maxBytes = WORK_REMOTE_BACKUP_MAX_BYTES) {
  try {
    return serializedByteLength(snapshot) <= maxBytes;
  } catch {
    return false;
  }
}

function apiUrl(path: string) {
  if (typeof window === "undefined") return new URL(path, "http://localhost");
  return new URL(path, window.location.origin);
}

export async function saveRemoteWorkSnapshot<T>(
  snapshot: WorkSnapshot<T>,
  options: ClientOptions = {},
): Promise<SaveRemoteResult> {
  if (!canSyncRemoteSnapshot(snapshot)) {
    return { enabled: true, saved: false, skipped: "too-large" };
  }

  const clientId = getWorkBackupClientId(options.storage ?? getBrowserStorage());
  if (!clientId) return { enabled: false, saved: false, skipped: "no-client-id" };

  const fetcher = options.fetcher ?? fetch;
  let response: Response;
  try {
    response = await fetcher(apiUrl("/api/work-backups"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, snapshot }),
    });
  } catch {
    return { enabled: true, saved: false };
  }

  if (!response.ok) {
    return { enabled: true, saved: false };
  }

  return await response.json() as SaveRemoteResult;
}

export async function listRemoteWorkSnapshots<T>(
  kind: WorkDataKind,
  templateId: string,
  options: ClientOptions = {},
): Promise<WorkSnapshot<T>[]> {
  const clientId = getWorkBackupClientId(options.storage ?? getBrowserStorage());
  if (!clientId) return [];

  const url = apiUrl("/api/work-backups");
  url.searchParams.set("clientId", clientId);
  url.searchParams.set("kind", kind);
  url.searchParams.set("templateId", templateId);

  const fetcher = options.fetcher ?? fetch;
  let response: Response;
  try {
    response = await fetcher(url);
  } catch {
    return [];
  }
  if (!response.ok) return [];

  const payload = await response.json() as ListRemoteResponse<T>;
  return payload.enabled ? payload.snapshots : [];
}
