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
      type: "card-grid";
      /** General-purpose information cards. Supports 1-4. */
      cards: Array<{ badge?: string; title: string; body: string }>;
    }
  | {
      id: string;
      type: "bar-group";
      /** Bar shape. "bars" = horizontal A/B rows (default); "split" = one bar
       *  divided into proportional segments; "columns" = vertical columns;
       *  "ranked" = single-series rows with the label INSIDE each bar, value
       *  outside, and a grayscale color ramp (highlight row = accent fill). */
      variant?: "bars" | "split" | "columns" | "ranked";
      /** "bars" only: drop the left label gutter and instead show the category
       *  label INSIDE the A (dark) bar, with labelA/labelB as ranked-style top
       *  headers (left/right). No effect on other variants. Default false. */
      labelInside?: boolean;
      /** Legend labels (bars). For "ranked" — and "bars" with labelInside — these
       *  double as column headers: labelA = left/category header, labelB =
       *  right/value header. */
      labelA?: string;
      labelB?: string;
      unit?: string;
      items: Array<{
        label: string;
        valueA: number;
        valueB?: number;
        highlight?: boolean;
        /** "columns" only: big serif heading inside the column (e.g. "Lv.1"). */
        heading?: string;
        /** "columns" only: small chip inside the column (e.g. "Steward"). */
        tag?: string;
        /** "columns" only: caption under the column label. */
        desc?: string;
      }>;
    }
  | {
      id: string;
      type: "step";
      items: Array<{ title: string; desc?: string; badge?: string }>;
    }
  | {
      id: string;
      type: "stack";
      /** Top-to-bottom layers (bands). Renders as a layered architecture diagram. */
      layers: Array<{
        /** Band header label, e.g. "ORCHESTRATION LAYER". */
        title: string;
        /** Optional one-line caption under the header. */
        caption?: string;
        /** Dark/accent emphasis for this layer (e.g. "THE AGENT"). */
        highlight?: boolean;
        /** Cells inside the band (a row of boxes). Omit/empty = header-only band. */
        cells?: Array<{ title: string; desc?: string }>;
      }>;
      /** Draw vertical connectors between layers (default true). */
      connectors?: boolean;
      /** Optional dark callout box below the stack (e.g. "EXAMPLE TRIGGER"). */
      callout?: string;
    }
  | {
      id: string;
      type: "node-list";
      hubTitle: string;
      hubSub?: string;
      items: Array<{ label: string; tag?: string; desc?: string }>;
    }
  | {
      id: string;
      type: "compare";
      /** "cards" = two side-by-side panels (default); "table" = aligned grid with row labels. */
      layout?: "table" | "cards";
      columnA: string;
      columnB: string;
      /** Accent-highlight column B (the "new / better" side). */
      highlightB?: boolean;
      /** Show the bullet dot before each card item (default true). */
      bullets?: boolean;
      rows: Array<{ label?: string; a: string; b: string }>;
    }
  | {
      id: string;
      type: "stacked-bar";
      /** "stacked" (default) = series stack end-to-end within each bar;
       *  "grouped" = series render as separate parallel bars per row (clustered),
       *  scaled to one global max. `normalize` is ignored when "grouped". */
      layout?: "stacked" | "grouped";
      /** Series legend labels, in stacking order (left→right within each bar). */
      series: string[];
      /** Category rows; each row's `values` align to `series` by index. */
      rows: Array<{ label: string; values: number[] }>;
      /** Normalize every row to 100% width (default false = absolute widths on a
       *  shared scale, so row totals are comparable). Stacked layout only. */
      normalize?: boolean;
      /** Index into `series` rendered in the accent (lime); the rest stay
       *  grayscale. undefined / -1 = pure grayscale. */
      accentIndex?: number;
      unit?: string;
    }
  | {
      id: string;
      type: "line-chart";
      /** Shared x-axis category labels; series values align by index. */
      xLabels: string[];
      seriesA: { label: string; values: number[] };
      /** Optional second line for comparison. */
      seriesB?: { label: string; values: number[] };
      /** Accent area fill under line A (default true). */
      fill?: boolean;
      /** Y-axis max; auto-computed from the data when omitted. */
      yMax?: number;
    }
  | {
      id: string;
      type: "orbit";
      /** "cycle" = labeled process loop; "hub-spoke" = center mark + channel icons. */
      variant: "cycle" | "hub-spoke";
      /** Center label shown under/inside the mark, depending on variant. */
      center?: string;
      /** Cycle nodes, placed clockwise around the center. Supports 3-8. */
      nodes?: Array<{ label: string; highlight?: boolean }>;
      /** Hub-spoke satellites, placed on a dashed ring. Supports 3-8. */
      satellites?: Array<{ key: OrbitIconKey }>;
    };

export type InfographicBlockType = InfographicBlock["type"];

export type OrbitIconKey =
  | "mobile"
  | "voice"
  | "whatsapp"
  | "email"
  | "chat"
  | "web"
  | "audio"
  | "site";

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
  /** Toggle the Title & footnote section. undefined/true = shown; false = hidden
   *  (graph-only / single centered content). */
  showTitle?: boolean;
  blocks: InfographicBlock[];
};

// ── Palette maps (used by the renderer in a later step) ───

export const INFOGRAPHIC_BG_HEX: Record<InfographicBg, string> = {
  sky: "#D8F0FF",
  stone: "#D9D6D2",
  warmgray: "#F7F5F0",
};

export const INFOGRAPHIC_ACCENT_HEX: Record<InfographicAccent, string> = {
  lime: "#F2FF66",
  blue: "#27A6F7",
  red: "#FF5E69",
  green: "#25BD85",
};

/** Ink (text) colors — shared across all infographic blocks. */
export const INFOGRAPHIC_INK = "#1C1917";
export const INFOGRAPHIC_INK_MUTED = "#7C7166";

/** Serif display stack (brand "Serrif") — titles + big numbers. */
export const INFOGRAPHIC_SERIF = '"Serrif", Georgia, "Times New Roman", serif';

/** Sans body stack (Helvetica Now Text) — default text, title & footnote. */
export const INFOGRAPHIC_SANS = '"Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
