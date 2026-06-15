import { brand } from "@/lib/tokens/brand";

export const CONCEPT_UI_CANVAS_WIDTH = 1600;
export const CONCEPT_UI_CANVAS_HEIGHT = 1000;

export const conceptSceneTokens = {
  color: {
    page: brand.color.concept.page,
    app: brand.color.concept.app,
    surface: brand.color.concept.surface,
    surfaceStrong: brand.color.concept.surfaceStrong,
    border: brand.color.concept.border,
    borderStrong: brand.color.concept.borderStrong,
    text: brand.color.concept.text,
    muted: brand.color.concept.muted,
    faint: brand.color.concept.faint,
    inverse: brand.color.concept.inverse,
    ink: brand.color.concept.ink,
    ai: brand.color.concept.ai,
    aiSoft: brand.color.concept.aiSoft,
    goodSoft: brand.color.concept.goodSoft,
    goodText: brand.color.concept.goodText,
    warnSoft: brand.color.concept.warnSoft,
    warnText: brand.color.concept.warnText,
    info: brand.color.concept.info,
    success: brand.color.concept.success,
    warning: brand.color.concept.warning,
    error: brand.color.concept.error,
  },
  font: {
    sans: brand.font.sans,
  },
  radius: {
    none: brand.spacing[0],
    sm: brand.radius[10],
    md: brand.radius[16],
    lg: brand.radius[24],
    xl: brand.radius[32],
  },
  control: {
    pill: {
      minHeight: brand.spacing[26],
      compactMinHeight: brand.spacing[22],
      denseMinHeight: brand.spacing[24],
      largeMinHeight: brand.spacing[40],
      menuMinHeight: brand.spacing[36],
      paddingY: brand.spacing[3],
      paddingX: brand.spacing[12],
      radius: brand.radius[9],
      fontSize: brand.typography.size[13],
      compactFontSize: brand.typography.size[11],
      largeFontSize: brand.typography.size[15],
      lineHeight: brand.typography.lineHeight.compact,
    },
    toolbarButton: {
      height: brand.spacing[36],
      minWidth: brand.spacing[36],
      radius: brand.radius[11],
      paddingX: brand.spacing[10],
      widePaddingX: brand.spacing[13],
      fontSize: brand.typography.size[15],
    },
    actionButton: {
      minHeight: brand.spacing[40],
      paddingX: brand.spacing[22],
      radius: brand.radius[14],
    },
  },
  borderWidth: {
    none: brand.spacing[0],
  },
  shadow: {
    none: "none",
    card: brand.elevation.conceptCard,
    float: brand.elevation.conceptFloat,
    active: brand.elevation.conceptActive,
    highlighted: brand.elevation.conceptActiveSmall,
    cursor: brand.elevation.conceptDrop,
    modal: brand.elevation.conceptModal,
  },
  overlay: {
    modal: brand.color.concept.modalOverlay,
  },
  background: {
    gridDot: `radial-gradient(${brand.color.concept.gridDot} 1px, transparent 1px)`,
  },
} as const;

export const avatarPalette = brand.avatarPalette;
