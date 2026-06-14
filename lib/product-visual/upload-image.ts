// Client-side screenshot import for Product Visual.
//
// Uploaded screenshots prefer Vercel Blob so saved work keeps only a compact
// URL. When Blob is not available, small images still fall back to data URLs so
// local editing remains usable.

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_UPLOAD_MB = 10;
const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const LOCAL_FALLBACK_MAX_MB = 2;
const LOCAL_FALLBACK_MAX_BYTES = LOCAL_FALLBACK_MAX_MB * 1024 * 1024;

/** Comma-joined list for the <input accept> attribute. */
export const UPLOAD_ACCEPT = ACCEPTED_TYPES.join(",");

export type UploadResult =
  | { ok: true; url: string; naturalWidth: number; naturalHeight: number }
  | { ok: false; error: string };

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

type UploadOptions = {
  fetcher?: FetchLike;
  measureNatural?: (file: File) => Promise<{ w: number; h: number } | null>;
  readAsDataUrl?: (file: File) => Promise<string>;
};

type BlobUploadResponse = {
  enabled: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
};

/** Decode the selected File into an Image to read its natural pixel dimensions. */
async function measureNatural(file: File): Promise<{ w: number; h: number } | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      return { w: img.naturalWidth, h: img.naturalHeight };
    }
    return null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the image."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

async function uploadToBlob(file: File, fetcher: FetchLike): Promise<BlobUploadResponse> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("purpose", "product-visual-screenshot");

  let response: Response;
  try {
    response = await fetcher("/api/upload-asset-image", {
      method: "POST",
      body: formData,
    });
  } catch {
    return { enabled: true, uploaded: false };
  }

  let payload: BlobUploadResponse | null = null;
  try {
    payload = await response.json() as BlobUploadResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      enabled: true,
      uploaded: false,
      error: payload?.error ?? "Could not upload the image — please try again.",
    };
  }

  return payload ?? { enabled: true, uploaded: false };
}

export async function uploadProductVisualScreenshot(
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult> {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Unsupported format — use PNG, JPG, or WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `Image is too large — keep it under ${MAX_UPLOAD_MB} MB.` };
  }

  const dims = await (options.measureNatural ?? measureNatural)(file);
  if (!dims) {
    return { ok: false, error: "Could not read the image — please try again." };
  }

  const blobResult = await uploadToBlob(file, options.fetcher ?? fetch);
  if (blobResult.uploaded && blobResult.url) {
    return { ok: true, url: blobResult.url, naturalWidth: dims.w, naturalHeight: dims.h };
  }

  if (file.size > LOCAL_FALLBACK_MAX_BYTES) {
    if (!blobResult.enabled) {
      return {
        ok: false,
        error: `Cloud image storage is not available — keep screenshots under ${LOCAL_FALLBACK_MAX_MB} MB for local fallback.`,
      };
    }
    return {
      ok: false,
      error: blobResult.error ?? "Could not upload the image — please try again.",
    };
  }

  try {
    const url = await (options.readAsDataUrl ?? readAsDataUrl)(file);
    return { ok: true, url, naturalWidth: dims.w, naturalHeight: dims.h };
  } catch {
    return { ok: false, error: "Could not read the image — please try again." };
  }
}
