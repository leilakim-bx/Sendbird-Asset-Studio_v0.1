export type BackgroundCategory = "lifestyle" | "fashion" | "business" | "nature" | "custom";

export type Background = {
  id: string;
  label: string;
  url: string;
  category: BackgroundCategory;
};

export const BACKGROUNDS: Background[] = [
  {
    id: "bg-200",
    label: "Flower Abstract",
    url: "/background/bg-200.png",
    category: "lifestyle",
  },
  {
    id: "bg-100",
    label: "Autumn Blur",
    url: "/background/bg-100.png",
    category: "nature",
  },
  {
    id: "bg-101",
    label: "Pink Sky",
    url: "/background/bg-101.png",
    category: "nature",
  },
  {
    id: "bg-201",
    label: "Daisy Sky",
    url: "/background/bg-201.png",
    category: "lifestyle",
  },
  {
    id: "bg-202",
    label: "Petal Soft",
    url: "/background/bg-202.png",
    category: "lifestyle",
  },
  {
    id: "bg-203",
    label: "White Bloom",
    url: "/background/bg-203.png",
    category: "lifestyle",
  },
  {
    id: "bg-300",
    label: "Agent Steward",
    url: "/background/bg-300.png",
    category: "nature",
  },
  {
    id: "bg-301",
    label: "Voice AI",
    url: "/background/bg-301.png",
    category: "nature",
  },
  {
    id: "bg-302",
    label: "Trust OS",
    url: "/background/bg-302.png",
    category: "nature",
  },
];

export function getBackground(id: string): Background | undefined {
  return BACKGROUNDS.find((b) => b.id === id);
}
