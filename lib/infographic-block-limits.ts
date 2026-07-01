import type { InfographicFormat } from "@/lib/types/infographic";

export const INFOGRAPHIC_BLOCK_LIMITS = {
  kpiItems:              4,
  cardGridCards:         4,
  cardGridTitleChars:    48,
  cardGridBadgeChars:    18,
  cardGridBodyChars: {
    single: 320,
    multi:  170,
  },
  barColumnsItems: 6,
  stepItems: {
    product: 5,
    blog:    12,
  },
  processLoopSteps: {
    product: 5,
    blog:    6,
  },
  processLoopTitleChars: 48,
  processLoopStepChars: 18,
  processLoopLabelChars: 72,
  stackLayers: {
    product: 3,
    blog:    4,
  },
  stackCellsPerLayer:   3,
  nodeListItems:        5,
  hubTitleChars:        18,
  hubSubtitleChars:     64,
  orbitLabelChars:      20,
  orbitNodes:           8,
  orbitSatellites:      8,
  compareRows: {
    product: 6,
    blog:    8,
  },
  compareCardPointChars: {
    product: 160,
    blog:    120,
  },
  lineChartPoints:      8,
  stackedBarSeries:     4,
  stackedBarRows: {
    product: 6,
    blog:    8,
  },
} as const;

export const BAR_COLUMNS_MAX_ITEMS = INFOGRAPHIC_BLOCK_LIMITS.barColumnsItems;
export const STEP_MAX_ITEMS_PRODUCT = INFOGRAPHIC_BLOCK_LIMITS.stepItems.product;

export function cardGridBodyMaxChars(cardCount: number) {
  return cardCount === 1
    ? INFOGRAPHIC_BLOCK_LIMITS.cardGridBodyChars.single
    : INFOGRAPHIC_BLOCK_LIMITS.cardGridBodyChars.multi;
}

export function stepMaxItems(format: InfographicFormat) {
  return INFOGRAPHIC_BLOCK_LIMITS.stepItems[format];
}

export function processLoopMaxSteps(format: InfographicFormat) {
  return INFOGRAPHIC_BLOCK_LIMITS.processLoopSteps[format];
}

export function stackMaxLayers(format: InfographicFormat) {
  return INFOGRAPHIC_BLOCK_LIMITS.stackLayers[format];
}

export function compareMaxRows(format: InfographicFormat) {
  return INFOGRAPHIC_BLOCK_LIMITS.compareRows[format];
}

export function compareCardPointMaxChars(format: InfographicFormat) {
  return INFOGRAPHIC_BLOCK_LIMITS.compareCardPointChars[format];
}

export function stackedBarMaxRows(format: InfographicFormat) {
  return INFOGRAPHIC_BLOCK_LIMITS.stackedBarRows[format];
}
