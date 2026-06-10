export type ProductUiFormat = "feature" | "release" | "blog";
export type ProductUiExportTarget = "feature-desktop" | "feature-mobile" | "release" | "blog";
export type ProductUiReleasePurpose = "thumbnail" | "insert";

export type ProductUiScene =
  | "ai-response"
  | "review-queue"
  | "test-results"
  | "traffic-allocation"
  | "workflow"
  | "version-history"
  | "steward-detail"
  | "ab-test";

export type ProductUiComposition = "photo-card" | "plain-stage" | "wide-system";

export type ProductUiStatus = "success" | "warning" | "danger" | "neutral" | "accent" | "live";

export type ProductUiItem = {
  id: string;
  label: string;
  detail?: string;
  status?: ProductUiStatus;
  value?: string;
};

export type ProductUiNode = {
  id: string;
  title: string;
  detail?: string;
  status?: ProductUiStatus;
  value?: string;
};

export type ProductUiContent = {
  format: ProductUiFormat;
  releasePurpose?: ProductUiReleasePurpose;
  scene: ProductUiScene;
  composition: ProductUiComposition;
  backgroundId: string;
  title: string;
  eyebrow?: string;
  primaryText?: string;
  secondaryText?: string;
  metricA?: string;
  metricB?: string;
  items: ProductUiItem[];
  nodes: ProductUiNode[];
};

export const PRODUCT_UI_SCENE_LABELS: Record<ProductUiScene, string> = {
  "ai-response": "AI response",
  "review-queue": "Review queue",
  "test-results": "Test results",
  "traffic-allocation": "Traffic allocation",
  workflow: "Workflow",
  "version-history": "Version history",
  "steward-detail": "Steward detail",
  "ab-test": "A/B test",
};

export const PRODUCT_UI_STATUS_LABELS: Record<ProductUiStatus, string> = {
  success: "On policy",
  warning: "Review",
  danger: "Flagged",
  neutral: "Queued",
  accent: "Approved",
  live: "Live",
};

export const PRODUCT_UI_STATUS_STYLES: Record<ProductUiStatus, { bg: string; fg: string; border: string }> = {
  success: { bg: "#D0F3E6", fg: "#25BD85", border: "#D9D6D2" },
  warning: { bg: "#F2FF66", fg: "#292016", border: "#D9E64D" },
  danger: { bg: "#FFE3E5", fg: "#FF5E69", border: "#FF5E69" },
  neutral: { bg: "#F7F5F0", fg: "#66625E", border: "#E5E3DF" },
  accent: { bg: "#F2FF66", fg: "#292016", border: "#D9E64D" },
  live: { bg: "#18140F", fg: "#FFFFFF", border: "#18140F" },
};
