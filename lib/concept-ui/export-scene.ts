"use client";

import {
  CONCEPT_UI_CANVAS_HEIGHT,
  CONCEPT_UI_CANVAS_WIDTH,
  conceptSceneTokens,
} from "@/lib/concept-ui/scene-tokens";
import type { ProductVisualScreenshot } from "@/lib/types/product-visual";

export type FramingPreset = "full-screen" | "hero-crop" | "floating-panel";

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

function heroCropSvgDataUrl(element: HTMLElement): string {
  const serialized = serializeHtmlElement(element, CONCEPT_UI_CANVAS_WIDTH, CONCEPT_UI_CANVAS_HEIGHT);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CONCEPT_UI_CANVAS_WIDTH}" height="${CONCEPT_UI_CANVAS_HEIGHT}" viewBox="0 0 ${CONCEPT_UI_CANVAS_WIDTH} ${CONCEPT_UI_CANVAS_HEIGHT}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${CONCEPT_UI_CANVAS_WIDTH}px;height:${CONCEPT_UI_CANVAS_HEIGHT}px;overflow:hidden;background:${conceptSceneTokens.color.page};">
          <div style="width:${CONCEPT_UI_CANVAS_WIDTH}px;height:${CONCEPT_UI_CANVAS_HEIGHT}px;transform:scale(2);transform-origin:top left;">
            ${serialized}
          </div>
        </div>
      </foreignObject>
    </svg>
  `;
  return svgDataUrl(svg);
}

export async function exportConceptSceneElement(
  element: HTMLElement,
  preset: FramingPreset = "full-screen",
): Promise<ExportedConceptScene> {
  if (preset === "floating-panel") {
    const primaryPanel = element.querySelector<HTMLElement>("[data-concept-primary-panel='true']");
    if (!primaryPanel) throw new Error("Could not find the primary Concept UI panel.");
    const width = primaryPanel.offsetWidth || primaryPanel.getBoundingClientRect().width;
    const height = primaryPanel.offsetHeight || primaryPanel.getBoundingClientRect().height;
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

  const url = preset === "hero-crop"
    ? heroCropSvgDataUrl(element)
    : elementToSvgDataUrl(element, {
      width: CONCEPT_UI_CANVAS_WIDTH,
      height: CONCEPT_UI_CANVAS_HEIGHT,
    });
  const full = {
    url,
    naturalWidth: CONCEPT_UI_CANVAS_WIDTH,
    naturalHeight: CONCEPT_UI_CANVAS_HEIGHT,
  };
  return full;
}

export function conceptSceneToProductScreenshot(scene: ExportedConceptScene): ProductVisualScreenshot {
  return {
    url: scene.url,
    displayMode: "crop",
    naturalWidth: scene.naturalWidth,
    naturalHeight: scene.naturalHeight,
  };
}
