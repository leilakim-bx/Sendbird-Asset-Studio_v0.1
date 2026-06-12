const appColor = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.145 0 0)",
  popover: "oklch(1 0 0)",
  popoverForeground: "oklch(0.145 0 0)",
  primary: "oklch(0.205 0 0)",
  primaryForeground: "oklch(0.985 0 0)",
  secondary: "oklch(0.97 0 0)",
  secondaryForeground: "oklch(0.205 0 0)",
  muted: "oklch(0.97 0 0)",
  mutedForeground: "oklch(0.556 0 0)",
  accent: "oklch(0.97 0 0)",
  accentForeground: "oklch(0.205 0 0)",
  destructive: "oklch(0.577 0.245 27.325)",
  border: "oklch(0.922 0 0)",
  input: "oklch(0.922 0 0)",
  ring: "oklch(0.708 0 0)",
  chart1: "oklch(0.87 0 0)",
  chart2: "oklch(0.556 0 0)",
  chart3: "oklch(0.439 0 0)",
  chart4: "oklch(0.371 0 0)",
  chart5: "oklch(0.269 0 0)",
  sidebar: "oklch(0.985 0 0)",
  sidebarForeground: "oklch(0.145 0 0)",
  sidebarPrimary: "oklch(0.205 0 0)",
  sidebarPrimaryForeground: "oklch(0.985 0 0)",
  sidebarAccent: "oklch(0.97 0 0)",
  sidebarAccentForeground: "oklch(0.205 0 0)",
  sidebarBorder: "oklch(0.922 0 0)",
  sidebarRing: "oklch(0.708 0 0)",
  studioBg: "#252525",
  studioSidebar: "#1A1A1A",
  studioBorder: "#333333",
  studioText: "#FFFFFF",
  studioMuted: "#888888",
  studioHover: "#2E2E2E",
  studioAccent: "#F2FF66",
  studioAccentFg: "#000000",
  studioInput: "#0E0E0E",
  studioCheckbox: "#5A5A5A",
  studioCheckboxHover: "#6B6B6B",
  studioCropSelector: "#CBFF4D",
  studioPreviewSurface: "#F7F5F0",
  error: "#EF4444",
  placeholder: "#555555",
  overlayModal: "rgba(0,0,0,0.7)",
  overlayCrop: "rgba(0,0,0,0.5)",
  overlayCropStrong: "rgba(0,0,0,0.75)",
  cropBorder: "rgba(0,0,0,0.35)",
  coachmarkBg: "#C0A6E0",
  coachmarkFg: "#241B33",
};

const appDarkColor = {
  background: "oklch(0.145 0 0)",
  foreground: "oklch(0.985 0 0)",
  card: "oklch(0.205 0 0)",
  cardForeground: "oklch(0.985 0 0)",
  popover: "oklch(0.205 0 0)",
  popoverForeground: "oklch(0.985 0 0)",
  primary: "oklch(0.922 0 0)",
  primaryForeground: "oklch(0.205 0 0)",
  secondary: "oklch(0.269 0 0)",
  secondaryForeground: "oklch(0.985 0 0)",
  muted: "oklch(0.269 0 0)",
  mutedForeground: "oklch(0.708 0 0)",
  accent: "oklch(0.269 0 0)",
  accentForeground: "oklch(0.985 0 0)",
  destructive: "oklch(0.704 0.191 22.216)",
  border: "oklch(1 0 0 / 10%)",
  input: "oklch(1 0 0 / 15%)",
  ring: "oklch(0.556 0 0)",
  chart1: "oklch(0.87 0 0)",
  chart2: "oklch(0.556 0 0)",
  chart3: "oklch(0.439 0 0)",
  chart4: "oklch(0.371 0 0)",
  chart5: "oklch(0.269 0 0)",
  sidebar: "oklch(0.205 0 0)",
  sidebarForeground: "oklch(0.985 0 0)",
  sidebarPrimary: "oklch(0.488 0.243 264.376)",
  sidebarPrimaryForeground: "oklch(0.985 0 0)",
  sidebarAccent: "oklch(0.269 0 0)",
  sidebarAccentForeground: "oklch(0.985 0 0)",
  sidebarBorder: "oklch(1 0 0 / 10%)",
  sidebarRing: "oklch(0.556 0 0)",
};

export const app = {
  color: appColor,
  darkColor: appDarkColor,
  font: {
    sans: '"Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: '"Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
    heading: '"Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  radius: {
    base: "0.625rem",
    controlSm: "4px",
    controlMd: "8px",
    controlLg: "10px",
    controlXl: "12px",
    full: "9999px",
  },
  spacing: {
    sidebarWidth: "288px",
    sidebarMin: "240px",
    sidebarMax: "520px",
    menuMinWidth: "260px",
    cropPreviewHeight: "72px",
    checkboxSize: "16px",
    checkboxIconSize: "12px",
  },
  shadow: {
    popover: "0 10px 15px rgba(0,0,0,0.10)",
    toast: "0 20px 25px rgba(0,0,0,0.15)",
  },
  checkboxCheckIcon:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000000' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 8.5l3 3 6-6'/%3E%3C/svg%3E\")",
} as const;

const cssVarNames = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
  studioBg: "--studio-bg",
  studioSidebar: "--studio-sidebar",
  studioBorder: "--studio-border",
  studioText: "--studio-text",
  studioMuted: "--studio-text-muted",
  studioHover: "--studio-hover",
  studioAccent: "--studio-accent",
  studioAccentFg: "--studio-accent-fg",
  studioInput: "--studio-input",
  studioCheckbox: "--studio-checkbox",
  studioCheckboxHover: "--studio-checkbox-hover",
  studioCropSelector: "--studio-crop-selector",
  studioPreviewSurface: "--studio-preview-surface",
  error: "--app-error",
  placeholder: "--app-placeholder",
  overlayModal: "--app-overlay-modal",
  overlayCrop: "--app-overlay-crop",
  overlayCropStrong: "--app-overlay-crop-strong",
  cropBorder: "--app-crop-border",
  coachmarkBg: "--app-coachmark-bg",
  coachmarkFg: "--app-coachmark-fg",
} as const;

function declarations(
  values: Partial<Record<keyof typeof cssVarNames, string>>,
): string {
  return Object.entries(values)
    .map(([key, value]) => `  ${cssVarNames[key as keyof typeof cssVarNames]}: ${value};`)
    .join("\n");
}

export function appTokenCssVariables(): string {
  return `:root {
${declarations(app.color)}
  --radius: ${app.radius.base};
  --font-app-sans: ${app.font.sans};
  --font-app-mono: ${app.font.mono};
  --font-app-heading: ${app.font.heading};
  --app-checkbox-radius: ${app.radius.controlSm};
  --app-checkbox-size: ${app.spacing.checkboxSize};
  --app-checkbox-icon-size: ${app.spacing.checkboxIconSize};
  --app-checkbox-check-icon: ${app.checkboxCheckIcon};
}

.dark {
${declarations(app.darkColor)}
}`;
}

export type AppTokens = typeof app;
