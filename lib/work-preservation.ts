import {
  WORK_DATA_SCHEMA_VERSION,
  type WorkDataKind,
  migrateWorkData,
  withWorkDataSchema,
} from "@/lib/work-data-schema";

export const WORK_BACKUP_STORAGE_KEY = "asset-studio-work-backups-v1";
export const WORK_BACKUP_LIMIT = 5;
export const WORK_REMOTE_BACKUP_MAX_BYTES = 3_500_000;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type WorkSnapshot<T = unknown> = {
  id: string;
  kind: WorkDataKind;
  templateId: string;
  createdAt: number;
  data: T;
};

export type WorkBackupStore = {
  schemaVersion: number;
  units: Record<string, WorkSnapshot[]>;
};

export type WorkBackupFile<T = unknown> = {
  schemaVersion: number;
  kind: WorkDataKind;
  templateId: string;
  exportedAt: number;
  data: T;
};

type PreserveOptions = {
  storage?: StorageLike;
  now?: number;
};

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function workUnitKey(kind: WorkDataKind, templateId: string) {
  return `${kind}:${templateId}`;
}

function emptyStore(): WorkBackupStore {
  return {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    units: {},
  };
}

export function readWorkBackupStore(storage: StorageLike | null = getBrowserStorage()): WorkBackupStore {
  if (!storage) return emptyStore();
  const raw = storage.getItem(WORK_BACKUP_STORAGE_KEY);
  if (!raw) return emptyStore();

  try {
    const parsed = JSON.parse(raw) as Partial<WorkBackupStore>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.units !== "object" ||
      parsed.units === null
    ) {
      return emptyStore();
    }

    return {
      schemaVersion: WORK_DATA_SCHEMA_VERSION,
      units: parsed.units as Record<string, WorkSnapshot[]>,
    };
  } catch {
    return emptyStore();
  }
}

function writeWorkBackupStore(store: WorkBackupStore, storage: StorageLike | null = getBrowserStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(WORK_BACKUP_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function listWorkSnapshots<T>(
  kind: WorkDataKind,
  templateId: string,
  storage: StorageLike | null = getBrowserStorage(),
): WorkSnapshot<T>[] {
  const store = readWorkBackupStore(storage);
  const snapshots = store.units[workUnitKey(kind, templateId)] ?? [];
  return snapshots as WorkSnapshot<T>[];
}

function snapshotId(kind: WorkDataKind, templateId: string, createdAt: number) {
  return `${kind}-${templateId}-${createdAt}`;
}

function serializeData(data: unknown) {
  try {
    return JSON.stringify(data);
  } catch {
    return "";
  }
}

export function preserveWorkSnapshot<T extends object>(
  kind: WorkDataKind,
  templateId: string,
  data: T,
  options: PreserveOptions = {},
): WorkSnapshot<T> | null {
  const storage = options.storage ?? getBrowserStorage();
  if (!storage) return null;

  const now = options.now ?? Date.now();
  const migratedData = migrateWorkData<T>(kind, withWorkDataSchema(data));
  const store = readWorkBackupStore(storage);
  const key = workUnitKey(kind, templateId);
  const existing = store.units[key] ?? [];
  const serialized = serializeData(migratedData);

  if (existing[0] && serializeData(existing[0].data) === serialized) {
    return existing[0] as WorkSnapshot<T>;
  }

  const snapshot: WorkSnapshot<T> = {
    id: snapshotId(kind, templateId, now),
    kind,
    templateId,
    createdAt: now,
    data: migratedData,
  };

  const nextSnapshots = [
    snapshot,
    ...existing.filter((item) => serializeData(item.data) !== serialized),
  ].slice(0, WORK_BACKUP_LIMIT);

  const nextStore: WorkBackupStore = {
    ...store,
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    units: {
      ...store.units,
      [key]: nextSnapshots,
    },
  };

  if (writeWorkBackupStore(nextStore, storage)) return snapshot;

  const compactStore: WorkBackupStore = {
    ...nextStore,
    units: {
      ...nextStore.units,
      [key]: nextSnapshots.slice(0, Math.max(1, Math.floor(WORK_BACKUP_LIMIT / 2))),
    },
  };
  return writeWorkBackupStore(compactStore, storage) ? snapshot : null;
}

export function createBackupFilePayload<T extends object>(
  kind: WorkDataKind,
  templateId: string,
  data: T,
  exportedAt = Date.now(),
): WorkBackupFile<T> {
  return {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    kind,
    templateId,
    exportedAt,
    data: migrateWorkData<T>(kind, withWorkDataSchema(data)),
  };
}

export function parseBackupFileText<T extends object>(
  expectedKind: WorkDataKind,
  text: string,
): WorkBackupFile<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This backup file could not be read.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("This backup file is not compatible with Studio.");
  }

  const file = parsed as Partial<WorkBackupFile>;
  if (file.kind !== expectedKind) {
    throw new Error("This backup file belongs to a different Studio tool.");
  }

  if (typeof file.templateId !== "string" || file.data === undefined) {
    throw new Error("This backup file is missing required data.");
  }

  return {
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
    kind: expectedKind,
    templateId: file.templateId,
    exportedAt: typeof file.exportedAt === "number" ? file.exportedAt : Date.now(),
    data: migrateWorkData<T>(expectedKind, file.data),
  };
}

export function backupFilename(kind: WorkDataKind, exportedAt = Date.now()) {
  const stamp = new Date(exportedAt).toISOString().replace(/[:.]/g, "-");
  return `${kind}-backup-${stamp}.assetbackup`;
}
