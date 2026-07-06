# Delight Asset Studio

Internal Sendbird/Delight.ai asset creation studio for marketing images, product visuals, chat UI mockups, and infographics.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Copy `.env.local.example` to `.env.local` for local-only secrets when needed.

## Verification

```bash
npm run lint
npm run test:run
npm run build
npm run verify
```

## Project Docs

- Product: [`docs/product/PRD.md`](docs/product/PRD.md)
- Engineering: [`docs/engineering/DEVELOPMENT_DESIGN.md`](docs/engineering/DEVELOPMENT_DESIGN.md)
- Studio UI rules: [`docs/design/STUDIO_DESIGN.md`](docs/design/STUDIO_DESIGN.md)
- Asset visual rules: [`docs/design/ASSET_DESIGN.md`](docs/design/ASSET_DESIGN.md)
- Protected source import guidance: [`docs/engineering/source-import-access.md`](docs/engineering/source-import-access.md)

## Repository Layout

```text
app/          Next.js app routes and API routes
components/   Studio UI and asset render components
lib/          Business logic, tokens, storage, schemas, validators
public/       Runtime static assets used by the app
data/         Generated and static local data
scripts/      Local maintenance scripts
tests/        Vitest and Playwright tests
docs/         Product, design, engineering, and reference docs
```

Agent-specific working instructions live in [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md).
