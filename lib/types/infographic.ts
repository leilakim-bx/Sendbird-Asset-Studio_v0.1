// ── Infographic data model ────────────────────────────────
// Content model for the "infographic" template. Flat/branded visual
// language (solid background + bold numbers), distinct from the chat
// template's glassmorphism-over-photo look.

/** A single content block in an infographic. Discriminated by `type`. */
export type InfographicBlock =
  | {
      id: string;
      type: "stat";
      eyebrow?: string;
      /** Display string, e.g. "83%" or "3.2x" */
      number: string;
      highlightNumber?: boolean;
      label?: string;
    }
  | {
      id: string;
      type: "kpi-group";
      items: Array<{ number: string; label: string }>;
    }
  | {
      id: string;
      type: "bar-group";
      labelA?: string;
      labelB?: string;
      unit?: string;
      items: Array<{
        label: string;
        valueA: number;
        valueB?: number;
        highlight?: boolean;
      }>;
    }
  | {
      id: string;
      type: "step";
      items: Array<{ title: string; desc?: string; badge?: string }>;
    }
  | {
      id: string;
      type: "node-list";
      hubTitle: string;
      hubSub?: string;
      items: Array<{ label: string; tag?: string; desc?: string }>;
    };

export type InfographicBlockType = InfographicBlock["type"];

/** Export aspect: `product` = 866×660 fixed, `blog` = 664×variable height. */
export type InfographicFormat = "product" | "blog";

export type InfographicBg = "sky" | "stone" | "warmgray";

export type InfographicAccent = "lime" | "blue" | "red" | "green";

export type InfographicContent = {
  format: InfographicFormat;
  bg: InfographicBg;
  accent: InfographicAccent;
  title?: string;
  footnote?: string;
  blocks: InfographicBlock[];
};

// ── Palette maps (used by the renderer in a later step) ───

export const INFOGRAPHIC_BG_HEX: Record<InfographicBg, string> = {
  sky: "#D8F0FF",
  stone: "#D9D6D2",
  warmgray: "#E5E3DF",
};

export const INFOGRAPHIC_ACCENT_HEX: Record<InfographicAccent, string> = {
  lime: "#CBFF4D",
  blue: "#27A6F7",
  red: "#FF5E69",
  green: "#25BD85",
};

/** Ink (text) colors — shared across all infographic blocks. */
export const INFOGRAPHIC_INK = "#1C1917";
export const INFOGRAPHIC_INK_MUTED = "#7C7166";

/** Serif display stack (brand "Serrif") — titles + big numbers. */
export const INFOGRAPHIC_SERIF = '"Serrif", Georgia, "Times New Roman", serif';
