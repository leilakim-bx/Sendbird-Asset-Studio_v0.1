export type ProductUiFormat = "homepage-wide" | "square";

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
  success: { bg: "#DDF8E9", fg: "#0D8A50", border: "#BAEBCF" },
  warning: { bg: "#FFF1D9", fg: "#B15C00", border: "#F7D8A8" },
  danger: { bg: "#FFE1E6", fg: "#BB203B", border: "#F6C0CB" },
  neutral: { bg: "#F3F0EC", fg: "#66625E", border: "#E3DDD6" },
  accent: { bg: "#F2FF66", fg: "#1C1917", border: "#E0EA58" },
  live: { bg: "#111111", fg: "#FFFFFF", border: "#111111" },
};

