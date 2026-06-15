# The Qubits — Database-Backed Quantum Computing Blog

**Date:** 2026-06-15
**Status:** Approved (design)

## Summary

`the-qubits` is currently a polished, quantum-computing-themed editorial UI built as
a static Vite + React SPA. The visual design is complete, but it is **not a blog**:
all content is hardcoded inside components, there is no data model, and every
"More" / "Next" link points to a single hardcoded article page.

This project restructures the app into a **real, database-backed blog** while keeping
the existing UI and visual design intact. Posts are stored as **markdown in
Postgres (hosted on Railway)**, served by a new **Express API**, and **fetched at
runtime** by the React frontend.

### Goals
- Keep the existing UI/visual design working — same components, markup, and CSS.
- Introduce a data layer so the blog is driven by real, multiple posts.
- Store post bodies as markdown in Postgres on Railway.
- Fetch posts from a live API at runtime (edit DB → see changes without a rebuild).
- Wire **all navigational links** to real routes/posts.
- Author 12 full quantum-computing articles across 4 categories.

### Non-Goals
- No CMS / admin UI for authoring (content is seeded; DB edits are manual for now).
- No authentication, comments, search, or pagination beyond a simple `limit`.
- No redesign — decorative controls (Save / Fav / Share / Close) remain visual-only.

## Architecture

### Repo shape
```
/                         ← existing Vite/React frontend (visually unchanged)
  src/
    api/posts.js          ← fetch helpers + hooks (new)
    pages/                ← HomePage, ArticlePage (made data-driven)
    components/           ← same markup/CSS, now accept props
  vite.config.js          ← add dev proxy /api → Express
/server                   ← Express API (new)
  index.js                ← app entry; serves /api + built dist/ in prod
  routes/posts.js         ← post routes
  db.js                   ← Prisma client wrapper
  prisma/
    schema.prisma         ← Post model
    seed.js               ← upserts 12 articles by slug (idempotent)
  content/                ← 12 markdown article sources used by seed.js
docs/superpowers/specs/   ← this spec
```

### Components / responsibilities
- **Express server (`/server`)** — REST API over Postgres; in production also serves
  the built frontend (`dist/`). Single Railway service, single domain, no prod CORS.
- **Prisma** — schema, migrations, and a typed seed script. Chosen over raw `pg` for
  repeatable migrations and clean seeding of 12 articles.
- **Postgres (Railway)** — single `Post` table, markdown bodies.
- **Frontend data layer (`src/api/posts.js`)** — native `fetch` helpers plus small
  hooks (`useHome`, `usePosts`, `usePost`) returning `{ data, loading, error }`. No new
  data-fetching dependency. There is no client cache (react-query was rejected), so
  back/forward navigation re-fetches; acceptable at this scale and noted in Risks.
- **react-markdown** — renders the markdown body on the article page.

### Deployment topology
Single Railway service running Express. Express registers, **in this order**:
1. `/api/*` route handlers;
2. static middleware for the built `dist/` (assets);
3. a **catch-all `app.get('*', …)` that returns `dist/index.html`** for any remaining
   path, so client-side routes (`/article/:slug`) survive a refresh or direct hit
   instead of returning Express's 404.

Ordering is load-bearing: the catch-all is registered **last** and must not match
`/api/*` (which is handled in step 1). Postgres is a Railway plugin. Provisioning +
deploy handled via the `use-railway` skill at implementation time: provision Postgres,
set `DATABASE_URL`, deploy, run `prisma migrate deploy` (which includes the raw-SQL
partial-index migration) + seed.

## Data Model

### `Post`
| Field           | Type           | Notes                                                          |
|-----------------|----------------|----------------------------------------------------------------|
| `id`            | serial PK      |                                                                |
| `slug`          | text unique    | URL slug, e.g. `decoherence-silent-killer`                     |
| `title`         | text           | Article title                                                  |
| `excerpt`       | text           | Short summary; used in Hero subtext / feed descriptions        |
| `bodyMd`        | text           | Full markdown body                                             |
| `author`        | text           | e.g. "Dr. Aris Thorne"                                         |
| `readMinutes`   | int            | Duration in minutes; formatted in the view (e.g. → "08 mins") |
| `complexity`    | `Complexity`   | enum: `Entry`, `Mid`, `High` (rendered as "… Tier")            |
| `category`      | `Category`     | enum: `Hardware`, `Algorithms`, `Theory`, `Cryptography`       |
| `accent`        | `Accent`       | enum of CSS color tokens (below); themes the card/links        |
| `heroImage`     | text           | image URL                                                      |
| `codeNumber`    | int            | the editorial reference number shown in UI (e.g. 42, 38)       |
| `featured`      | boolean        | marks the post shown in the Hero pane (default `false`)        |
| `publishedAt`   | timestamptz    | participates in the total order `(publishedAt DESC, id DESC)`  |

**Enums fail loud, not silent.** `category`, `complexity`, and `accent` are Prisma
`enum`s (Postgres native enums), not free text. An invalid value is rejected at write
time rather than producing an empty filter view (bad `category`) or an undefined CSS
custom property and an unstyled element (bad `accent`). `readMinutes` is an integer so
it can be compared/sorted; the "NN mins" presentation lives in the view layer only.

**`Accent` enum values** map 1:1 to existing CSS color tokens used in the UI:
`purple`, `teal`, `yellow`, `orange`, `pink`, `blueLight`, `blueVibrant`
(→ `--p-purple`, `--p-teal`, …). Each card/link keeps its colored styling, now driven
per-post instead of by DOM position.

**Theory pane source:** the Theory pane features the most recent post with
`category = Theory` under the total order. The bespoke superposition SVG illustration
stays hardcoded in the component; only the title/excerpt/link are data-driven.

### `featured` invariant — corrected
The intended state is **one** featured post, but this is enforced as **"at most one,"**
not "exactly one":
- **At most one** is enforced by a **partial unique index**
  `CREATE UNIQUE INDEX … ON "Post" (featured) WHERE featured = true`. Prisma Schema
  cannot express partial/filtered indexes for PostgreSQL (that feature is SQL Server
  only), so this index is authored as **raw SQL in a manual migration**, not in
  `schema.prisma`.
- **Minimum one is not enforceable** by a unique constraint (it permits zero rows).
  Guarantees instead come from two places: (a) the **seed sets exactly one**
  `featured = true`; (b) the **`/api/home` `featured` fallback** returns the first post
  in the total order when none is flagged, so the Hero never renders empty while ≥1
  post exists. The spec deliberately accepts the zero-featured edge case at the storage
  layer and absorbs it at the API layer rather than via a trigger.

## API

Base path `/api`. JSON responses. No CORS middleware: in development the browser
talks to the Vite origin and Vite proxies `/api` to Express server-side; in production
a single service serves both. There is no cross-origin browser request in either case.

| Method | Path                        | Query                              | Returns                                       |
|--------|-----------------------------|------------------------------------|-----------------------------------------------|
| GET    | `/api/home`                 | —                                  | `{ featured, theory, recent[] }`              |
| GET    | `/api/posts`                | `category`, `exclude`, `limit`     | `Post[]` (ordered by total order, below)      |
| GET    | `/api/posts/:slug`          | —                                  | `{ post, prev, next }`                         |
| GET    | `/api/posts/:slug/related`  | `limit` (default 3)                | `Post[]` (same category, excludes self)       |

### `GET /api/home` — the composed HomePage payload
Returns the three pieces the default HomePage needs in **one round trip**, so the
client avoids a fetch waterfall and the server (not the client) owns the exclusion set:
- `featured` — the post with `featured = true`. **Fallback:** if no post is featured
  (the storage layer permits zero — see Data Model invariant), return the first post in
  the total order. Never null while ≥1 post exists.
- `theory` — the most recent `category = "Theory"` post (total order). May be null.
- `recent` — recent posts in total order, **excluding the `featured` and `theory`
  slugs server-side**, capped at a default limit. Resolves the two-post de-duplication
  the client cannot express with a single exclusion.

### List, single, related
- `GET /api/posts` backs the **category-filtered feed** (tag pills → `/?category=`).
  - `category` — validated against the category enum; invalid → `400`.
  - `exclude` — **accepts multiple slugs** (repeated param or comma-separated); parsed
    into a set. Used to keep the still-pinned Hero/Theory posts out of a filtered feed.
  - `limit` — coerced to integer and **clamped to `[1, 50]`**; invalid → `400`.
- `GET /api/posts/:slug` returns the post plus `prev`/`next` adjacency.
- `GET /api/posts/:slug/related` returns same-category posts excluding self.

### Total order and adjacency
All ordering uses the **total order `(publishedAt DESC, id DESC)`**. `publishedAt`
alone is not unique and would make ordering and `prev`/`next` non-deterministic on tied
timestamps. `prev`/`next` are the rows immediately adjacent to `:slug` in this order
(`null` at the ends), each minimal `{ slug, title }`.
**Implementation:** a single parameterized `$queryRaw` using
`LAG(slug) OVER (ORDER BY published_at DESC, id DESC)` and the matching `LEAD`. Prisma
Client has no window-function API, so adjacency is *not* done via `findFirst`; raw SQL
keeps it to one round trip and one consistent ordering.

### Payload shape and errors
- `bodyMd` is returned **only** by `GET /api/posts/:slug` (`post.bodyMd`). The list,
  `related`, `home.recent`, `home.featured`, `home.theory`, and `prev`/`next` payloads
  **omit `bodyMd`** to keep responses light. (`home.featured`/`home.theory` carry the
  fields the panes render: title, excerpt, image, accent, slug, codeNumber.)
- `404` (JSON `{ error }`) for unknown slug; `400` (JSON `{ error }`) for invalid
  `category`/`limit`; `500` (JSON `{ error }`) on unexpected failure. No silent `[]`
  for invalid input.

## Frontend Behavior

### Routes
- `/` — HomePage. Reads optional `?category=` to filter the Knowledge feed.
- `/article/:slug` — ArticlePage.
- Unknown slug → on-brand "not found" message with a link home.

### Data flow
- **HomePage (default)** — one call to `GET /api/home`, giving `{ featured, theory,
  recent }`. No client-side fetch waterfall, no client-side exclusion juggling.
- **HomePage (filtered, `?category=X`)** — Hero and Theory panes stay pinned to
  `home.featured`/`home.theory`; only the feed re-queries
  `GET /api/posts?category=X&exclude=<featured>,<theory>&limit=N` so the pinned posts
  do not reappear in their own category.
- **ArticlePage** — `GET /api/posts/:slug` (`{ post, prev, next }`) plus
  `GET /api/posts/:slug/related`. Adjacency is precomputed server-side.

### Components (same markup + CSS, now data-driven)
- **HeroPane** — receives `home.featured`. Renders title, excerpt (subtext), and hero
  image; the "Next" pill links to `/article/:slug`. The "433 QBs" data lockup and Save
  icon remain decorative/static.
- **TheoryPane** — receives `home.theory` (may be null → pane renders its static
  fallback copy). Renders title/excerpt and links its "Next" pill to that article.
  Superposition SVG unchanged. "Fav" stays decorative.
- **KnowledgePane** — receives `home.recent` (or the filtered list), maps to
  `FeedItem`s with real `/article/:slug` links. Tag pills (Hardware / Algorithms /
  Cryptography) link to `/?category=<name>`.
- **FeedItem** — `href` becomes a real `Link` to `/article/:slug`; uses post `accent`.
- **RelatedCard** — real `Link` to `/article/:slug` (already prop-driven for color).
- **ArticlePage** — renders `bodyMd` via react-markdown; meta (author, `readMinutes`
  formatted as "NN mins", `complexity` formatted as "… Tier") from the row; Related
  cards from `/related`; Prev/Next pills wired to `prev`/`next`. The scroll-driven
  reading progress bar is retained unchanged.

### Loading & error states
Minimal, on-brand states for HomePage and ArticlePage (a quiet "loading…" and a
short error message with retry/home link). Unknown slug → on-brand "not found" with a
link home. No skeleton screens in this iteration.

### Markdown rendering — concrete, since vanilla react-markdown cannot reproduce the bespoke DOM
`bodyMd` is rendered with `react-markdown` (+ `remark-gfm`), with **raw HTML disabled**
(react-markdown's default — `rehype-raw` is intentionally not added). Plain markdown
emits `<p>`/`<img>`, which do **not** match the existing `.dropcap` span
(`ArticlePage.css:87`) or the `.immersive-break > img + .break-overlay` structure
(`ArticlePage.css:98–126`). Two concrete mechanisms bridge that gap:
- **Drop cap:** retire the `.dropcap` span. Add a CSS rule targeting markdown output —
  `.article-body > p:first-of-type::first-letter { … }` mirroring the existing
  `.dropcap` declarations (float, size, `--p-pink`). `::first-letter` is the only
  mechanism that applies to a markdown-generated `<p>`.
- **Immersive break:** supply a custom `components.img` renderer to react-markdown that
  wraps the image in `.immersive-break` and renders an optional `.break-overlay`
  caption from the markdown image **title** (`![alt](url "Caption heading")`). Authors
  get the styled break from standard markdown image syntax; no MDX, no raw HTML.

## Content

12 full markdown articles, distributed across categories, including every title the
current UI already references plus new posts to exceed 10:

- **Hardware (3):** Decoherence: the silent killer of qubits (featured); Cryogenic
  control circuits; Topological qubits.
- **Algorithms (3):** Shor's algorithm in practice; Grover's search; Noisy
  Intermediate-Scale Quantum (NISQ).
- **Theory (3):** Superposition & the Bloch sphere (Theory feature); Entanglement and
  non-locality; Quantum teleportation.
- **Cryptography (3):** Phase-flip error correction; Surface-code error-correction
  protocols; Post-quantum cryptography.

This totals 12 and covers every title the current UI already references (Decoherence,
Shor's algorithm, Topological qubits, error-correction protocols, Cryogenic control
circuits, Phase-flip error correction, NISQ). Each article has a realistic author,
read time, complexity, accent color, hero image URL, and code number.

## Configuration

- **Frontend:** `VITE_API_URL` (defaults to `/api`; Vite dev proxy forwards to Express).
- **Backend:** `DATABASE_URL` (Railway Postgres), `PORT` (Railway-provided).
- `.env.example` documents both. Real secrets never committed.

## Dev Workflow

- `npm run dev` runs Vite + Express concurrently (`concurrently`). Vite proxies
  `/api` → `http://localhost:<PORT>` so there is no local CORS.
- `npm run db:migrate` (prisma migrate dev) and `npm run db:seed` for local Postgres.
- `npm run build` builds the frontend; `npm start` runs Express serving `dist/` + API.

## Testing

- **Backend (API):** integration tests with `supertest` against a real Postgres test
  database. **Isolation:** each test runs inside a transaction that is rolled back on
  teardown (or, failing that, `TRUNCATE … RESTART IDENTITY` between tests) so tests are
  order-independent and non-flaky; the test DB URL is separate from dev/prod. Cases:
  - `/api/home` — returns `featured`/`theory`/`recent`; `recent` excludes the featured
    and theory slugs; **`featured` fallback** kicks in when no row is flagged.
  - `/api/posts` — `category` filter; multi-`exclude` (CSV + repeated); `limit`
    clamping; `400` on invalid `category`/`limit`.
  - `/api/posts/:slug` — payload includes `bodyMd`; `prev`/`next` adjacency under the
    total order, **including a tie test** (two rows sharing `publishedAt` resolve
    deterministically by `id`); `404` on unknown slug.
  - `/api/posts/:slug/related` — same-category, excludes self, omits `bodyMd`.
  - **Payload discipline:** assert `bodyMd` is present only on the single-post endpoint.
- **Frontend:** `vitest` + React Testing Library with mocked `fetch` — `useHome`/
  `usePost`/`usePosts` hooks (loading → data / error), `FeedItem`/`RelatedCard` render
  real links, ArticlePage renders markdown content + formatted meta, and the custom
  `components.img` mapping produces the `.immersive-break` structure from image syntax.
- Tests written test-first per the test-driven-development workflow.

## Risks / Open Questions

- **Railway provisioning** requires account access during implementation; if
  unavailable, fall back to a local Postgres for development and defer deploy.
- **Markdown safety:** content is first-party (seeded). Raw HTML stays disabled in
  react-markdown (its default; `rehype-raw` not added) so the body cannot inject markup
  if content later becomes user-supplied.
- **Featured invariant:** enforced as **at most one** via a raw-SQL partial unique
  index (Prisma Schema cannot express partial indexes for Postgres). The *minimum*-one
  guarantee is not a DB constraint — it comes from the seed flagging one post and the
  `/api/home` fallback to the first post in the total order. See "`featured`
  invariant — corrected" under Data Model.
- **No client cache:** runtime fetch without react-query means repeated navigation
  re-fetches. The composed `/api/home` endpoint limits the HomePage to one request;
  per-article pages are two. Acceptable for a 12-post blog; revisit if content grows.
- **Seed idempotency:** the seed **upserts on `slug`** so `prisma migrate deploy` +
  seed can re-run without unique-constraint failures or duplicate rows.
