# ToolsDice agent guide

## Product and privacy

ToolsDice is a Thai-default, privacy-first browser utility suite with English
and Thai UI. Text, dates, PDF files, image files, hashes, and calculator inputs
are processed in the browser. Never upload tool inputs, add analytics, persist
editor contents or selected files, or log payloads.

API Request Builder is the one intentional network tool. It sends the user's
request directly to the URL they enter only after they press Send. Do not proxy
its URL, headers, credentials, body, or response through the ToolsDice backend.
Do not save requests or credentials in browser storage. The API server exposes
health and public runtime configuration only.

Favorites, language, and theme preferences are the only app preferences saved
in browser storage. Recent tools are not tracked. Request fields and all other
tool inputs stay in page memory and disappear when the page closes. Copying,
downloading, and sending a request happen only after the user chooses the
matching action.

## Architecture

- frontend/: React + Vite + TypeScript + Tailwind CSS. React Router owns tool
  URLs, TanStack Query owns public runtime config, and local component state
  owns tool inputs.
- frontend/src/lib/tool-registry.ts is the source of truth for 52 stable tool
  routes, labels, categories, keywords, and icons.
- frontend/src/lib/tool-engines.ts is the public barrel for pure processing
  functions. Domain engines live in frontend/src/lib/tool-engines/.
- frontend/src/pages/ToolWorkspace.tsx routes each tool to its panel. Text,
  PDF, image, developer, converter, generator, and calculation panels load
  lazily. Import heavy libraries from inside the relevant panel or operation.
- frontend/src/pages/TextTools.tsx contains the text-tool interface and calls
  local engines without persisting input. Other local panels live in
  frontend/src/pages/tools/.
- frontend/src/lib/tool-coverage.ts maps all 90 source catalog entries to an
  active route and mode, or records why the source entry is paused or omitted.
  It keeps 59 source capabilities in the current catalog.
- backend/: Bun + Elysia. It exposes health and public runtime config only.
  `src/index.ts` is the Vercel entry point; `src/local-server.ts` owns the local
  and container HTTP listener.
- Root: Bun workspaces and Docker Compose. Production containers serve the
  frontend with nginx and proxy /api to Elysia.

Vercel deploys this workspace as two Projects with Root Directories
`frontend/` and `backend/`. Keep SPA rewrites and browser security headers in
`frontend/vercel.json`, and Bun runtime selection in `backend/vercel.json`.
The frontend Production environment needs `VITE_API_BASE` set to the backend
origin plus `/api`; the backend Production environment needs `ALLOWED_ORIGINS`
set to the exact frontend origin.

The language and theme providers and bilingual tool catalog live in
frontend/src/lib. Thai is the default UI language and uses Sarabun; English
uses Poppins. The overview links to eight category pages. A category page lists
its tools, and each tool has its own workspace.

## Tool catalog and conventions

The catalog has 52 routes in eight categories: PDF, Text, Images, Developer,
Converters, Generators, Date & Time, and Calculators. The Data category is
temporarily disabled, and none of its tools should appear in navigation,
search, favorites suggestions, or runtime config.

The Developer category order is API Request Builder, JWT Decoder, Regex Tester,
and Code Formatter. The API client supports query params, headers,
authentication, JSON/raw/form bodies, response inspection, and cURL copying.
The Code Formatter groups JSON, JavaScript, HTML, CSS, and SQL; formatting and
supported minification are modes within that one route.

The Converters order is Currency Converter, Buddhist/Common Era, Unit
Converter, Number Base Converter, and Base64. Currency conversion uses a rate
entered by the user and never fetches a live quote.

Generators begin with QR Code, Random Number, and Password, followed by Random
Picker, Hash & UUID, Random String, and Lorem. Date & Time contains Date
Difference then Timezone Converter. Calculators are Split Bill, BMI/TDEE, Loan
Payment, Compound Savings, and Trip Fuel Cost.

The Text category order is Fix Mistyped Language, Find and Replace, Text Diff,
Thai Baht to Words, Reverse Text, Word & Character Counter, and Remove
Duplicate Lines.

- Add every tool to tool-registry.ts with a stable slug, English and Thai
  labels, descriptions, category, search keywords, and Lucide icon. Update the
  runtime config allowlist and coverage matrix when catalog routes change.
- Keep deterministic processing local in domain engines. Return actionable
  errors in the selected language; do not use eval or render user input as HTML.
- Markdown Preview must render a parsed safe block model if it is reintroduced.
  Only http and https links may become anchors; raw HTML and unsafe URL schemes
  stay as text.
- Thai money reading accepts decimal currency up to satang precision and
  rejects malformed or over-precise input with a local actionable error.
- Validate file type, size, and page selection in the browser before processing.
- Use the shared ChoiceMenu component for custom dropdowns in tool panels.
  Opening one menu closes any other open menu. Keep menu popovers inside the
  visible viewport and prevent them from covering neighboring controls.
- Do not add an API endpoint for tool payloads. Runtime configuration must stay
  independent of user input.

## Visual system and UX

- The default Classic theme is a light, minimal cream palette with dark
  readable text, warm neutral borders, and terracotta primary actions. The
  custom theme menu offers Classic, Dark, Exclusive, Matcha, and Volcano; each
  theme updates surfaces, text, controls, borders, and category accents.
- Use muted category accents consistently: rose for PDF and images, cyan for
  text, indigo for Developer and Generators, amber for Converters and
  Calculators, and sky for Date & Time. Labels and structure must still
  communicate grouping without color.
- Small 3D ambient shapes and homepage electron orbits are decorative and
  non-interactive. They run by default and stop under prefers-reduced-motion.
- Normal text must meet WCAG AA contrast (4.5:1); large text and meaningful UI
  boundaries must meet at least 3:1. Keep layouts usable at 320 CSS pixels and
  preserve keyboard focus and touch targets.
- Prioritize expandable search, favorites, and eight category links on the
  overview. Search opens from its icon and collapses when focus leaves. Do not
  show a recent-tools section. Keep each workspace focused on inputs, output,
  and the next action.
- Tool cards are one large link target. Keep favorite controls above the link
  overlay so both actions remain distinct and keyboard accessible.
- Keep routes responsive without oversized fixed-width content. Keep at least
  16px page gutters and reflow workspaces at narrow container widths. Use the
  mobile drawer, compact horizontal tool cards, and a neutral black/transparent
  drawer scrim. Hide the sidebar scrollbar except while scrolling or
  interacting with the sidebar. Give overview and category pages additional
  responsive inset spacing inside the main page gutter.
- Use restrained translucent glass surfaces with neutral borders and blur. The
  sidebar starts directly beneath the top bar without a duplicate brand header.
- The top bar includes an icon-and-text Portfolio action linking to
  https://www.dalalight.online/, a custom Thai/English language dropdown, and a
  custom five-theme dropdown. Keep Portfolio at the far right and put the
  responsive sidebar control beside the ToolsDice brand. Sidebar category rows
  expand their tools and are not category-page links.
- Use the selected product mark at
  https://yqkdvluuiuxbnekwrcou.supabase.co/storage/v1/object/public/pics/icon/logo2.png
  in the header and page metadata.
- Use docs/youth-ux-research.md as desk research, not as a substitute for
  testing with Thai ToolsDice users.

## Validation

- Install: bun install
- Development (both apps): bun run dev
- Development (one app): bun run dev:api or bun run dev:web
- Type check: bun run typecheck
- Lint: bun run lint
- Unit/API tests, including catalog coverage: bun run test
- Production build: bun run build
- Browser smoke tests: bun run test:e2e
- Containers: docker compose up --build

For changes to tool processing or layouts, run typecheck, lint, unit/API tests,
build, and browser smoke tests. Browser checks should include direct tool
routes, runtime config, keyboard focus, reduced motion, privacy behavior, and a
320px viewport when relevant.

Local Bun is required unless Docker is used. Copy .env.example to .env only
when overriding defaults; never commit secrets.
