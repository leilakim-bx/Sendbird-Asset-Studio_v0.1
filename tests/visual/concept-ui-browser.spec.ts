import { expect, test } from "@playwright/test";

type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type OverflowOffender = {
  tag: string;
  text: string;
  rect: Bounds;
};

const forbiddenText = ["NaN", "Infinity", "undefined", "Lorem ipsum", "AI pre-filled"];

function slug(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

test.describe("Concept UI browser render QA", () => {
  test("captures every sample and max-length fixture without blank or overflowing scenes", async ({ page }, testInfo) => {
    await page.goto("/dev/concept-ui/render");
    await expect(page.getByRole("heading", { name: "Concept UI render grid" })).toBeVisible();

    const cards = page.locator("[data-concept-render-card]");
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(20);

    for (let index = 0; index < cardCount; index += 1) {
      const card = cards.nth(index);
      const rawId = (await card.getAttribute("data-concept-render-card")) ?? `scene-${index}`;
      const cardId = slug(rawId);

      await test.step(cardId, async () => {
        const preview = card.locator("[data-concept-render-preview='true']");
        await expect(preview).toBeVisible();
        await expect(preview.locator("[data-concept-ui-canvas='true']")).toBeVisible();
        await expect(preview.locator("[data-concept-primary-panel='true']")).toBeVisible();

        const screenshot = await preview.screenshot({ path: testInfo.outputPath(`${cardId}.png`) });
        expect(screenshot.length).toBeGreaterThan(12_000);

        const result = await preview.evaluate((previewElement, forbidden) => {
          const canvas = previewElement.querySelector<HTMLElement>("[data-concept-ui-canvas='true']");
          const primaryPanel = previewElement.querySelector<HTMLElement>("[data-concept-primary-panel='true']");

          if (!canvas || !primaryPanel) {
            return {
              missing: true,
              text: previewElement.textContent ?? "",
              brokenImages: [],
              overflow: [],
              primaryPanel: null,
              forbiddenHits: [],
            };
          }

          const toBounds = (rect: DOMRect): Bounds => ({
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });

          const canvasRect = canvas.getBoundingClientRect();
          const text = canvas.textContent ?? "";
          const forbiddenHits = forbidden.filter((item) => text.includes(item));
          const overflow: OverflowOffender[] = [];
          const layoutTolerance = 8;
          const floatingTolerance = 3;

          for (const element of Array.from(canvas.querySelectorAll<HTMLElement>("*"))) {
            const style = window.getComputedStyle(element);
            if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;

            const rect = element.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) continue;

            const tolerance = element.closest("[data-concept-ai-popover='true']") ? floatingTolerance : layoutTolerance;
            const outsideCanvas =
              rect.left < canvasRect.left - tolerance ||
              rect.top < canvasRect.top - tolerance ||
              rect.right > canvasRect.right + tolerance ||
              rect.bottom > canvasRect.bottom + tolerance;

            if (outsideCanvas) {
              overflow.push({
                tag: element.tagName.toLowerCase(),
                text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
                rect: toBounds(rect),
              });
            }

            if (overflow.length >= 8) break;
          }

          const brokenImages = Array.from(canvas.querySelectorAll<HTMLImageElement>("img"))
            .filter((image) => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0)
            .map((image) => image.currentSrc || image.src);

          const primaryRect = primaryPanel.getBoundingClientRect();

          return {
            missing: false,
            text,
            brokenImages,
            overflow,
            primaryPanel: toBounds(primaryRect),
            forbiddenHits,
          };
        }, forbiddenText);

        expect(result.missing).toBe(false);
        expect(result.forbiddenHits).toEqual([]);
        expect(result.brokenImages).toEqual([]);
        expect(result.overflow).toEqual([]);
        expect(result.primaryPanel?.width).toBeGreaterThan(80);
        expect(result.primaryPanel?.height).toBeGreaterThan(80);
      });
    }
  });
});
