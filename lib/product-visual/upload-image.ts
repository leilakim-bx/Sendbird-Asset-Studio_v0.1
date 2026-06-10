// Client-side screenshot upload for Product Visual (STEP 2).
//
// No server / R2 yet (Phase: post-beta) — the file is read into a base64 data
// URL and held in transient store state. Validates type + size and returns a
// discriminated result so callers can show an inline error without try/catch.

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Comma-joined list for the <input accept> attribute. */
export const UPLOAD_ACCEPT = ACCEPTED_TYPES.join(",");

export type UploadResult =
  | { ok: true; dataUrl: string; naturalWidth: number; naturalHeight: number }
  | { ok: false; error: string };

/** Decode a data URL into an Image to read its natural pixel dimensions. */
async function measureNatural(dataUrl: string): Promise<{ w: number; h: number } | null> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      return { w: img.naturalWidth, h: img.naturalHeight };
    }
    return null;
  } catch {
    return null;
  }
}

/** Read an image File into a base64 data URL (+ natural dimensions) after
 *  validating type + size. */
export async function readImageAsDataUrl(file: File): Promise<UploadResult> {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Unsupported format — use PNG, JPG, or WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image is too large — keep it under 10 MB." };
  }

  const dataUrl = await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" && result.startsWith("data:image/") ? result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  if (!dataUrl) {
    return { ok: false, error: "Could not read the image — please try again." };
  }

  const dims = await measureNatural(dataUrl);
  if (!dims) {
    return { ok: false, error: "Could not read the image — please try again." };
  }

  return { ok: true, dataUrl, naturalWidth: dims.w, naturalHeight: dims.h };
}
