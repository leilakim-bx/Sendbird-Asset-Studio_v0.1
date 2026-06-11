// Client-side screenshot upload for Product Visual.
//
// The screenshot is uploaded to the app backend first, then stored in editor
// state as a URL. That keeps saved Product Visual assets re-openable without
// putting a multi-MB base64 image into localStorage.

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

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

export async function uploadProductVisualScreenshot(file: File): Promise<UploadResult> {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Unsupported format — use PNG, JPG, or WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image is too large — keep it under 10 MB." };
  }

  const dims = await measureNatural(file);
  if (!dims) {
    return { ok: false, error: "Could not read the image — please try again." };
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload-product-visual-screenshot", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      return { ok: false, error: data.error || "Could not upload the image — please try again." };
    }

    return { ok: true, url: data.url, naturalWidth: dims.w, naturalHeight: dims.h };
  } catch {
    return { ok: false, error: "Could not upload the image — please try again." };
  }
}
