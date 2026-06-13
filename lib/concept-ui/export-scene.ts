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

function serializeHtmlElement(element: HTMLElement, width: number, height: number): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  return new XMLSerializer().serializeToString(clone);
}

function elementToSvgDataUrl(
  element: HTMLElement,
  options: {
    width: number;
    height: number;
  },
): string {
  const serialized = serializeHtmlElement(element, options.width, options.height);
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
  if (preset === "floating-panel") {
    const primaryPanel = element.querySelector<HTMLElement>("[data-concept-primary-panel='true']");
    if (!primaryPanel) throw new Error("Could not find the primary Concept UI panel.");
    const { width, height } = measureRenderedBounds(primaryPanel);
    const url = elementToSvgDataUrl(primaryPanel, {
      width,
      height,
    });
    return {
      url,
      naturalWidth: Math.round(width),
      naturalHeight: Math.round(height),
    };
  }

  const url = elementToSvgDataUrl(element, {
    width: CONCEPT_UI_CANVAS_WIDTH,
    height: CONCEPT_UI_CANVAS_HEIGHT,
  });
  return {
    url,
    naturalWidth: CONCEPT_UI_CANVAS_WIDTH,
    naturalHeight: CONCEPT_UI_CANVAS_HEIGHT,
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
