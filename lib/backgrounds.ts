export type BackgroundCategory = "lifestyle" | "fashion" | "business" | "nature";

export type Background = {
  id: string;
  label: string;
  url: string;
  category: BackgroundCategory;
};

/** Wrap an external image URL through our same-origin proxy */
function p(url: string) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export const BACKGROUNDS: Background[] = [
  {
    id: "bg-1",
    label: "Fashion Indoor",
    url: p("https://picsum.photos/seed/fashion1/1200/900"),
    category: "fashion",
  },
  {
    id: "bg-2",
    label: "Lifestyle Warm",
    url: p("https://picsum.photos/seed/lifestyle2/1200/900"),
    category: "lifestyle",
  },
  {
    id: "bg-3",
    label: "Nature Sky",
    url: p("https://picsum.photos/seed/sky3/1200/900"),
    category: "nature",
  },
  {
    id: "bg-4",
    label: "Business Clean",
    url: p("https://picsum.photos/seed/business4/1200/900"),
    category: "business",
  },
  {
    id: "bg-5",
    label: "Lifestyle Bright",
    url: p("https://picsum.photos/seed/bright5/1200/900"),
    category: "lifestyle",
  },
  {
    id: "bg-6",
    label: "Nature Soft",
    url: p("https://picsum.photos/seed/nature6/1200/900"),
    category: "nature",
  },
];

export function getBackground(id: string): Background | undefined {
  return BACKGROUNDS.find((b) => b.id === id);
}
