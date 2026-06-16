"use client";

import {
  CONCEPT_UI_CANVAS_HEIGHT,
  CONCEPT_UI_CANVAS_WIDTH,
} from "@/lib/concept-ui/scene-tokens";
import type { ProductVisualScreenshot } from "@/lib/types/product-visual";

export type FramingPreset = "hero-crop" | "floating-panel";

export type ExportedConceptScene = {
  url: string;
  naturalWidth: number;
  naturalHeight: number;
};

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Could not read image blob.")));
    reader.readAsDataURL(blob);
  });
}

async function inlineImageElements(clone: HTMLElement, source: HTMLElement): Promise<void> {
  const cloneImages = Array.from(clone.querySelectorAll<HTMLImageElement>("img[src]"));
  const sourceImages = Array.from(source.querySelectorAll<HTMLImageElement>("img[src]"));

  await Promise.all(
    cloneImages.map(async (cloneImage, index) => {
      const sourceImage = sourceImages[index];
      const rawSrc = sourceImage?.currentSrc || cloneImage.getAttribute("src");
      if (!rawSrc || rawSrc.startsWith("data:")) return;

      try {
        const url = new URL(rawSrc, window.location.href);
        const response = await fetch(url.href, { cache: "force-cache" });
        if (!response.ok) return;
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) return;
        cloneImage.setAttribute("src", await blobToDataUrl(blob));
      } catch {
        // Keep the original src if the browser cannot inline this image.
      }
    }),
  );
}

async function serializeHtmlElement(element: HTMLElement, width: number, height: number): Promise<string> {
  const clone = element.cloneNode(true) as HTMLElement;
  await inlineImageElements(clone, element);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  return new XMLSerializer().serializeToString(clone);
}

async function elementToSvgDataUrl(
  element: HTMLElement,
  options: {
    width: number;
    height: number;
  },
): Promise<string> {
  const serialized = await serializeHtmlElement(element, options.width, options.height);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}">
      <foreignObject width="100%" height="100%">
        ${serialized}
      </foreignObject>
    </svg>
  `;
  return svgDataUrl(svg);
}

function measureRenderedBounds(element: HTMLElement): { width: number; height: number } {
  const base = element.getBoundingClientRect();
  let width = Math.max(element.offsetWidth, element.scrollWidth, base.width);
  let height = Math.max(element.offsetHeight, element.scrollHeight, base.height);

  if (element.dataset.conceptCropBounds === "true") {
    return {
      width: Math.min(CONCEPT_UI_CANVAS_WIDTH, Math.ceil(Math.max(element.offsetWidth, base.width))),
      height: Math.min(CONCEPT_UI_CANVAS_HEIGHT, Math.ceil(Math.max(element.offsetHeight, base.height))),
    };
  }

  element.querySelectorAll<HTMLElement>("*").forEach((child) => {
    const rect = child.getBoundingClientRect();
    width = Math.max(width, rect.right - base.left);
    height = Math.max(height, rect.bottom - base.top);
  });

  return {
    width: Math.min(CONCEPT_UI_CANVAS_WIDTH, Math.ceil(width)),
    height: Math.min(CONCEPT_UI_CANVAS_HEIGHT, Math.ceil(height)),
  };
}

export async function exportConceptSceneElement(
  element: HTMLElement,
  preset: FramingPreset = "floating-panel",
): Promise<ExportedConceptScene> {
  void preset;
  const primaryPanel = element.querySelector<HTMLElement>("[data-concept-primary-panel='true']");
  if (!primaryPanel) throw new Error("Could not find the primary Concept UI panel.");
  const { width, height } = measureRenderedBounds(primaryPanel);
  const url = await elementToSvgDataUrl(primaryPanel, {
    width,
    height,
  });
  return {
    url,
    naturalWidth: Math.round(width),
    naturalHeight: Math.round(height),
  };
}

export function conceptSceneToProductScreenshot(scene: ExportedConceptScene): ProductVisualScreenshot {
  return {
    url: scene.url,
    displayMode: "crop",
    naturalWidth: scene.naturalWidth,
    naturalHeight: scene.naturalHeight,
  };
}
