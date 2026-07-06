import { toBlob, toJpeg, toSvg } from "html-to-image";

const SHARED_OPTIONS = {
  pixelRatio: 2,
  skipFonts: false,
  cacheBust: false, // we pre-inline images ourselves, so no need to bust
};

export type ExportedImage = {
  filename: string;
  href: string | null;
  method: "download" | "save-picker";
  revoke: () => void;
};

type SaveFileWritable = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
  abort?: () => Promise<void>;
};

type SaveFileHandle = {
  createWritable: () => Promise<SaveFileWritable>;
};

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<SaveFileHandle>;
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

async function captureSvgBlob(
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
    const dataUrl = await toSvg(element, options);
    return await (await fetch(dataUrl)).blob();
  } finally {
    restore();
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

async function requestSaveFileHandle(filename: string): Promise<SaveFileHandle | null | "cancelled"> {
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  if (!picker || !window.isSecureContext) return null;

  try {
    return await picker({
      suggestedName: filename,
      types: [
        {
          description: "PNG image",
          accept: { "image/png": [".png"] },
        },
      ],
    });
  } catch (err) {
    if (isAbortError(err)) return "cancelled";

    // If a browser exposes the API but blocks it for policy/user-activation
    // reasons, keep the export usable via the download fallback.
    console.warn("Save picker unavailable; falling back to browser download.", err);
    return null;
  }
}

async function writeBlob(handle: SaveFileHandle, blob: Blob) {
  const writable = await handle.createWritable();
  try {
    await writable.write(blob);
    await writable.close();
  } catch (err) {
    await writable.abort?.();
    throw err;
  }
}

function triggerDownload(blob: Blob, filename: string): ExportedImage {
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
    method: "download",
    revoke: () => URL.revokeObjectURL(objectUrl),
  };
}

export async function exportImage(
  element: HTMLElement,
  width: number,
  height: number | undefined,
  filename: string
): Promise<ExportedImage | null> {
  const saveHandle = await requestSaveFileHandle(filename);
  if (saveHandle === "cancelled") return null;

  const blob = await captureBlob(element, width, height);

  if (saveHandle) {
    try {
      await writeBlob(saveHandle, blob);
      return {
        filename,
        href: null,
        method: "save-picker",
        revoke: () => {},
      };
    } catch (err) {
      // Some contexts allow the picker but block the actual write
      // (embedded browsers, protected folders, platform policy).
      // The image is already captured — recover via plain download.
      console.warn("Save picker write failed; falling back to browser download.", err);
    }
  }

  return triggerDownload(blob, filename);
}

export async function exportSvgImage(
  element: HTMLElement,
  width: number,
  height: number | undefined,
  filename: string,
): Promise<ExportedImage> {
  const blob = await captureSvgBlob(element, width, height);
  return triggerDownload(blob, filename);
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
