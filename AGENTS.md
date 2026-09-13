# ToolsDice agent guide

## Product and privacy

ToolsDice is an English-default, privacy-first browser utility suite with
English and Thai UI. Text, JSON, YAML, URLs, dates, PDF files, image files,
hashes, and Checklist items are
processed in the browser. Never upload tool inputs, add analytics, persist
editor contents or selected files, or log payloads without an explicit product
decision. The backend serves health and public runtime configuration only; it
must never receive tool input.

Favorites, language, and theme preferences are the only app preferences
persisted in browser storage. Recent tools are not tracked. Checklist entries
live in page memory and disappear when the page closes. Importing Checklist
JSON, copying a result, and downloading a file happen only after the user
chooses the matching action.

## Architecture

- `frontend/`: React + Vite + TypeScript + Tailwind CSS. React Router owns tool
  URLs, TanStack Query owns public runtime config, and local component state
  owns tool inputs.
- `frontend/src/lib/tool-registry.ts` is the source of truth for 61 stable tool
  routes, labels, categories, keywords, and icons.
- `frontend/src/lib/tool-engines.ts` is the public barrel for pure processing
  functions. Domain engines live in `frontend/src/lib/tool-engines/`.
- `frontend/src/pages/ToolWorkspace.tsx` routes each tool to its panel. Text,
  PDF, image, data, and extended-tool panels load lazily. Import heavy libraries
  from inside the relevant lazy panel or operation.
- `frontend/src/pages/TextTools.tsx` contains the text-tool interface and must
  call local engines without persisting input. Other local panels live in
  `frontend/src/pages/tools/`.
- `frontend/src/lib/tool-coverage.ts` maps all 90 source catalog entries to a
  route and mode. It keeps 87 local capabilities and records the three omitted
  remote-service features.
- `backend/`: Bun + Elysia. It exposes health and public runtime config only.
- Root: Bun workspaces and Docker Compose. Production containers serve the
  frontend with nginx and proxy `/api` to Elysia.

The language and theme providers and bilingual tool catalog live in
`frontend/src/lib`. English is the default UI language; Thai uses Sarabun and
English uses Poppins. The overview links to nine category pages; a category
page lists its tools, and each tool has its own local workspace.

## Tool catalog and conventions

The catalog has 61 routes in nine categories: PDF, Text, Images, Developer,
Converters, Data, Generators, Date & Time, and Calculators. Multiple source
features may share a route when they are modes of the same tool, such as PDF
Workspace, JSON Toolkit, CSV Workspace, and URL Toolkit. The Checklist replaces the source
shared checklist with an in-memory, user-controlled local version. Short Link,
Burn Note, and YouTube conversion are excluded because they require remote
storage or an external API.

- Add every tool to `tool-registry.ts` with a stable slug, English and Thai
  labels, descriptions, category, search keywords, and Lucide icon. Update the
  runtime config allowlist and coverage matrix when catalog routes change.
- Keep processing deterministic and local in domain engines. Return
  user-actionable errors in the selected language; do not use `eval` or render
  user input as HTML.
- Markdown Preview must render a parsed safe block model. Only `http` and
  `https` links may become anchors; raw HTML and unsafe URL schemes stay text.
- Thai money reading accepts decimal currency up to satang precision and
  rejects malformed or over-precise input with a local actionable error.
- Validate file type, size, and page selection in the browser before processing.
- Do not add an API endpoint for tool payloads. Runtime configuration must stay
  independent of user input.

## Visual system and UX

- The default Classic theme is a light, minimal cream palette with dark
  readable text, warm neutral borders, and terracotta primary actions. The
  custom theme menu offers Classic, Dark, Exclusive, Matcha, and Volcano; each
  theme must update all surfaces, text, controls, borders, and category accents.
- Use muted category accents consistently: rose for PDF and images, cyan for
  text, indigo for developer tools and generators, amber for converters, data,
  and calculations, and sky for date/time. Labels and structure must still
  communicate grouping without color.
- Small 3D ambient shapes and the homepage electron orbits are decorative and
  non-interactive. They run by default and must stop under
  `prefers-reduced-motion`.
- Normal text must meet WCAG AA contrast (4.5:1); large text and meaningful UI
  boundaries must meet at least 3:1. Keep layouts usable at 320 CSS pixels and
  preserve keyboard focus and touch targets.
- Prioritize expandable search, favorites, and the nine category links on the
  overview. Search opens from its icon and collapses when focus leaves. Do not
  show a recent-tools section.
  Keep each tool workspace focused on its input, result, and next action.
- Tool cards are one large link target. Keep favorite controls above the link
  overlay so both actions remain distinct and keyboard accessible.
- Keep all routes responsive without oversized fixed-width content. Keep at
  least 16px page gutters and reflow workspaces at narrow container widths. Use
  the mobile drawer, compact horizontal tool cards, and a neutral
  black/transparent drawer scrim. Hide the sidebar scrollbar except while
  scrolling or interacting with the sidebar. Give overview and category pages
  additional responsive inset spacing inside the main page gutter.
- Use restrained translucent glass surfaces with neutral borders and blur. The
  sidebar starts directly beneath the top bar without a duplicate brand header.
- The top bar includes an icon-and-text Portfolio action linking to
  `https://www.dalalight.online/`, a custom Thai/English language dropdown, and
  a custom five-theme dropdown. Keep Portfolio at the far right of the top bar
  and put the responsive sidebar open/close control beside the ToolsDice brand.
  Sidebar category rows expand their tools and are not category-page links.
- Use the selected product mark at
  `https://yqkdvluuiuxbnekwrcou.supabase.co/storage/v1/object/public/pics/icon/logo2.png`
  in the header and page metadata.
- Use the findings and limitations in `docs/youth-ux-research.md` as desk
  research, not as a substitute for testing with Thai ToolsDice users.

## Validation

- Install: `bun install`
- Development (both apps): `bun run dev`
- Development (one app): `bun run dev:api` or `bun run dev:web`
- Type check: `bun run typecheck`
- Lint: `bun run lint`
- Unit/API tests, including catalog coverage: `bun run test`
- Production build: `bun run build`
- Browser smoke tests: `bun run test:e2e`
- Containers: `docker compose up --build`

For changes to tool processing or layouts, run typecheck, lint, unit/API tests,
build, and browser smoke tests. Browser checks should include direct tool routes,
runtime config, keyboard focus, reduced motion, privacy behavior, and a 320px
viewport when relevant.

Local Bun is required unless Docker is used. Copy `.env.example` to `.env` only
when overriding defaults; never commit secrets.
