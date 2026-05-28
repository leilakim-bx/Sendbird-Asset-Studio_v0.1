import { toPng } from "html-to-image";

const SHARED_OPTIONS = {
  pixelRatio: 2,
  skipFonts: false,
  cacheBust: true,
};

async function captureWithRetry(
  element: HTMLElement,
  width: number,
  height: number,
): Promise<string> {
  const options = { ...SHARED_OPTIONS, width, height, style: { borderRadius: "0" } };
  // First pass: warms html-to-image's internal image cache
  try { await toPng(element, options); } catch { /* ignore first-pass errors */ }
  // Second pass: actual capture with images now cached
  return toPng(element, options);
}

export async function exportImage(
  element: HTMLElement,
  width: number,
  height: number,
  filename: string
): Promise<void> {
  const dataUrl = await captureWithRetry(element, width, height);
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportBoth(
  desktopEl: HTMLElement,
  mobileEl: HTMLElement,
  baseName = "sendbird-asset"
): Promise<void> {
  await exportImage(desktopEl, 864, 640, `${baseName}-desktop.png`);
  await new Promise((r) => setTimeout(r, 400));
  await exportImage(mobileEl, 430, 540, `${baseName}-mobile.png`);
}
