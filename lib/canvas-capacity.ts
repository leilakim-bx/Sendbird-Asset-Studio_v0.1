/**
 * Canvas capacity utilities.
 *
 * Uses scrollHeight (not getBoundingClientRect) so parent CSS transforms
 * (e.g. the preview scale in EditorShell) do NOT affect the measurement.
 */

export const CANVAS_MIN_MARGIN_PX = 48;

export function computeCapacity(
  frameScrollHeight: number,
  canvasHeight: number,
): { remainingPx: number; isFull: boolean } {
  const remainingPx = canvasHeight - frameScrollHeight;
  return { remainingPx, isFull: remainingPx < CANVAS_MIN_MARGIN_PX };
}
