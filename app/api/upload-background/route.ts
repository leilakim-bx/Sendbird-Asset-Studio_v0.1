import { type NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * POST /api/upload-background
 *
 * Accepts multipart/form-data with a single "file" field (image/*).
 * Saves the file permanently to /public/background/custom-<timestamp>.<ext>
 * and returns { id, label, url } for the client to store in Zustand.
 *
 * Limits: 5 MB max, JPEG / PNG / WebP / GIF only.
 */

const UPLOAD_DIR = join(process.cwd(), "public", "background");
const MAX_BYTES   = 5 * 1024 * 1024;
const ALLOWED     = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

export async function POST(request: NextRequest) {
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

  if (!ALLOWED.has(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "File size must be under 5 MB" },
      { status: 400 },
    );
  }

  // Ensure upload directory exists (it should, but be safe)
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const ext = EXT_MAP[file.type];
  const id  = `custom-${Date.now()}`;
  const filename = `${id}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  // Derive a readable label from the original filename
  const label = file.name
    .replace(/\.[^.]+$/, "")           // strip extension
    .replace(/[-_]+/g, " ")             // dashes/underscores → spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // Title Case
    .trim() || "Custom";

  return Response.json({ id, label, url: `/background/${filename}` });
}
