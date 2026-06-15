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
    seed.js               ← inserts 12 articles
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
  hooks (`usePosts`, `usePost`) returning `{ data, loading, error }`. No new
  data-fetching dependency.
- **react-markdown** — renders the markdown body on the article page.

### Deployment topology
Single Railway service running Express. Express serves `/api/*` and, in production,
the static `dist/` build. Postgres is a Railway plugin. Provisioning + deploy handled
via the `use-railway` skill at implementation time: provision Postgres, set
`DATABASE_URL`, deploy, run `prisma migrate deploy` + seed.

## Data Model

### `Post`
| Field        | Type        | Notes                                                        |
|--------------|-------------|--------------------------------------------------------------|
| `id`         | serial PK   |                                                              |
| `slug`       | text unique | URL slug, e.g. `decoherence-silent-killer`                   |
| `title`      | text        | Article title                                               |
| `excerpt`    | text        | Short summary; used in Hero subtext / feed descriptions     |
| `bodyMd`     | text        | Full markdown body                                          |
| `author`     | text        | e.g. "Dr. Aris Thorne"                                      |
| `readTime`   | text        | e.g. "08 mins"                                              |
| `complexity` | text        | e.g. "High Tier"                                            |
| `category`   | text        | one of: Hardware, Algorithms, Theory, Cryptography          |
| `accent`     | text        | color token name (e.g. "purple") to theme the card/links    |
| `heroImage`  | text        | image URL                                                   |
| `codeNumber` | int         | the editorial reference number shown in UI (e.g. 42, 38)    |
| `featured`   | boolean     | marks the post shown in the Hero pane (exactly one true)    |
| `publishedAt`| timestamptz | drives ordering, Prev/Next, "recent" lists                  |

**`accent` values** map to existing CSS color tokens used in the UI
(`purple`, `teal`, `yellow`, `orange`, `pink`, `blue-light`, `blue-vibrant`), so each
card/link keeps its colored styling — now driven per-post instead of by position.

**Theory pane source:** the Theory pane features one designated post. Selection rule:
the most recent post with `category = "Theory"` (deterministic via `publishedAt desc`).
The bespoke superposition SVG illustration stays hardcoded in the component.

## API

Base path `/api`. JSON responses. CORS enabled in development only.

| Method | Path                        | Query                         | Returns                                  |
|--------|-----------------------------|-------------------------------|------------------------------------------|
| GET    | `/api/posts`                | `category`, `exclude`, `limit`| `Post[]` (ordered `publishedAt desc`)    |
| GET    | `/api/posts/:slug`          | —                             | `{ post, prev, next }`                    |
| GET    | `/api/posts/:slug/related`  | `limit` (default 3)           | `Post[]` (same category, excludes self)  |

- List items omit `bodyMd` (lighter payload); the single-post endpoint includes it.
- `prev`/`next` are the adjacent posts by `publishedAt` (null at the ends), each a
  minimal `{ slug, title }`.
- `404` for unknown slug; `500` with a JSON `{ error }` body on failure.

## Frontend Behavior

### Routes
- `/` — HomePage. Reads optional `?category=` to filter the Knowledge feed.
- `/article/:slug` — ArticlePage.
- Unknown slug → on-brand "not found" message with a link home.

### Components (same markup + CSS, now data-driven)
- **HeroPane** — receives the `featured` post. Renders title, excerpt (subtext), and
  hero image; the "Next" pill links to `/article/:slug`. The "433 QBs" data lockup and
  Save icon remain decorative/static.
- **TheoryPane** — receives the featured Theory post; renders title/excerpt and links
  its "Next" pill to that article. Superposition SVG unchanged. "Fav" stays decorative.
- **KnowledgePane** — fetches recent posts (excluding the Hero + Theory features),
  maps to `FeedItem`s with real `/article/:slug` links. Tag pills (Hardware /
  Algorithms / Cryptography) link to `/?category=<name>` and filter the feed.
- **FeedItem** — `href` becomes a real `Link` to `/article/:slug`; uses post `accent`.
- **RelatedCard** — real `Link` to `/article/:slug` (already prop-driven for color).
- **ArticlePage** — fetches `{ post, prev, next }` by slug; renders `bodyMd` via
  react-markdown; meta (author, read time, complexity) from the row; Related cards
  from `/related`; Prev/Next pills wired to `prev`/`next`. The scroll-driven reading
  progress bar is retained unchanged.

### Loading & error states
Minimal, on-brand states for HomePage and ArticlePage (a quiet "loading…" and a
short error message with retry/home link). No skeleton screens in this iteration.

### Markdown rendering
`bodyMd` rendered with `react-markdown` (+ `remark-gfm` for tables/lists). The first
paragraph keeps the existing drop-cap treatment via existing `.article-body` CSS.
Inline images in markdown reuse `.immersive-break` styling where authored.

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

- **Backend (API):** integration tests with `supertest` against a test database —
  list (with filters), single (incl. prev/next), related, and 404 behavior.
- **Frontend:** `vitest` + React Testing Library with mocked `fetch` — `usePost`/
  `usePosts` hooks (loading → data / error), and that `FeedItem`/`RelatedCard` render
  real links. A render test that ArticlePage shows markdown content + meta.
- Tests written test-first per the test-driven-development workflow.

## Risks / Open Questions

- **Railway provisioning** requires account access during implementation; if
  unavailable, fall back to a local Postgres for development and defer deploy.
- **Markdown safety:** content is first-party (seeded), so raw HTML in markdown is
  disabled in react-markdown to avoid injection if content later becomes user-supplied.
- **Featured invariant:** exactly one post has `featured = true`; enforced by the seed
  and a partial unique index.
