# ToolsDice

ToolsDice is a privacy-first collection of browser utilities. The Thai UI is
selected by default; the custom language menu can switch to English. Thai uses
Sarabun and English uses Poppins. The Classic theme starts with a light cream
palette, and users can choose Dark, Exclusive, Matcha, or Volcano from the
custom theme menu. Text and files are processed in the browser and are not sent
to the API or saved as editor content.

Find a tool with expandable search or browse one of the nine categories. The
overview highlights favorites and does not track recently used tools. Favorite,
language, and theme preferences stay in browser storage; Checklist items stay
in page memory until the page closes.

The catalog has 70 routes across PDF, Text, Images, Developer, Converters,
Data, Generators, Date & Time, and Calculators. The 90 source capabilities are
covered by 87 local capabilities through shared routes and modes. PDF tasks are
separate routes shown in the PDF category and sidebar; page reordering, rotation,
and deletion share the Manage PDF Pages tool. Three
features that require an API or remote storage are excluded. See the
[feature coverage matrix](./docs/feature-coverage.md) and its machine-readable
source in [tool-coverage.ts](./frontend/src/lib/tool-coverage.ts).

## Get started

```bash
bun install
bun run dev
```

The frontend runs at `http://localhost:5173` and the API at
`http://localhost:3000`. The API is used only for health checks and public
runtime configuration.

## Validate

```bash
bun run typecheck
bun run lint
bun run test
bun run build
bun run test:e2e
```

## Docker

```bash
docker compose up --build
```

Then open `http://localhost:8080`. See [AGENTS.md](./AGENTS.md) for development
conventions and [the youth UX desk research](./docs/youth-ux-research.md) for
research sources, limitations, and the design guidance applied to the product.
