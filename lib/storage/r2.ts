import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env, type R2Config } from "@/lib/env";

// ── 상수 ──────────────────────────────────────────────────

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

// ── S3 Client ─────────────────────────────────────────────

function makeClient(r2: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
    },
  });
}

// ── 파일명 ────────────────────────────────────────────────

/** {folder}/{uuid}.{ext} */
function makeKey(mimeType: string, folder: string): string {
  return `${folder}/${crypto.randomUUID()}.${EXT_MAP[mimeType]}`;
}

// ── Upload ────────────────────────────────────────────────

export type UploadResult = {
  key:       string;  // "{folder}/uuid.jpg"
  publicUrl: string;  // "https://pub-xxx.r2.dev/{folder}/uuid.jpg"
};

export async function uploadToR2(
  file: File,
  originalName: string,
  folder = "backgrounds",
): Promise<UploadResult> {
  // ① 파일 형식 검증
  if (!EXT_MAP[file.type]) {
    throw new Error(
      `지원하지 않는 파일 형식: ${file.type}. 지원: jpg, png, webp, gif`,
    );
  }

  // ② 파일 크기 검증
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error("파일이 너무 큽니다. 최대 10MB.");
  }

  const r2 = env.r2;
  if (!r2) throw new Error("R2 미설정 — 개발 환경에서는 filesystem 사용");

  const key    = makeKey(file.type, folder);
  const buffer = Buffer.from(await file.arrayBuffer());

  await makeClient(r2).send(
    new PutObjectCommand({
      Bucket:       r2.bucketName,
      Key:          key,
      Body:         buffer,
      ContentType:  file.type,
      // ③ UUID 파일명이므로 immutable 캐싱 안전
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: {
        "original-name": encodeURIComponent(originalName),
      },
    }),
  );

  return { key, publicUrl: `${r2.publicUrl}/${key}` };
}

// ── Delete ────────────────────────────────────────────────

export async function deleteFromR2(key: string): Promise<void> {
  const r2 = env.r2;
  if (!r2) throw new Error("R2 미설정");

  await makeClient(r2).send(
    new DeleteObjectCommand({ Bucket: r2.bucketName, Key: key }),
  );
}
