export type BackgroundCategory = "lifestyle" | "fashion" | "business" | "nature" | "custom";

/** 라이브러리 탭 분류: general = 자연물/추상, brand = 브랜드 테마, industry = 사람/현장, everyday = 일상 속 인물/디바이스 */
export type BackgroundGroup = "general" | "brand" | "industry" | "everyday";

export type Background = {
  id: string;
  label: string;
  url: string;
  category: BackgroundCategory;
  /** 라이브러리 탭 필터용. 커스텀 업로드는 미지정 → All 탭에서만 노출 */
  group?: BackgroundGroup;
  /** 특정 브랜드/제품 전용 배경일 때 썸네일에 표시 */
  usageBadge?: string;
};

export const BACKGROUNDS: Background[] = [
  {
    id: "bg-200",
    label: "Flower Abstract",
    url: "/background/bg-200.png",
    category: "lifestyle",
    group: "general",
  },
  {
    id: "bg-100",
    label: "Autumn Blur",
    url: "/background/bg-100.png",
    category: "nature",
    group: "general",
  },
  {
    id: "bg-101",
    label: "Pink Sky",
    url: "/background/bg-101.png",
    category: "nature",
    group: "general",
  },
  {
    id: "bg-201",
    label: "Daisy Sky",
    url: "/background/bg-201.png",
    category: "lifestyle",
    group: "general",
  },
  {
    id: "bg-202",
    label: "Petal Soft",
    url: "/background/bg-202.png",
    category: "lifestyle",
    group: "general",
  },
  {
    id: "bg-203",
    label: "White Bloom",
    url: "/background/bg-203.png",
    category: "lifestyle",
    group: "general",
  },
  {
    id: "bg-204",
    label: "Golden Blur",
    url: "/background/bg-204.png",
    category: "nature",
    group: "general",
  },
  {
    id: "bg-300",
    label: "Agent Steward",
    url: "/background/bg-300.png",
    category: "nature",
    group: "brand",
    usageBadge: "Steward only",
  },
  {
    id: "bg-301",
    label: "Voice AI",
    url: "/background/bg-301.png",
    category: "nature",
    group: "brand",
    usageBadge: "Voice only",
  },
  {
    id: "bg-302",
    label: "Trust OS",
    url: "/background/bg-302.png",
    category: "nature",
    group: "brand",
    usageBadge: "Trust OS only",
  },
  {
    id: "bg-504",
    label: "Travel & hospitality",
    url: "/background/bg-504.png",
    category: "nature",
    group: "industry",
  },
  {
    id: "bg-500",
    label: "Retail",
    url: "/background/bg-500.png",
    category: "business",
    group: "industry",
  },
  {
    id: "bg-501",
    label: "B2B",
    url: "/background/bg-501.png",
    category: "business",
    group: "industry",
  },
  {
    id: "bg-502",
    label: "Healthcare",
    url: "/background/bg-502.png",
    category: "business",
    group: "industry",
  },
  {
    id: "bg-503",
    label: "On-demand",
    url: "/background/bg-503.png",
    category: "lifestyle",
    group: "industry",
  },
  {
    id: "bg-505",
    label: "Financial services",
    url: "/background/bg-505.png",
    category: "lifestyle",
    group: "industry",
  },
  {
    id: "bg-600",
    label: "Everyday Chat",
    url: "/background/bg-600.png",
    category: "lifestyle",
    group: "everyday",
  },
  {
    id: "bg-601",
    label: "Mobile Moment",
    url: "/background/bg-601.png",
    category: "lifestyle",
    group: "everyday",
  },
  {
    id: "bg-602",
    label: "Workspace Moment",
    url: "/background/bg-602.png",
    category: "business",
    group: "everyday",
  },
];

export function getBackground(id: string): Background | undefined {
  return BACKGROUNDS.find((b) => b.id === id);
}
