# ToolsDice

ToolsDice is a privacy-first collection of browser utilities. The Thai UI is
selected by default; the custom language menu can switch to English. Thai uses
Sarabun and English uses Poppins. The Classic theme starts with a light cream
palette, and users can choose Dark, Exclusive, Matcha, or Volcano from the
custom theme menu. Text, files, and calculator inputs stay in the browser. The
API Request Builder sends a request directly to the endpoint the user enters
only after they press Send; it never proxies request data through ToolsDice.

Find a tool with expandable search or browse one of the eight active categories.
The overview highlights favorites and does not track recently used tools.
Favorite, language, and theme preferences stay in browser storage; editor
content and selected files are never persisted.

The catalog has 52 routes across PDF, Text, Images, Developer, Converters,
Generators, Date & Time, and Calculators. The Data category is temporarily
disabled. The source matrix tracks 90 source capabilities, with 59 mapped to
the active catalog across shared routes and modes. See the
[feature coverage matrix](./docs/feature-coverage.md) and its machine-readable
source in [tool-coverage.ts](./frontend/src/lib/tool-coverage.ts).

The Developer category is ordered API Request Builder, JWT Decoder, Regex
Tester, and Code Formatter. The formatter supports JSON, JavaScript, HTML,
CSS, and SQL; format and minify are modes of the same tool. Currency conversion
uses a rate the user enters because it does not fetch live market data. Loan,
savings, and trip-cost estimates are included alongside bill splitting and BMI.
PDF tools have separate routes; page reordering, rotation, and deletion share
the Manage PDF Pages tool.

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

## Deploy to Vercel

Deploy this Bun workspace as two Vercel Projects connected to the same Git
repository, following the Portfolio deployment layout:

1. Create the frontend project with Root Directory `frontend`, the Vite
   framework preset, Build Command `bun run build`, and Output Directory
   `dist`. Keep access to workspace files outside the Root Directory enabled;
   the frozen Bun lockfile is at the repository root.
2. Create the backend project with Root Directory `backend`. Its
   `vercel.json` selects the Bun `1.x` runtime, and `src/index.ts` exports the
   Elysia app as a Vercel Function. Deploy the backend first.
3. Set the backend Production environment variable `ALLOWED_ORIGINS` to the
   exact production origin of the frontend, such as `https://your-frontend.vercel.app`.
   The local server still listens on `API_PORT`; Vercel invokes the app as a
   function.
4. Set the frontend Production environment variable `VITE_API_BASE` to
   `https://your-backend.vercel.app/api`, then redeploy the frontend. The
   public config and health routes will be available at `/api/v1/config` and
   `/api/v1/health` on the backend host.
5. Verify the production homepage, a direct `/tools/api-client` visit, the
   runtime config, and the API Builder's explicit-send behavior. The API
   Builder calls user-entered endpoints directly from the browser, so those
   endpoints must allow browser CORS requests.

The Vercel project settings and production environment variables are not
stored in this repository. The frontend and backend deployment settings live
in `frontend/vercel.json` and `backend/vercel.json` respectively.
