import { type NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { env } from "@/lib/env";
import { uploadToR2, MAX_UPLOAD_SIZE } from "@/lib/storage/r2";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
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

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: "Only PNG, JPG, and WebP screenshots are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return Response.json(
      { error: "Image is too large — keep it under 10 MB." },
      { status: 400 },
    );
  }

  if (env.r2) {
    try {
      const { key, publicUrl } = await uploadToR2(file, file.name, "product-visual");
      return Response.json({ id: key, url: publicUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      return Response.json({ error: message }, { status: 500 });
    }
  }

  const uploadDir = join(process.cwd(), "public", "product-visual");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const ext = EXT_MAP[file.type];
  const id = `screenshot-${Date.now()}`;
  const filename = `${id}.${ext}`;
  const filepath = join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filepath, buffer);

  return Response.json({ id, url: `/product-visual/${filename}` });
}
