<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Context Docs

Before making product, UX, architecture, or implementation changes, use these
repo docs as the project source of truth:

- `PRD.md` — product goals, template scope, priorities, risks, and non-goals.
- `DEVELOPMENT_DESIGN.md` — app architecture, routing, state, API, export, and storage design.
- `STUDIO_DESIGN.md` — editor/studio UI rules.
- `ASSET_DESIGN.md` — generated asset visual rules.
- `docs/source-import-access.md` — protected URL/source import guidance.

Keep implementation and documentation aligned. If a change alters product scope,
data flow, export behavior, storage, AI routes, or visual rules, update the
relevant document in the same task.

If a change alters any saved work data structure, it must also increment the
work data `schemaVersion` and add the matching migration function in the same
task.

## Token Boundaries

- Generated asset render paths (Chat mockup, Infographic canvas/blocks,
  Product Visual canvas, Concept UI scene renderer) must read visual values from
  `lib/tokens/brand.ts` only.
- Tool UI paths (forms, buttons, sidebars, modals, editor chrome) must read
  visual values from `lib/tokens/app.ts` only, usually through the CSS variables
  injected by `app/layout.tsx` and Tailwind `studio-*` utilities.
- Do not import `brand.ts` from tool UI components, and do not import `app.ts`
  from asset render components. Shared components must receive visual values
  through props instead of importing either token file.
- Do not hardcode hex colors, rgb/rgba/oklch colors, font stacks, radii,
  spacing, or shadows inside components. Add or reuse a role-based token first.
- Dev-only screens under `app/dev/**` and `components/concept-ui/dev/**` are not
  token-enforced, but they must not be imported by asset render paths.
