import { toBlob, toJpeg, toSvg } from "html-to-image";

const SHARED_OPTIONS = {
  pixelRatio: 2,
  skipFonts: false,
  cacheBust: false, // we pre-inline images ourselves, so no need to bust
};

export type ExportedImage = {
  filename: string;
  href: string;
  revoke: () => void;
};

/**
 * Fetch every <img> in the element and swap its src to a data-URI in-place,
 * then return a restore function that puts the original srcs back.
 *
 * This ensures the captured pixels are byte-for-byte identical to what the
 * browser already rendered — no re-fetching, no proxy round-trips, no CORS.
 */
async function inlineImages(element: HTMLElement): Promise<() => void> {
  const imgs = Array.from(element.querySelectorAll<HTMLImageElement>("img"));
  const restores: Array<() => void> = [];

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src; // browser resolves to absolute URL
      if (!src || src.startsWith("data:")) return;
      try {
        const res = await fetch(src, { credentials: "same-origin" });
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
        restores.push(() => { img.src = src; });
      } catch {
        // keep original src — export may look wrong but won't crash
      }
    })
  );

  return () => restores.forEach((fn) => fn());
}

async function captureBlob(
  element: HTMLElement,
  width: number,
  height?: number,
): Promise<Blob> {
  const options = {
    ...SHARED_OPTIONS,
    width,
    ...(height !== undefined ? { height } : {}),
    style: { borderRadius: "0" },
  };
  const restore = await inlineImages(element);
  try {
    const blob = await toBlob(element, options);
    if (!blob) {
      throw new Error("Unable to create export image");
    }
    return blob;
  } finally {
    restore();
  }
}

export async function exportImage(
  element: HTMLElement,
  width: number,
  height: number | undefined,
  filename: string
): Promise<ExportedImage> {
  const blob = await captureBlob(element, width, height);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = objectUrl;
  link.rel = "noopener";
  link.target = "_blank";
  link.style.display = "none";
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
  }
  return {
    filename,
    href: objectUrl,
    revoke: () => URL.revokeObjectURL(objectUrl),
  };
}

/**
 * Capture an SVG of the element and copy it as plain text to the clipboard.
 * Figma recognises SVG text pasted via Cmd+V and imports it as a vector layer.
 */
export async function exportSvgToClipboard(
  element: HTMLElement,
  width: number,
  height?: number,
): Promise<void> {
  const options = {
    ...SHARED_OPTIONS,
    width,
    ...(height !== undefined ? { height } : {}),
    style: { borderRadius: "0" },
  };
  const restore = await inlineImages(element);
  try {
    // Warm cache first (same pattern as PNG export)
    try { await toSvg(element, options); } catch { /* ignore */ }
    const svgString = await toSvg(element, options);

    // navigator.clipboard.writeText() loses the user-gesture context after
    // the async toSvg() call and throws NotAllowedError in most browsers.
    // execCommand('copy') via a hidden textarea works without that constraint.
    const textarea = document.createElement("textarea");
    textarea.value = svgString;
    textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  } finally {
    restore();
  }
}

/**
 * Capture a small JPEG thumbnail of the element for library preview.
 * Targets ~325 × 247 px at quality 0.75 — typically 20–50 KB as a data URL.
 */
export async function captureThumbnail(element: HTMLElement): Promise<string> {
  const restore = await inlineImages(element);
  try {
    return await toJpeg(element, {
      pixelRatio: 0.375,   // 866 * 0.375 ≈ 325 px wide
      quality:    0.75,
      cacheBust:  false,
      skipFonts:  false,
    });
  } finally {
    restore();
  }
}
