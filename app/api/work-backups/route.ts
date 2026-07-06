import { del, get, list, put } from "@vercel/blob";
import type { WorkDataKind } from "@/lib/work-data-schema";
import {
  WORK_BACKUP_LIMIT,
  WORK_REMOTE_BACKUP_MAX_BYTES,
  createBackupFilePayload,
  parseBackupFileText,
  type WorkSnapshot,
} from "@/lib/work-preservation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_KINDS = new Set<WorkDataKind>(["chat", "infographic", "product-visual"]);
const CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/;

type PostBody = {
  clientId?: unknown;
  snapshot?: unknown;
};

function hasBlobCredentials() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID),
  );
}

function jsonByteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function isWorkDataKind(value: unknown): value is WorkDataKind {
  return typeof value === "string" && VALID_KINDS.has(value as WorkDataKind);
}

function safePathPart(value: string) {
  return encodeURIComponent(value).replace(/%/g, "_");
}

function backupPrefix(clientId: string, kind: WorkDataKind, templateId: string) {
  return `work-backups/${safePathPart(clientId)}/${kind}/${safePathPart(templateId)}/`;
}

function snapshotPath(clientId: string, snapshot: WorkSnapshot) {
  const prefix = backupPrefix(clientId, snapshot.kind, snapshot.templateId);
  return `${prefix}${snapshot.createdAt}-${safePathPart(snapshot.id)}.assetbackup`;
}

function validateClientId(value: unknown) {
  return typeof value === "string" && CLIENT_ID_PATTERN.test(value) ? value : null;
}

function validateSnapshot(value: unknown): WorkSnapshot | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const snapshot = value as Partial<WorkSnapshot>;
  if (typeof snapshot.id !== "string") return null;
  if (!isWorkDataKind(snapshot.kind)) return null;
  if (typeof snapshot.templateId !== "string" || !snapshot.templateId.trim()) return null;
  if (typeof snapshot.createdAt !== "number" || !Number.isFinite(snapshot.createdAt)) return null;
  if (typeof snapshot.data !== "object" || snapshot.data === null || Array.isArray(snapshot.data)) return null;

  return {
    id: snapshot.id,
    kind: snapshot.kind,
    templateId: snapshot.templateId,
    createdAt: snapshot.createdAt,
    data: snapshot.data,
  };
}

async function streamToText(stream: ReadableStream<Uint8Array>) {
  return await new Response(stream).text();
}

async function readSnapshotBlob<T extends object>(
  pathname: string,
  expectedKind: WorkDataKind,
): Promise<WorkSnapshot<T> | null> {
  const blob = await get(pathname, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200) return null;

  try {
    const text = await streamToText(blob.stream);
    const backup = parseBackupFileText<T>(expectedKind, text);
    return {
      id: `${backup.kind}-${backup.templateId}-${backup.exportedAt}`,
      kind: backup.kind,
      templateId: backup.templateId,
      createdAt: backup.exportedAt,
      data: backup.data,
    };
  } catch {
    return null;
  }
}

async function trimRemoteBackups(prefix: string) {
  const result = await list({ prefix, limit: WORK_BACKUP_LIMIT + 10 });
  const sorted = result.blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  const stale = sorted.slice(WORK_BACKUP_LIMIT).map((blob) => blob.pathname);
  if (stale.length > 0) await del(stale);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = validateClientId(url.searchParams.get("clientId"));
  const kind = url.searchParams.get("kind");
  const templateId = url.searchParams.get("templateId");

  if (!clientId || !isWorkDataKind(kind) || !templateId) {
    return Response.json({ error: "Invalid backup request." }, { status: 400 });
  }

  if (!hasBlobCredentials()) {
    return Response.json({ enabled: false, snapshots: [] });
  }

  try {
    const prefix = backupPrefix(clientId, kind, templateId);
    const result = await list({ prefix, limit: WORK_BACKUP_LIMIT });
    const sorted = result.blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    const readSnapshots = await Promise.all(
      sorted.map((blob) => readSnapshotBlob<object>(blob.pathname, kind)),
    );
    const snapshots = readSnapshots.filter(
      (snapshot): snapshot is WorkSnapshot<object> => Boolean(snapshot && snapshot.templateId === templateId),
    );

    return Response.json({ enabled: true, snapshots });
  } catch {
    return Response.json({ error: "Could not load backups." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: PostBody;
  try {
    body = await request.json() as PostBody;
  } catch {
    return Response.json({ error: "Invalid backup request." }, { status: 400 });
  }

  const clientId = validateClientId(body.clientId);
  const snapshot = validateSnapshot(body.snapshot);

  if (!clientId || !snapshot) {
    return Response.json({ error: "Invalid backup request." }, { status: 400 });
  }

  if (jsonByteLength(snapshot) > WORK_REMOTE_BACKUP_MAX_BYTES) {
    return Response.json({ enabled: true, saved: false, skipped: "too-large" });
  }

  if (!hasBlobCredentials()) {
    return Response.json({ enabled: false, saved: false });
  }

  try {
    const exportedAt = snapshot.createdAt || Date.now();
    const payload = createBackupFilePayload(
      snapshot.kind,
      snapshot.templateId,
      snapshot.data as object,
      exportedAt,
    );
    const text = JSON.stringify(payload);
    if (new TextEncoder().encode(text).byteLength > WORK_REMOTE_BACKUP_MAX_BYTES) {
      return Response.json({ enabled: true, saved: false, skipped: "too-large" });
    }

    await put(snapshotPath(clientId, snapshot), text, {
      access: "private",
      allowOverwrite: true,
      contentType: "application/octet-stream",
    });
    await trimRemoteBackups(backupPrefix(clientId, snapshot.kind, snapshot.templateId));

    return Response.json({ enabled: true, saved: true });
  } catch {
    return Response.json({ error: "Could not save backup." }, { status: 500 });
  }
}
