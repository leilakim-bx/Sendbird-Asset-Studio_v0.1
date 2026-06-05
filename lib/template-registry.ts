import type { ChatMessage } from "./store";
import { getAvatarForName } from "./avatar";

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
  desktop: { id: "desktop", label: "Desktop", width: 866, height: 660 },
  mobile:  { id: "mobile",  label: "Mobile",  width: 400, height: 385 },
};

// ── Templates ─────────────────────────────────────────────

export const TEMPLATES: Template[] = [
  {
    id: "feature-mockup",
    name: "Chat conversation",
    description: "Glassmorphism chat UI over a lifestyle background",
    layouts: ["center", "split"],
    exportSizes: [EXPORT_SIZES.desktop, EXPORT_SIZES.mobile],
    defaultLayout: "center",
    defaultContent: {
      appName: "delight.ai",
      backgroundId: "bg-200",
      messages: [
        {
          id: "m1",
          role: "user",
          sender: "Taylor",
          avatar: getAvatarForName("Taylor"),
          block: {
            type: "text",
            text: "I need something for a summer wedding",
          },
        },
        {
          id: "m2",
          role: "bot",
          sender: "sendbird.ai",
          block: {
            type: "text",
            text: "Let's start with a dress. You like light tones—here are similar options.",
          },
        },
        {
          id: "m3",
          role: "bot",
          sender: "bot",
          block: {
            type: "products",
            items: [
              {
                img: p("https://images.pexels.com/photos/8780372/pexels-photo-8780372.jpeg?auto=compress&cs=tinysrgb&h=350"),
                name: "Off Shoulder Lace Dress",
                sub: "$82.00",
                cta: "Add to Cart",
              },
              {
                img: p("https://images.pexels.com/photos/28845496/pexels-photo-28845496.jpeg?auto=compress&cs=tinysrgb&h=350"),
                name: "Strapless Maxi Dress",
                sub: "$88.00",
                cta: "Add to Cart",
              },
            ],
          },
        },
      ],
    },
  },
];

// ── Helpers ───────────────────────────────────────────────

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
