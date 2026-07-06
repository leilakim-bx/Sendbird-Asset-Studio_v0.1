import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const tokenBoundaryRenderFiles = [
  "components/templates/**/*.{ts,tsx}",
  "components/infographic/blocks/**/*.{ts,tsx}",
  "components/infographic/InfographicCanvas.tsx",
  "components/concept-ui/**/*.{ts,tsx}",
  "components/product-visual/ConceptUIDisplay.tsx",
  "components/product-visual/ProductVisualCanvas.tsx",
  "components/product-visual/ScreenshotDisplay.tsx",
  "lib/product-visual/**/*.{ts,tsx}",
];

const tokenBoundaryToolUiFiles = [
  "components/editor/**/*.{ts,tsx}",
  "components/layout/**/*.{ts,tsx}",
  "components/assets/**/*.{ts,tsx}",
  "components/ui/**/*.{ts,tsx}",
  "components/infographic/sidebar/**/*.{ts,tsx}",
  "components/infographic/*.tsx",
  "components/product-visual/ProductVisualSidebar.tsx",
  "components/product-visual/ProductVisualShell.tsx",
  "components/product-visual/Section.tsx",
  "components/product-visual/CropSelector.tsx",
  "app/**/*.{ts,tsx}",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: tokenBoundaryRenderFiles,
    ignores: [
      "components/concept-ui/dev/**",
      "tests/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/tokens/app",
              message: "AGENTS.md Token Boundaries: Generated asset render paths must read visual values from lib/tokens/brand.ts only.",
            },
          ],
        },
      ],
    },
  },
  {
    files: tokenBoundaryToolUiFiles,
    ignores: [
      "app/dev/**",
      "components/infographic/InfographicCanvas.tsx",
      "tests/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/tokens/brand",
              message: "AGENTS.md Token Boundaries: Tool UI paths must read visual values from lib/tokens/app.ts only.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
