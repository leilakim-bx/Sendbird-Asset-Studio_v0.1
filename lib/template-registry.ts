import type { ChatMessage } from "./store";

/** Wrap an external image URL through our same-origin proxy */
function p(url: string) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

// ── Types ─────────────────────────────────────────────────

export type ExportSize = {
  id: "desktop" | "mobile";
  label: string;
  width: number;
  height: number;
};

export type TemplateLayout = "center" | "split";

export type Template = {
  id: string;
  name: string;
  description: string;
  layouts: TemplateLayout[];
  exportSizes: ExportSize[];
  defaultLayout: TemplateLayout;
  defaultContent: {
    appName: string;
    backgroundId: string;
    messages: ChatMessage[];
  };
};

// ── Export Sizes ──────────────────────────────────────────

export const EXPORT_SIZES: Record<"desktop" | "mobile", ExportSize> = {
  desktop: { id: "desktop", label: "Desktop", width: 864, height: 640 },
  mobile:  { id: "mobile",  label: "Mobile",  width: 430, height: 540 },
};

// ── Templates ─────────────────────────────────────────────

export const TEMPLATES: Template[] = [
  {
    id: "feature-mockup",
    name: "Feature Mockup",
    description: "Glassmorphism chat UI over a lifestyle background",
    layouts: ["center", "split"],
    exportSizes: [EXPORT_SIZES.desktop, EXPORT_SIZES.mobile],
    defaultLayout: "split",
    defaultContent: {
      appName: "sendbird.ai",
      backgroundId: "bg-1",
      messages: [
        {
          id: "m1",
          type: "text",
          role: "user",
          sender: "Taylor",
          text: "I need something for a summer wedding",
          avatar: p("https://i.pravatar.cc/48?img=47"),
        },
        {
          id: "m2",
          type: "text",
          role: "bot",
          sender: "sendbird.ai",
          text: "Let's start with a dress. You like light tones—here are similar options.",
        },
        {
          id: "m3",
          type: "products",
          items: [
            {
              img: p("https://picsum.photos/seed/dress1/200/240"),
              name: "Off Shoulder Lace Dress",
              sub: "$82.00",
              cta: "Add to Cart",
            },
            {
              img: p("https://picsum.photos/seed/dress2/200/240"),
              name: "Strapless Maxi Dress",
              sub: "$88.00",
              cta: "Add to Cart",
            },
          ],
        },
      ],
    },
  },
];

// ── Helpers ───────────────────────────────────────────────

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
