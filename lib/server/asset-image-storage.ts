import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

export const ASSET_IMAGE_MAX_UPLOAD_MB = 10;
export const ASSET_IMAGE_MAX_BYTES = ASSET_IMAGE_MAX_UPLOAD_MB * 1024 * 1024;

export const ASSET_IMAGE_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AssetImageMimeType = (typeof ASSET_IMAGE_ALLOWED_TYPES)[number];

export type AssetImagePurpose =
  | "product-visual-screenshot"
  | "custom-background";

const EXT_BY_TYPE: Record<AssetImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function hasAssetImageBlobCredentials() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID),
  );
}

export function isAllowedAssetImageType(type: string): type is AssetImageMimeType {
  return (ASSET_IMAGE_ALLOWED_TYPES as readonly string[]).includes(type);
}

export function validateAssetImageFile(file: File) {
  if (!isAllowedAssetImageType(file.type)) {
    return "Unsupported format — use PNG, JPG, or WebP.";
  }
  if (file.size > ASSET_IMAGE_MAX_BYTES) {
    return `Image is too large — keep it under ${ASSET_IMAGE_MAX_UPLOAD_MB} MB.`;
  }
  return null;
}

function datePath(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function assetImagePath(purpose: AssetImagePurpose, type: AssetImageMimeType, id = randomUUID()) {
  return `asset-images/${purpose}/${datePath()}/${id}.${EXT_BY_TYPE[type]}`;
}

export async function uploadAssetImageToBlob(file: File, purpose: AssetImagePurpose) {
  const validationError = validateAssetImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  return await put(assetImagePath(purpose, file.type as AssetImageMimeType), file, {
    access: "public",
    allowOverwrite: false,
    contentType: file.type,
  });
}
