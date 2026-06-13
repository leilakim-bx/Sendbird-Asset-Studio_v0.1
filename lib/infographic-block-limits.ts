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
  barColumnsItems: 15,
  stepItems: {
    product: 8,
    blog:    12,
  },
  stackLayers:          4,
  stackCellsPerLayer:   3,
  nodeListItems:        5,
  hubTitleChars:        18,
  orbitLabelChars:      20,
  orbitNodes:           8,
  orbitSatellites:      8,
  compareRows: {
    product: 6,
    blog:    8,
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

export function compareMaxRows(format: InfographicFormat) {
  return INFOGRAPHIC_BLOCK_LIMITS.compareRows[format];
}

export function stackedBarMaxRows(format: InfographicFormat) {
  return INFOGRAPHIC_BLOCK_LIMITS.stackedBarRows[format];
}
