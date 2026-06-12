import { type NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

/**
 * POST /api/upload-background
 *
 * Stores uploaded background images in /public/background.
 * External object storage is intentionally disabled by security policy.
 *
 * 반환: { id, label, url }
 */

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
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
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return Response.json(
      { error: "파일이 너무 큽니다. 최대 10MB." },
      { status: 400 },
    );
  }

  const label = deriveLabel(file.name);

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

  return Response.json({ id, label, url: `/background/${filename}` });
}
