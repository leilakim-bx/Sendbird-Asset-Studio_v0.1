export const WORK_DATA_SCHEMA_VERSION = 4;

export type WorkDataKind = "chat" | "infographic" | "product-visual";

type VersionedRecord = Record<string, unknown> & { schemaVersion?: unknown };
type Migration = (data: VersionedRecord) => VersionedRecord;

const MIGRATIONS: Record<WorkDataKind, Record<number, Migration>> = {
  chat: {
    1: (data) => data,
    2: (data) => data,
    3: (data) => data,
  },
  infographic: {
    1: (data) => data,
    2: (data) => data,
    3: (data) => data,
  },
  "product-visual": {
    1: (data) => data,
    2: (data) => data,
    3: (data) => data,
  },
};

export type VersionedWorkData<T extends object> = T & {
  schemaVersion: number;
};

export function withWorkDataSchema<T extends object>(data: T): VersionedWorkData<T> {
  return {
    ...data,
    schemaVersion: WORK_DATA_SCHEMA_VERSION,
  };
}

export function migrateWorkData<T extends object>(
  kind: WorkDataKind,
  raw: unknown,
): VersionedWorkData<T> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("This backup file is not compatible with Studio.");
  }

  let data: VersionedRecord = { ...(raw as VersionedRecord) };
  let version = typeof data.schemaVersion === "number"
    ? data.schemaVersion
    : WORK_DATA_SCHEMA_VERSION;

  if (!Number.isInteger(version) || version < 1) {
    throw new Error("This backup file has an unsupported version.");
  }

  if (version > WORK_DATA_SCHEMA_VERSION) {
    throw new Error("This backup file was created by a newer version of Studio.");
  }

  while (version < WORK_DATA_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[kind][version];
    if (!migrate) {
      throw new Error("This backup file cannot be upgraded by this version of Studio.");
    }
    data = migrate(data);
    version += 1;
    data.schemaVersion = version;
  }

  return withWorkDataSchema(data as T);
}
