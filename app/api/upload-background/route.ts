import { type NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import {
  ASSET_IMAGE_MAX_BYTES,
  ASSET_IMAGE_MAX_UPLOAD_MB,
  hasAssetImageBlobCredentials,
  isAllowedAssetImageType,
  uploadAssetImageToBlob,
} from "@/lib/server/asset-image-storage";

/**
 * POST /api/upload-background
 *
 * Stores uploaded background images in Vercel Blob when available, with a
 * local filesystem fallback for development.
 *
 * 반환: { id, label, url }
 */

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

function deriveLabel(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || "Custom";
}

export async function POST(request: NextRequest) {
  // ── 폼 파싱 ──────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  // ── Validation ───────────────────────────────────────────
  if (!isAllowedAssetImageType(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, and WebP images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > ASSET_IMAGE_MAX_BYTES) {
    return Response.json(
      { error: `Image is too large — keep it under ${ASSET_IMAGE_MAX_UPLOAD_MB} MB.` },
      { status: 400 },
    );
  }

  const label = deriveLabel(file.name);

  if (hasAssetImageBlobCredentials()) {
    try {
      const blob = await uploadAssetImageToBlob(file, "custom-background");
      const id = `custom-${Date.now()}`;
      return Response.json({ id, label, url: blob.url, storage: "blob" });
    } catch {
      return Response.json({ error: "Could not upload background image" }, { status: 500 });
    }
  }

  // ── Local filesystem storage ─────────────────────────────
  const UPLOAD_DIR = join(process.cwd(), "public", "background");

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const ext      = EXT_MAP[file.type];
  const id       = `custom-${Date.now()}`;
  const filename = `${id}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);
  const buffer   = Buffer.from(await file.arrayBuffer());

  await writeFile(filepath, buffer);

  return Response.json({ id, label, url: `/background/${filename}`, storage: "local" });
}
