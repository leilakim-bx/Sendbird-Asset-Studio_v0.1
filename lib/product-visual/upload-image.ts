// Client-side screenshot import for Product Visual.
//
// Product Visual intentionally keeps screenshots browser-local: the selected
// file is converted to a data URL and saved with the local editor asset. This
// avoids paid external storage, but means file size must stay conservative
// because saved assets live in localStorage.

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_UPLOAD_MB = 2;
const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Comma-joined list for the <input accept> attribute. */
export const UPLOAD_ACCEPT = ACCEPTED_TYPES.join(",");

export type UploadResult =
  | { ok: true; url: string; naturalWidth: number; naturalHeight: number }
  | { ok: false; error: string };

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

export async function uploadProductVisualScreenshot(file: File): Promise<UploadResult> {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Unsupported format — use PNG, JPG, or WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `Image is too large — keep it under ${MAX_UPLOAD_MB} MB.` };
  }

  const dims = await measureNatural(file);
  if (!dims) {
    return { ok: false, error: "Could not read the image — please try again." };
  }

  try {
    const url = await readAsDataUrl(file);
    return { ok: true, url, naturalWidth: dims.w, naturalHeight: dims.h };
  } catch {
    return { ok: false, error: "Could not read the image — please try again." };
  }
}
