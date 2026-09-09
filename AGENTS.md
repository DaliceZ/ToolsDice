# ToolsDice agent guide

## Product

ToolsDice is a Thai-first, privacy-first browser utility suite. User text,
JSON, YAML, URLs, hashes, dates, and PDFs must be processed locally. Never add
uploading, analytics, input persistence, or payload logging without an explicit
product decision.

## Architecture

- `frontend/`: React + Vite + TypeScript + Tailwind CSS. React Router owns URLs,
  TanStack Query owns remote runtime config, and local component state owns tool
  inputs. Reusable UI primitives live in `src/components/ui`.
- `backend/`: Bun + Elysia. It only exposes health and public runtime config in
  this MVP; it must not receive tool payloads.
- Root: Bun workspace scripts and Docker Compose. Production containers serve
  the frontend with nginx and proxy `/api` to Elysia.

## Conventions

- Keep tool metadata in `frontend/src/lib/tool-registry.ts` and pure processing
  logic in `frontend/src/lib/tool-engines.ts`.
- Add a stable route slug, Thai label, category, search keywords, and Lucide icon
  for every tool.
- Persist only appearance, favorites, and recent tool IDs. Never persist editor
  contents or selected files.
- Render errors as user-actionable Thai messages. Do not use `eval` or inject
  user content as HTML.
- Update this file in the same change whenever architecture, conventions,
  workflow, privacy constraints, or validation commands change.

## Visual system

- The product is dark-only: use near-black slate-neutral surfaces with dark blue
  supporting actions and selected states. Do not add light/system theme controls
  or green UI colors without an explicit product change.
- Follow Radix-style color roles: lowest steps for app/card backgrounds,
  middle steps for interactions and borders, and highest steps for text.
- Keep decorative blue light at or below 7% opacity on the dark canvas.
- Group the all-tools dashboard and sidebar by category. Each category keeps a
  consistent muted accent: text/cyan, date-time/sky, data/amber,
  developer/indigo, and documents/rose. Category color is supplementary; text,
  labels, borders, and spacing must still communicate grouping without color.
- Normal text must meet WCAG AA contrast (4.5:1); large text and meaningful UI
  boundaries must meet at least 3:1.
- Tool cards are one large link target. Keep favorite controls above the link
  overlay so the two actions remain distinct and keyboard accessible.
- Keep mobile layouts compact without shrinking primary touch targets: use the
  narrow drawer, reduced page/card padding, and shorter dashboard hero defined
  by the shared shell and primitives. Keep a 16px page gutter on small screens,
  render recent tools as one horizontally scrollable row, and use compact
  horizontal dashboard cards with clamped descriptions on mobile. The mobile
  drawer scrim must stay neutral black/transparent and must not inherit blue or
  category accent colors.
- Ambient background motion must remain decorative, subtle, non-interactive,
  and disabled by `prefers-reduced-motion`. Never let motion delay or obscure a
  user action.
- Use restrained translucent glass surfaces with neutral borders and blur for
  the shell, dashboard panels, and tool cards. Keep the sidebar brand divider
  aligned with the main top-bar divider at every breakpoint.
- The top bar includes one compact external portfolio action labeled `ผลงาน`
  linking to `https://www.dalalight.online/`; keep it usable on mobile without
  increasing the bar height.
- Treat intentionally removed UI and copy as a product decision. Do not restore
  it unless the user explicitly asks for it.
- The public Supabase `toolicon.png` is the product mark in the header and page
  metadata. Do not substitute it without an explicit design change.

## Validation

- Install: `bun install`
- Development (both apps): `bun run dev`
- Development (one app): `bun run dev:api` or `bun run dev:web`
- Type check: `bun run typecheck`
- Lint: `bun run lint`
- Unit/API tests: `bun run test`
- Production build: `bun run build`
- Browser smoke tests: `bun run test:e2e`
- Containers: `docker compose up --build`

Local Bun is required unless Docker is used. Copy `.env.example` to `.env` only
when overriding defaults; never commit secrets.
