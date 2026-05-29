import { type NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { env } from "@/lib/env";
import { uploadToR2, MAX_UPLOAD_SIZE } from "@/lib/storage/r2";

/**
 * POST /api/upload-background
 *
 * R2가 설정된 경우: Cloudflare R2에 업로드 (backgrounds/{uuid}.{ext})
 * R2 미설정 (개발): /public/background/에 로컬 저장 (filesystem fallback)
 *
 * 반환: { id, label, url }
 */

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

  // ── 공통 검증 (R2/filesystem 공통) ───────────────────────
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

  // ── R2 업로드 (설정된 경우) ───────────────────────────────
  if (env.r2) {
    try {
      const { key, publicUrl } = await uploadToR2(file, file.name);
      // id는 key 전체를 사용 ("backgrounds/uuid.jpg") — 나중에 deleteFromR2에 재사용
      return Response.json({ id: key, label, url: publicUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      return Response.json({ error: message }, { status: 500 });
    }
  }

  // ── Filesystem fallback (개발 환경 전용) ──────────────────
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
