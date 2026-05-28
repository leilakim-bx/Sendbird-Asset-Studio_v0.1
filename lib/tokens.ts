// Sendbird Design System — TypeScript Token Reference
// Usage: tokens.colors.primary[500], tokens.spacing[4], tokens.shadow.md
// These mirror the CSS variables in globals.css — update both if values change.

export const tokens = {
  colors: {
    primary: {
      50:  "#F9F9F9",
      100: "#F0F0F0",
      200: "#DEDEDE",
      300: "#C2C2C2",
      400: "#8C8C8C",
      500: "#000000",
      600: "#1A1A1A",
      700: "#2E2E2E",
      800: "#404040",
      900: "#5C5C5C",
    },
    neutral: {
      50:  "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
    semantic: {
      success: "#12B669",
      warning: "#F59E0B",
      error:   "#EF4444",
      info:    "#3B82F6",
    },
    // Theme-responsive values — prefer CSS variables in components when possible
    bg: {
      light: "#FFFFFF",
      dark:  "#1A1A2E",
    },
    surface: {
      light: "#F9FAFB",
      dark:  "#252540",
    },
    text: {
      primary:   "#000000",
      secondary: "#6B7280",
      disabled:  "#9CA3AF",
    },
  },

  typography: {
    fontFamily: {
      display: '"Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      body:    '"Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    fontSize: {
      xs:   "0.75rem",    // 12px
      sm:   "0.875rem",   // 14px
      base: "1rem",       // 16px
      lg:   "1.125rem",   // 18px
      xl:   "1.25rem",    // 20px
      "2xl": "1.5rem",    // 24px
      "3xl": "1.875rem",  // 30px
      "4xl": "2.25rem",   // 36px
      "5xl": "3rem",      // 48px
    },
    fontWeight: {
      regular:  400,
      medium:   500,
      semibold: 600,
      bold:     700,
    },
    lineHeight: {
      tight:  1.2,
      normal: 1.5,
      loose:  1.75,
    },
  },

  // Spacing — base unit 4px. Keys match Tailwind's default scale (1 = 4px).
  spacing: {
    1:  "0.25rem",  // 4px
    2:  "0.5rem",   // 8px
    3:  "0.75rem",  // 12px
    4:  "1rem",     // 16px
    5:  "1.25rem",  // 20px
    6:  "1.5rem",   // 24px
    8:  "2rem",     // 32px
    10: "2.5rem",   // 40px
    12: "3rem",     // 48px
    16: "4rem",     // 64px
    20: "5rem",     // 80px
    24: "6rem",     // 96px
  },

  borderRadius: {
    sm:   "0.25rem",   // 4px
    md:   "0.5rem",    // 8px
    lg:   "0.75rem",   // 12px
    xl:   "1rem",      // 16px
    "2xl": "1.5rem",   // 24px
    full: "9999px",
  },

  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 6px rgba(0,0,0,0.07)",
    lg: "0 10px 15px rgba(0,0,0,0.10)",
    xl: "0 20px 25px rgba(0,0,0,0.15)",
  },
} as const;

export type Tokens = typeof tokens;
