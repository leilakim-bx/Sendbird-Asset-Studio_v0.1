import type { ChatMessage } from "./store";
import type { InfographicContent } from "./types/infographic";
import { getAvatarForName } from "./avatar";

/** Wrap an external image URL through our same-origin proxy */
function p(url: string) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

// ── Types ─────────────────────────────────────────────────

export type ExportSize = {
  /** "desktop" | "mobile" for chat; "product" | "blog" for infographic, etc. */
  id: string;
  label: string;
  width: number;
  /** 0 = variable height (content-driven) */
  height: number;
};

export type TemplateLayout = "center" | "split";

/** Fields shared by every template variant. */
type TemplateBase = {
  id: string;
  name: string;
  description: string;
  layouts: TemplateLayout[];
  exportSizes: ExportSize[];
};

export type ChatTemplate = TemplateBase & {
  kind: "chat";
  defaultLayout: TemplateLayout;
  defaultContent: {
    appName: string;
    backgroundId: string;
    messages: ChatMessage[];
  };
};

export type InfographicTemplate = TemplateBase & {
  kind: "infographic";
  defaultContent: InfographicContent;
};

/** Discriminated by `kind` — narrow before accessing variant-specific fields. */
export type Template = ChatTemplate | InfographicTemplate;

// ── Export Sizes ──────────────────────────────────────────

export const EXPORT_SIZES: Record<"desktop" | "mobile", ExportSize> = {
  desktop: { id: "desktop", label: "Desktop", width: 866, height: 660 },
  mobile:  { id: "mobile",  label: "Mobile",  width: 343, height: 385 },
};

// ── Templates ─────────────────────────────────────────────

export const TEMPLATES: Template[] = [
  {
    kind: "chat",
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
  {
    kind: "infographic",
    id: "infographic",
    name: "Infographic",
    description: "Stats, charts, and diagrams for marketing posts",
    layouts: [], // infographic has no layout options
    exportSizes: [
      { id: "product", label: "Product (866×660)", width: 866, height: 660 },
      { id: "blog", label: "Blog (664×var)", width: 664, height: 0 }, // height 0 = variable
    ],
    defaultContent: {
      format: "product",
      bg: "warmgray",
      accent: "lime",
      title: "AI is brand equity now.",
      footnote: "83% of consumers credit the brand behind a good AI experience.",
      blocks: [
        {
          id: "b1",
          type: "stat",
          eyebrow: "RETAIL",
          number: "83%",
          highlightNumber: true,
          label: "link AI to brand trust",
        },
      ],
    },
  },
];

// ── Helpers ───────────────────────────────────────────────

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
