# Database-Backed Quantum Blog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the static `the-qubits` Vite/React UI into a real, database-backed quantum-computing blog (Postgres on Railway + Express API + runtime fetch) while keeping the existing UI and visual design intact.

**Architecture:** A single repo with the existing Vite/React frontend at the root and a new Express API under `/server`. Posts live as markdown in Postgres, accessed via Prisma. In dev, Vite proxies `/api` to Express; in production a single Railway service serves both `/api/*` and the built `dist/`. The frontend fetches posts at runtime via small `fetch`-based hooks; all navigational links resolve to real `/article/:slug` routes.

**Tech Stack:** React 19, react-router-dom 7, Vite 8, Express 4, Prisma 5 + Postgres, react-markdown 9 + remark-gfm 4, gray-matter (seed), Vitest + Testing Library + supertest, concurrently.

**Source spec:** `docs/superpowers/specs/2026-06-15-quantum-blog-restructure-design.md`

---

## File Structure

**Backend (new, under `/server` and `/prisma`):**
- `prisma/schema.prisma` — `Post` model + `Category`/`Complexity`/`Accent` enums
- `prisma/migrations/**` — generated migration + manual partial-unique-index SQL
- `prisma/seed.js` — `loadPosts()` (parse `server/content/*.md`) + idempotent upsert
- `server/content/*.md` — 12 articles with frontmatter
- `server/db.js` — Prisma client singleton
- `server/lib/validate.js` — query-param parsing/validation (pure)
- `server/lib/queries.js` — data access (card select, home, list, single, adjacency, related)
- `server/routes/posts.js` — Express router mapping endpoints → queries + validation
- `server/app.js` — builds Express app (mounts `/api`, static + SPA fallback); no `listen`
- `server/index.js` — loads env, calls `app.listen`
- `server/test/setup.js` — load `.env.test`, reset DB per test
- `server/test/factory.js` — `resetDb()`, `createPost(overrides)`

**Frontend (modify existing + add):**
- `src/api/client.js` — `apiFetch()` low-level wrapper (throws `HttpError` with `.status`)
- `src/api/posts.js` — endpoint functions: `getHome`, `getPosts`, `getPost`, `getRelated`
- `src/hooks/useAsync.js` — generic `{ data, loading, error }` hook
- `src/hooks/posts.js` — `useHome`, `usePosts`, `usePost`, `useRelated`
- `src/lib/format.js` — `formatReadTime`, `formatComplexity`, `accentVar`, `formatCode`
- `src/components/Markdown.jsx` — react-markdown wrapper (immersive-break `img`, unwrap)
- `src/components/Loading.jsx`, `src/components/ErrorState.jsx` — shared states
- `src/components/HeroPane.jsx`, `TheoryPane.jsx`, `KnowledgePane.jsx`, `FeedItem.jsx`, `RelatedCard.jsx` — made data-driven
- `src/pages/HomePage.jsx`, `src/pages/ArticlePage.jsx` — data-driven + states
- `src/pages/ArticlePage.css` — add `::first-letter` drop cap rule
- `src/App.jsx` — route `/article/:slug`
- `vite.config.js` — dev proxy + Vitest (client) config
- `vitest.server.config.js` — Vitest (server, node env) config
- `package.json` — deps + scripts; `.env.example`; `.gitignore` (add `.env`)

**Conventions used across tasks (defined once, referenced):**
- **Total order:** `ORDER BY "publishedAt" DESC, id DESC`.
- **Card fields** (everything except `bodyMd`): `id, slug, title, excerpt, author, readMinutes, complexity, category, accent, heroImage, codeNumber, featured, publishedAt`.
- **Accent → CSS var:** `purple→--p-purple, teal→--p-teal, yellow→--p-yellow, orange→--p-orange-line, pink→--p-pink, blueLight→--p-blue-light, blueVibrant→--p-blue-vibrant`.
- **Feed limit default:** 6. **Related limit default:** 3. **`limit` clamp:** `[1, 50]`.
- **Dev ports:** Vite 5173, Express 3001.

---

## Task 1: Install dependencies and base scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add runtime + dev dependencies**

Run:
```bash
npm install express@^4.21.2 @prisma/client@^5.22.0 react-markdown@^9.0.1 remark-gfm@^4.0.0 dotenv@^16.4.7
npm install -D prisma@^5.22.0 vitest@^2.1.8 @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.3 @testing-library/user-event@^14.5.2 jsdom@^25.0.1 supertest@^7.0.0 gray-matter@^4.0.3 concurrently@^9.1.0 cross-env@^7.0.3
```
Expected: installs succeed; `package.json` lists the packages.

- [ ] **Step 2: Replace the `scripts` block in `package.json`**

```json
  "scripts": {
    "dev": "concurrently -n web,api -c blue,magenta \"vite\" \"npm:dev:server\"",
    "dev:server": "cross-env NODE_ENV=development node server/index.js",
    "build": "vite build",
    "start": "cross-env NODE_ENV=production node server/index.js",
    "preview": "vite preview",
    "lint": "eslint .",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "node prisma/seed.js",
    "db:test:setup": "cross-env $(grep -v '^#' .env.test | xargs) prisma migrate deploy",
    "test": "npm run test:client && npm run test:server",
    "test:client": "vitest run",
    "test:server": "vitest run -c vitest.server.config.js"
  },
  "prisma": {
    "seed": "node prisma/seed.js"
  }
```

- [ ] **Step 3: Verify install**

Run: `npm ls express @prisma/client react-markdown vitest --depth=0`
Expected: all four resolve without "missing".

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add backend, markdown, and test dependencies"
```

---

## Task 2: Environment files and gitignore

**Files:**
- Create: `.env.example`, `.env`, `.env.test`
- Modify: `.gitignore`

- [ ] **Step 1: Append env entries to `.gitignore`**

Add these lines to the end of `.gitignore`:
```
# Env
.env
.env.*
!.env.example
```

- [ ] **Step 2: Create `.env.example`**

```
# Postgres connection (Railway provides this in production)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/qubits?schema=public"
# Express port (Railway injects PORT in production)
PORT=3001
# Frontend API base (defaults to /api; only override for split deploys)
VITE_API_URL=/api
```

- [ ] **Step 3: Create `.env` (local dev) — adjust to your local Postgres**

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qubits?schema=public"
PORT=3001
```

- [ ] **Step 4: Create `.env.test` (isolated test DB)**

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qubits_test?schema=public"
PORT=3002
```

- [ ] **Step 5: Verify `.env` is ignored**

Run: `git status --porcelain | grep -E '\.env$' || echo "env ignored OK"`
Expected: prints `env ignored OK`.

- [ ] **Step 6: Commit**

```bash
git add .gitignore .env.example
git commit -m "chore: add env templates and ignore real env files"
```

---

## Task 3: Prisma schema and client

**Files:**
- Create: `prisma/schema.prisma`, `server/db.js`

- [ ] **Step 1: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Category {
  Hardware
  Algorithms
  Theory
  Cryptography
}

enum Complexity {
  Entry
  Mid
  High
}

enum Accent {
  purple
  teal
  yellow
  orange
  pink
  blueLight
  blueVibrant
}

model Post {
  id          Int        @id @default(autoincrement())
  slug        String     @unique
  title       String
  excerpt     String
  bodyMd      String
  author      String
  readMinutes Int
  complexity  Complexity
  category    Category
  accent      Accent
  heroImage   String
  codeNumber  Int
  featured    Boolean    @default(false)
  publishedAt DateTime

  @@index([publishedAt, id])
}
```

- [ ] **Step 2: Create `server/db.js` (Prisma singleton)**

```js
import { PrismaClient } from '@prisma/client'

// Single shared client; avoids exhausting connections during dev hot-reload.
const globalForPrisma = globalThis
export const prisma = globalForPrisma.__prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma
```

- [ ] **Step 3: Generate the Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" message; no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma server/db.js
git commit -m "feat: add Prisma schema (Post + enums) and client singleton"
```

---

## Task 4: Migration with partial unique index

**Files:**
- Create: `prisma/migrations/**` (generated), plus a manual migration for the partial index

**Prereq:** a local Postgres reachable at the `.env` `DATABASE_URL`, with database `qubits` created.

- [ ] **Step 1: Create the initial migration**

Run: `npx prisma migrate dev --name init`
Expected: creates `prisma/migrations/<ts>_init/migration.sql`, applies it, regenerates client.

- [ ] **Step 2: Create an empty migration for the partial index**

Run: `npx prisma migrate dev --create-only --name featured_partial_unique`
Expected: creates a new empty `migration.sql` (Prisma cannot express partial indexes for Postgres, so we author it by hand).

- [ ] **Step 3: Write the partial unique index into that migration**

Open the new `prisma/migrations/<ts>_featured_partial_unique/migration.sql` and set its contents to:
```sql
-- At most one featured post (minimum-one is guaranteed by the seed + /api/home fallback).
CREATE UNIQUE INDEX "Post_one_featured" ON "Post" ("featured") WHERE "featured" = true;
```

- [ ] **Step 4: Apply it**

Run: `npx prisma migrate dev`
Expected: applies `featured_partial_unique`; "Database schema is up to date".

- [ ] **Step 5: Verify the index exists**

Run: `npx prisma db execute --stdin <<< "SELECT indexname FROM pg_indexes WHERE tablename='Post';"`
Expected: output includes `Post_one_featured`.

- [ ] **Step 6: Commit**

```bash
git add prisma/migrations
git commit -m "feat: add Post migration with partial unique index on featured"
```

---

## Task 5: Test infrastructure (server + client configs)

**Files:**
- Create: `vitest.server.config.js`, `server/test/setup.js`, `server/test/factory.js`, `src/test/setup.js`
- Modify: `vite.config.js`

- [ ] **Step 1: Add client Vitest config + dev proxy to `vite.config.js`**

```js
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
```

- [ ] **Step 2: Create `src/test/setup.js`**

```js
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Create `vitest.server.config.js`**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['server/**/*.test.js', 'prisma/**/*.test.js'],
    setupFiles: './server/test/setup.js',
    fileParallelism: false, // share one test DB; avoid cross-file races
  },
})
```

- [ ] **Step 4: Create `server/test/setup.js`**

```js
import dotenv from 'dotenv'
import { beforeEach, afterAll } from 'vitest'
import { resetDb } from './factory.js'
import { prisma } from '../db.js'

dotenv.config({ path: '.env.test' })

beforeEach(async () => {
  await resetDb()
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

- [ ] **Step 5: Create `server/test/factory.js`**

```js
import { prisma } from '../db.js'

export async function resetDb() {
  // Truncate restarts identity so id ordering is deterministic per test.
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Post" RESTART IDENTITY CASCADE;')
}

let seq = 0
export async function createPost(overrides = {}) {
  seq += 1
  const base = {
    slug: `post-${seq}`,
    title: `Post ${seq}`,
    excerpt: `Excerpt ${seq}`,
    bodyMd: `# Post ${seq}\n\nBody.`,
    author: 'Dr. Test',
    readMinutes: 5,
    complexity: 'Mid',
    category: 'Hardware',
    accent: 'purple',
    heroImage: 'https://example.com/i.jpg',
    codeNumber: seq,
    featured: false,
    publishedAt: new Date(`2026-01-${String((seq % 27) + 1).padStart(2, '0')}T00:00:00Z`),
  }
  return prisma.post.create({ data: { ...base, ...overrides } })
}
```

- [ ] **Step 6: Create the test database and apply migrations**

Run:
```bash
createdb qubits_test 2>/dev/null || true
npm run db:test:setup
```
Expected: migrations apply to `qubits_test`; "Database schema is up to date".

- [ ] **Step 7: Sanity-check the harness with a throwaway test**

Create `server/test/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { createPost } from './factory.js'
import { prisma } from '../db.js'

describe('test harness', () => {
  it('starts each test with an empty table', async () => {
    expect(await prisma.post.count()).toBe(0)
    await createPost()
    expect(await prisma.post.count()).toBe(1)
  })
})
```

- [ ] **Step 8: Run it**

Run: `npm run test:server`
Expected: 1 passing test.

- [ ] **Step 9: Delete the smoke test and commit**

```bash
rm server/test/smoke.test.js
git add vite.config.js vitest.server.config.js server/test src/test
git commit -m "test: add client and server Vitest harness with DB reset"
```

---

## Task 6: Query-param validation (pure)

**Files:**
- Create: `server/lib/validate.js`, `server/lib/validate.test.js`

- [ ] **Step 1: Write the failing test — `server/lib/validate.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { parseCategory, parseLimit, parseExclude, ValidationError } from './validate.js'

describe('parseCategory', () => {
  it('accepts a valid category', () => {
    expect(parseCategory('Hardware')).toBe('Hardware')
  })
  it('returns undefined when absent', () => {
    expect(parseCategory(undefined)).toBeUndefined()
  })
  it('throws on invalid category', () => {
    expect(() => parseCategory('Nope')).toThrow(ValidationError)
  })
})

describe('parseLimit', () => {
  it('uses the fallback when absent', () => {
    expect(parseLimit(undefined, 6)).toBe(6)
  })
  it('clamps above 50', () => {
    expect(parseLimit('999', 6)).toBe(50)
  })
  it('clamps below 1', () => {
    expect(parseLimit('0', 6)).toBe(1)
  })
  it('throws on non-integer', () => {
    expect(() => parseLimit('abc', 6)).toThrow(ValidationError)
  })
})

describe('parseExclude', () => {
  it('returns [] when absent', () => {
    expect(parseExclude(undefined)).toEqual([])
  })
  it('splits a CSV string', () => {
    expect(parseExclude('a,b,c')).toEqual(['a', 'b', 'c'])
  })
  it('accepts a repeated-param array', () => {
    expect(parseExclude(['a', 'b'])).toEqual(['a', 'b'])
  })
  it('dedupes and drops blanks', () => {
    expect(parseExclude('a,,a,b')).toEqual(['a', 'b'])
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:server -- server/lib/validate.test.js`
Expected: FAIL — cannot import from `./validate.js`.

- [ ] **Step 3: Implement `server/lib/validate.js`**

```js
export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
    this.status = 400
  }
}

const CATEGORIES = new Set(['Hardware', 'Algorithms', 'Theory', 'Cryptography'])

export function parseCategory(raw) {
  if (raw === undefined || raw === '') return undefined
  if (!CATEGORIES.has(raw)) throw new ValidationError(`Unknown category: ${raw}`)
  return raw
}

export function parseLimit(raw, fallback) {
  if (raw === undefined || raw === '') return fallback
  if (!/^\d+$/.test(String(raw))) throw new ValidationError(`Invalid limit: ${raw}`)
  const n = Number(raw)
  return Math.min(50, Math.max(1, n))
}

export function parseExclude(raw) {
  if (raw === undefined) return []
  const parts = Array.isArray(raw) ? raw : String(raw).split(',')
  const seen = new Set()
  const out = []
  for (const p of parts) {
    const s = p.trim()
    if (s && !seen.has(s)) {
      seen.add(s)
      out.push(s)
    }
  }
  return out
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npm run test:server -- server/lib/validate.test.js`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add server/lib/validate.js server/lib/validate.test.js
git commit -m "feat: add query-param validation with clamping and CSV exclude"
```

---

## Task 7: Data access — home, list, single, related (Prisma)

**Files:**
- Create: `server/lib/queries.js`, `server/lib/queries.test.js`

- [ ] **Step 1: Write the failing test — `server/lib/queries.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { createPost } from '../test/factory.js'
import { getHomeData, listPosts, getPostBySlug, getRelated } from './queries.js'

describe('getHomeData', () => {
  it('returns featured, theory, and recent excluding those two', async () => {
    const featured = await createPost({ slug: 'feat', featured: true, publishedAt: new Date('2026-02-01Z') })
    const theory = await createPost({ slug: 'th', category: 'Theory', publishedAt: new Date('2026-01-20Z') })
    await createPost({ slug: 'r1', publishedAt: new Date('2026-01-10Z') })
    const home = await getHomeData()
    expect(home.featured.slug).toBe('feat')
    expect(home.theory.slug).toBe('th')
    expect(home.recent.map((p) => p.slug)).toEqual(['r1'])
    expect(home.featured).not.toHaveProperty('bodyMd')
  })

  it('falls back to the first post in total order when none is featured', async () => {
    await createPost({ slug: 'old', publishedAt: new Date('2026-01-01Z') })
    const newest = await createPost({ slug: 'new', publishedAt: new Date('2026-03-01Z') })
    const home = await getHomeData()
    expect(home.featured.slug).toBe(newest.slug)
  })
})

describe('listPosts', () => {
  it('filters by category, applies exclude, and limits', async () => {
    await createPost({ slug: 'h1', category: 'Hardware' })
    await createPost({ slug: 'h2', category: 'Hardware' })
    await createPost({ slug: 'a1', category: 'Algorithms' })
    const list = await listPosts({ category: 'Hardware', exclude: ['h1'], limit: 6 })
    expect(list.map((p) => p.slug)).toEqual(['h2'])
    expect(list[0]).not.toHaveProperty('bodyMd')
  })
})

describe('getPostBySlug', () => {
  it('returns the full post including bodyMd', async () => {
    await createPost({ slug: 'x', bodyMd: '# Hi' })
    const post = await getPostBySlug('x')
    expect(post.bodyMd).toBe('# Hi')
  })
  it('returns null for unknown slug', async () => {
    expect(await getPostBySlug('nope')).toBeNull()
  })
})

describe('getRelated', () => {
  it('returns same-category posts excluding self, without bodyMd', async () => {
    await createPost({ slug: 'self', category: 'Theory' })
    await createPost({ slug: 'rel', category: 'Theory' })
    await createPost({ slug: 'other', category: 'Hardware' })
    const related = await getRelated('self', 3)
    expect(related.map((p) => p.slug)).toEqual(['rel'])
    expect(related[0]).not.toHaveProperty('bodyMd')
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:server -- server/lib/queries.test.js`
Expected: FAIL — cannot import from `./queries.js`.

- [ ] **Step 3: Implement `server/lib/queries.js` (adjacency added in Task 8)**

```js
import { prisma } from '../db.js'

// Total order used everywhere: newest first, id as deterministic tiebreaker.
const ORDER = [{ publishedAt: 'desc' }, { id: 'desc' }]

// Card fields = every column except bodyMd.
export const cardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  author: true,
  readMinutes: true,
  complexity: true,
  category: true,
  accent: true,
  heroImage: true,
  codeNumber: true,
  featured: true,
  publishedAt: true,
}

export async function getHomeData(recentLimit = 6) {
  const featured =
    (await prisma.post.findFirst({ where: { featured: true }, select: cardSelect, orderBy: ORDER })) ??
    (await prisma.post.findFirst({ select: cardSelect, orderBy: ORDER }))

  const theory = await prisma.post.findFirst({
    where: { category: 'Theory' },
    select: cardSelect,
    orderBy: ORDER,
  })

  const excludeSlugs = [featured?.slug, theory?.slug].filter(Boolean)
  const recent = await prisma.post.findMany({
    where: { slug: { notIn: excludeSlugs } },
    select: cardSelect,
    orderBy: ORDER,
    take: recentLimit,
  })

  return { featured: featured ?? null, theory: theory ?? null, recent }
}

export async function listPosts({ category, exclude = [], limit = 6 } = {}) {
  return prisma.post.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(exclude.length ? { slug: { notIn: exclude } } : {}),
    },
    select: cardSelect,
    orderBy: ORDER,
    take: limit,
  })
}

export async function getPostBySlug(slug) {
  return prisma.post.findUnique({ where: { slug } })
}

export async function getRelated(slug, limit = 3) {
  const post = await prisma.post.findUnique({ where: { slug }, select: { category: true } })
  if (!post) return []
  return prisma.post.findMany({
    where: { category: post.category, slug: { not: slug } },
    select: cardSelect,
    orderBy: ORDER,
    take: limit,
  })
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npm run test:server -- server/lib/queries.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/lib/queries.js server/lib/queries.test.js
git commit -m "feat: add home/list/single/related queries with card select"
```

---

## Task 8: Data access — prev/next adjacency (raw SQL window functions)

**Files:**
- Modify: `server/lib/queries.js`
- Modify: `server/lib/queries.test.js`

- [ ] **Step 1: Add the failing adjacency test to `server/lib/queries.test.js`**

```js
import { getAdjacent } from './queries.js'

describe('getAdjacent', () => {
  it('returns prev (newer) and next (older) under total order', async () => {
    await createPost({ slug: 'newest', publishedAt: new Date('2026-03-01Z') })
    await createPost({ slug: 'mid', publishedAt: new Date('2026-02-01Z') })
    await createPost({ slug: 'oldest', publishedAt: new Date('2026-01-01Z') })
    const adj = await getAdjacent('mid')
    expect(adj.prev).toEqual({ slug: 'newest', title: expect.any(String) })
    expect(adj.next).toEqual({ slug: 'oldest', title: expect.any(String) })
  })

  it('nulls at the ends', async () => {
    await createPost({ slug: 'a', publishedAt: new Date('2026-02-01Z') })
    await createPost({ slug: 'b', publishedAt: new Date('2026-01-01Z') })
    expect((await getAdjacent('a')).prev).toBeNull()
    expect((await getAdjacent('b')).next).toBeNull()
  })

  it('breaks publishedAt ties deterministically by id', async () => {
    const t = new Date('2026-02-01Z')
    const first = await createPost({ slug: 'tie-low', publishedAt: t }) // smaller id
    const second = await createPost({ slug: 'tie-high', publishedAt: t }) // larger id
    // Order is (publishedAt desc, id desc) => tie-high before tie-low.
    expect((await getAdjacent('tie-high')).next).toEqual({ slug: 'tie-low', title: expect.any(String) })
    expect((await getAdjacent('tie-low')).prev).toEqual({ slug: 'tie-high', title: expect.any(String) })
    expect(first.id).toBeLessThan(second.id)
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:server -- server/lib/queries.test.js`
Expected: FAIL — `getAdjacent` is not exported.

- [ ] **Step 3: Add `getAdjacent` to `server/lib/queries.js`**

Append:
```js
import { Prisma } from '@prisma/client'

// prev = the neighbor toward the start of the list (more recent) = LAG.
// next = the neighbor toward the end (older) = LEAD.
export async function getAdjacent(slug) {
  const rows = await prisma.$queryRaw(Prisma.sql`
    WITH ordered AS (
      SELECT
        slug,
        LAG(slug)  OVER w AS prev_slug,
        LAG(title) OVER w AS prev_title,
        LEAD(slug)  OVER w AS next_slug,
        LEAD(title) OVER w AS next_title
      FROM "Post"
      WINDOW w AS (ORDER BY "publishedAt" DESC, id DESC)
    )
    SELECT prev_slug, prev_title, next_slug, next_title
    FROM ordered
    WHERE slug = ${slug}
  `)
  if (rows.length === 0) return { prev: null, next: null }
  const r = rows[0]
  return {
    prev: r.prev_slug ? { slug: r.prev_slug, title: r.prev_title } : null,
    next: r.next_slug ? { slug: r.next_slug, title: r.next_title } : null,
  }
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npm run test:server -- server/lib/queries.test.js`
Expected: PASS (including the tie test).

- [ ] **Step 5: Commit**

```bash
git add server/lib/queries.js server/lib/queries.test.js
git commit -m "feat: add prev/next adjacency via raw SQL LAG/LEAD over total order"
```

---

## Task 9: Express app and routes

**Files:**
- Create: `server/routes/posts.js`, `server/app.js`, `server/app.test.js`

- [ ] **Step 1: Write the failing test — `server/app.test.js`**

```js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from './app.js'
import { createPost } from './test/factory.js'

describe('GET /api/home', () => {
  it('returns featured, theory, recent', async () => {
    await createPost({ slug: 'f', featured: true, publishedAt: new Date('2026-03-01Z') })
    await createPost({ slug: 't', category: 'Theory', publishedAt: new Date('2026-02-01Z') })
    await createPost({ slug: 'r', publishedAt: new Date('2026-01-01Z') })
    const res = await request(app).get('/api/home')
    expect(res.status).toBe(200)
    expect(res.body.featured.slug).toBe('f')
    expect(res.body.theory.slug).toBe('t')
    expect(res.body.recent.map((p) => p.slug)).toEqual(['r'])
  })
})

describe('GET /api/posts', () => {
  it('filters and validates', async () => {
    await createPost({ slug: 'h1', category: 'Hardware' })
    await createPost({ slug: 'a1', category: 'Algorithms' })
    const ok = await request(app).get('/api/posts?category=Hardware')
    expect(ok.body.map((p) => p.slug)).toEqual(['h1'])
    const bad = await request(app).get('/api/posts?category=Nope')
    expect(bad.status).toBe(400)
    const badLimit = await request(app).get('/api/posts?limit=abc')
    expect(badLimit.status).toBe(400)
  })
  it('accepts comma-separated exclude', async () => {
    await createPost({ slug: 'k1', category: 'Hardware' })
    await createPost({ slug: 'k2', category: 'Hardware' })
    const res = await request(app).get('/api/posts?category=Hardware&exclude=k1,k2')
    expect(res.body).toEqual([])
  })
})

describe('GET /api/posts/:slug', () => {
  it('returns post + prev/next, includes bodyMd', async () => {
    await createPost({ slug: 'one', bodyMd: '# One', publishedAt: new Date('2026-02-01Z') })
    await createPost({ slug: 'two', publishedAt: new Date('2026-01-01Z') })
    const res = await request(app).get('/api/posts/one')
    expect(res.status).toBe(200)
    expect(res.body.post.bodyMd).toBe('# One')
    expect(res.body.next.slug).toBe('two')
    expect(res.body.prev).toBeNull()
  })
  it('404s on unknown slug', async () => {
    const res = await request(app).get('/api/posts/missing')
    expect(res.status).toBe(404)
    expect(res.body.error).toBeTruthy()
  })
})

describe('GET /api/posts/:slug/related', () => {
  it('returns same-category, no bodyMd', async () => {
    await createPost({ slug: 'self', category: 'Theory' })
    await createPost({ slug: 'rel', category: 'Theory' })
    const res = await request(app).get('/api/posts/self/related')
    expect(res.body.map((p) => p.slug)).toEqual(['rel'])
    expect(res.body[0].bodyMd).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:server -- server/app.test.js`
Expected: FAIL — cannot import `./app.js`.

- [ ] **Step 3: Implement `server/routes/posts.js`**

```js
import { Router } from 'express'
import { parseCategory, parseLimit, parseExclude } from '../lib/validate.js'
import {
  getHomeData,
  listPosts,
  getPostBySlug,
  getAdjacent,
  getRelated,
} from '../lib/queries.js'

export const postsRouter = Router()

postsRouter.get('/home', async (req, res, next) => {
  try {
    res.json(await getHomeData())
  } catch (err) {
    next(err)
  }
})

postsRouter.get('/posts', async (req, res, next) => {
  try {
    const category = parseCategory(req.query.category)
    const exclude = parseExclude(req.query.exclude)
    const limit = parseLimit(req.query.limit, 6)
    res.json(await listPosts({ category, exclude, limit }))
  } catch (err) {
    next(err)
  }
})

postsRouter.get('/posts/:slug', async (req, res, next) => {
  try {
    const post = await getPostBySlug(req.params.slug)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    const { prev, next: nextPost } = await getAdjacent(req.params.slug)
    res.json({ post, prev, next: nextPost })
  } catch (err) {
    next(err)
  }
})

postsRouter.get('/posts/:slug/related', async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 3)
    res.json(await getRelated(req.params.slug, limit))
  } catch (err) {
    next(err)
  }
})
```

- [ ] **Step 4: Implement `server/app.js`**

```js
import express from 'express'
import { postsRouter } from './routes/posts.js'

export function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api', postsRouter)

  // Centralized error handler: ValidationError -> 400, else 500. No silent failures.
  app.use((err, req, res, _next) => {
    const status = err.status ?? 500
    if (status >= 500) console.error(err)
    res.status(status).json({ error: err.message ?? 'Internal Server Error' })
  })

  return app
}

export const app = createApp()
```

- [ ] **Step 5: Run it to verify pass**

Run: `npm run test:server -- server/app.test.js`
Expected: PASS (all groups).

- [ ] **Step 6: Commit**

```bash
git add server/routes/posts.js server/app.js server/app.test.js
git commit -m "feat: add Express API routes for home/posts/single/related"
```

---

## Task 10: Server entry with static serving + SPA fallback

**Files:**
- Modify: `server/app.js`
- Create: `server/index.js`, `server/static.test.js`

- [ ] **Step 1: Write the failing test — `server/static.test.js`**

```js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import request from 'supertest'
import { createApp } from './app.js'

let dir
let app

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'dist-'))
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>app</title>')
  app = createApp({ staticDir: dir })
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('SPA fallback', () => {
  it('serves index.html for a client route', async () => {
    const res = await request(app).get('/article/anything')
    expect(res.status).toBe(200)
    expect(res.text).toContain('<title>app</title>')
  })

  it('does not let the fallback shadow /api (unknown api route still JSON/404)', async () => {
    const res = await request(app).get('/api/posts/none')
    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/json/)
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:server -- server/static.test.js`
Expected: FAIL — `createApp` ignores `staticDir`; `/article/anything` 404s.

- [ ] **Step 3: Update `server/app.js` to accept `staticDir` and add fallback**

Replace the body of `createApp` so it reads:
```js
import express from 'express'
import { postsRouter } from './routes/posts.js'

export function createApp({ staticDir } = {}) {
  const app = express()
  app.use(express.json())
  app.use('/api', postsRouter)

  // API 404 (registered before the SPA fallback so it cannot be shadowed).
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

  if (staticDir) {
    app.use(express.static(staticDir))
    // SPA fallback LAST: every non-/api, non-asset path returns index.html.
    app.get('*', (req, res) => res.sendFile('index.html', { root: staticDir }))
  }

  // Centralized error handler: ValidationError -> 400, else 500.
  app.use((err, req, res, _next) => {
    const status = err.status ?? 500
    if (status >= 500) console.error(err)
    res.status(status).json({ error: err.message ?? 'Internal Server Error' })
  })

  return app
}

export const app = createApp()
```

- [ ] **Step 4: Run both server route tests to verify pass + no regression**

Run: `npm run test:server -- server/static.test.js server/app.test.js`
Expected: PASS for both (the API-404 middleware keeps `/api/posts/missing` → 404 JSON).

- [ ] **Step 5: Create `server/index.js`**

```js
import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createApp } from './app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const staticDir = isProd ? join(__dirname, '..', 'dist') : undefined

const app = createApp({ staticDir })
const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`API listening on :${port}${isProd ? ' (serving dist/)' : ''}`)
})
```

- [ ] **Step 6: Commit**

```bash
git add server/app.js server/index.js server/static.test.js
git commit -m "feat: serve built frontend with SPA fallback that never shadows /api"
```

---

## Task 11: Content (12 markdown articles) + idempotent seed

**Files:**
- Create: `server/content/*.md` (12 files), `prisma/seed.js`, `prisma/seed.test.js`

**Frontmatter schema (every file):** `title, excerpt, author, readMinutes, complexity (Entry|Mid|High), category (Hardware|Algorithms|Theory|Cryptography), accent (purple|teal|yellow|orange|pink|blueLight|blueVibrant), heroImage, codeNumber, featured (bool), publishedAt (ISO date)`. The slug is the filename without `.md`.

**The 12 files (slug → category, featured, accent, codeNumber):**
| File | Category | Featured | Accent | code |
|------|----------|----------|--------|------|
| `decoherence-silent-killer.md` | Hardware | **true** | purple | 42 |
| `cryogenic-control-circuits.md` | Hardware | false | orange | 38 |
| `topological-qubits.md` | Hardware | false | yellow | 61 |
| `shors-algorithm-in-practice.md` | Algorithms | false | purple | 27 |
| `grovers-search.md` | Algorithms | false | teal | 33 |
| `nisq-era.md` | Algorithms | false | pink | 55 |
| `superposition-bloch-sphere.md` | Theory | false | blueVibrant | 9 |
| `entanglement-non-locality.md` | Theory | false | teal | 14 |
| `quantum-teleportation.md` | Theory | false | yellow | 21 |
| `phase-flip-error-correction.md` | Cryptography | false | teal | 12 |
| `surface-code-protocols.md` | Cryptography | false | blueLight | 47 |
| `post-quantum-cryptography.md` | Cryptography | false | orange | 70 |

- [ ] **Step 1: Write the featured example file `server/content/decoherence-silent-killer.md`**

```markdown
---
title: "Decoherence: the silent killer of qubits"
excerpt: "About 80% of current error rates stem from environmental noise. Isolation, not computation, is the real frontier of quantum hardware."
author: "Dr. Aris Thorne"
readMinutes: 8
complexity: High
category: Hardware
accent: purple
heroImage: "https://images.pexels.com/photos/8438918/pexels-photo-8438918.jpeg?auto=compress&cs=tinysrgb&w=1200"
codeNumber: 42
featured: true
publishedAt: "2026-05-20"
---

In the delicate theater of quantum computation, environment is everything. While we
speak of 433-qubit processors and sub-millisecond gate operations, the fundamental
challenge remains the same: isolation. Quantum states are notoriously fragile, prone to
collapsing at the slightest touch of thermal radiation or electromagnetic interference.

This phenomenon, known as decoherence, represents the transition of a quantum system
into a classical one. It is not merely an engineering hurdle; it is a battle against the
fundamental laws of entropy. To keep a qubit in a state of superposition, we must
essentially shield it from the entire universe.

![Dilution refrigerator interior](https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg?auto=compress&cs=tinysrgb&w=1200 "Near Absolute Zero")

Recent breakthroughs in synthetic diamond lattices have provided a new frontier for
qubit stability. By trapping nitrogen-vacancy centers within a carbon matrix,
researchers have achieved coherence times that were previously thought impossible at
these scales. This "quantum cage" approach might be the key to scaling beyond the
current noise-limited era.
```

- [ ] **Step 2: Write the remaining 11 files**

Use the same frontmatter shape and the table values above. Each body is **400–600 words** of accurate, on-topic quantum-computing prose, and **each must include exactly one** image with a title to exercise the immersive break, e.g.:
```markdown
![alt text](https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1200 "Caption heading")
```
Keep `excerpt` to one or two sentences (it appears in the hero subtext / feed cards). Vary `publishedAt` across 2026-01 … 2026-05 so ordering is meaningful; give the featured post the most recent date among Hardware so it also wins generic ordering.

- [ ] **Step 3: Write the failing test — `prisma/seed.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { loadPosts } from './seed.js'

describe('loadPosts', () => {
  const posts = loadPosts()

  it('loads 12 articles', () => {
    expect(posts).toHaveLength(12)
  })
  it('has exactly one featured post', () => {
    expect(posts.filter((p) => p.featured)).toHaveLength(1)
  })
  it('derives slug from filename and carries a markdown body', () => {
    const d = posts.find((p) => p.slug === 'decoherence-silent-killer')
    expect(d).toBeTruthy()
    expect(d.featured).toBe(true)
    expect(d.bodyMd).toContain('decoherence')
  })
  it('uses only valid enum values', () => {
    const cats = new Set(['Hardware', 'Algorithms', 'Theory', 'Cryptography'])
    const comp = new Set(['Entry', 'Mid', 'High'])
    const acc = new Set(['purple', 'teal', 'yellow', 'orange', 'pink', 'blueLight', 'blueVibrant'])
    for (const p of posts) {
      expect(cats.has(p.category)).toBe(true)
      expect(comp.has(p.complexity)).toBe(true)
      expect(acc.has(p.accent)).toBe(true)
      expect(Number.isInteger(p.readMinutes)).toBe(true)
      expect(p.publishedAt instanceof Date).toBe(true)
    }
  })
})
```

- [ ] **Step 4: Run it to verify failure**

Run: `npm run test:server -- prisma/seed.test.js`
Expected: FAIL — cannot import `loadPosts` from `./seed.js`.

- [ ] **Step 5: Implement `prisma/seed.js`**

```js
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'
import matter from 'gray-matter'
import { prisma } from '../server/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, '..', 'server', 'content')

export function loadPosts() {
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(join(CONTENT_DIR, file), 'utf8')
      const { data, content } = matter(raw)
      return {
        slug: basename(file, '.md'),
        title: data.title,
        excerpt: data.excerpt,
        bodyMd: content.trim(),
        author: data.author,
        readMinutes: Number(data.readMinutes),
        complexity: data.complexity,
        category: data.category,
        accent: data.accent,
        heroImage: data.heroImage,
        codeNumber: Number(data.codeNumber),
        featured: Boolean(data.featured),
        publishedAt: new Date(data.publishedAt),
      }
    })
}

export async function seed() {
  const posts = loadPosts()
  for (const post of posts) {
    // Upsert on slug => re-running migrate deploy + seed is idempotent.
    await prisma.post.upsert({ where: { slug: post.slug }, update: post, create: post })
  }
  return posts.length
}

// Run only when invoked directly (not when imported by tests).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then((n) => {
      console.log(`Seeded ${n} posts`)
      return prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
```

- [ ] **Step 6: Run it to verify pass**

Run: `npm run test:server -- prisma/seed.test.js`
Expected: PASS (12 posts, one featured, valid enums).

- [ ] **Step 7: Seed the local dev database and verify**

Run:
```bash
npm run db:seed
npx prisma db execute --stdin <<< 'SELECT count(*) FROM "Post";'
```
Expected: seed prints "Seeded 12 posts"; count is 12. Re-run `npm run db:seed` once more and confirm count is still 12 (idempotent).

- [ ] **Step 8: Commit**

```bash
git add server/content prisma/seed.js prisma/seed.test.js
git commit -m "feat: add 12 markdown articles and idempotent upsert seed"
```

---

## Task 12: Frontend API client + endpoint functions

**Files:**
- Create: `src/api/client.js`, `src/api/posts.js`, `src/api/posts.test.js`

- [ ] **Step 1: Write the failing test — `src/api/posts.test.js`**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getHome, getPosts, getPost, getRelated } from './posts.js'
import { HttpError } from './client.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

function mockFetch(body, ok = true, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  })
}

describe('getHome', () => {
  it('GETs /api/home', async () => {
    mockFetch({ featured: null, theory: null, recent: [] })
    const data = await getHome()
    expect(global.fetch).toHaveBeenCalledWith('/api/home')
    expect(data.recent).toEqual([])
  })
})

describe('getPosts', () => {
  it('builds a query string from params', async () => {
    mockFetch([])
    await getPosts({ category: 'Hardware', exclude: ['a', 'b'], limit: 6 })
    expect(global.fetch).toHaveBeenCalledWith('/api/posts?category=Hardware&exclude=a%2Cb&limit=6')
  })
  it('omits empty params', async () => {
    mockFetch([])
    await getPosts({})
    expect(global.fetch).toHaveBeenCalledWith('/api/posts')
  })
})

describe('getPost', () => {
  it('GETs a single post', async () => {
    mockFetch({ post: { slug: 'x' }, prev: null, next: null })
    const data = await getPost('x')
    expect(global.fetch).toHaveBeenCalledWith('/api/posts/x')
    expect(data.post.slug).toBe('x')
  })
  it('throws HttpError with status on non-ok', async () => {
    mockFetch({ error: 'nope' }, false, 404)
    await expect(getPost('missing')).rejects.toMatchObject({ status: 404 })
    await expect(getPost('missing')).rejects.toBeInstanceOf(HttpError)
  })
})

describe('getRelated', () => {
  it('GETs related with limit', async () => {
    mockFetch([])
    await getRelated('x', 3)
    expect(global.fetch).toHaveBeenCalledWith('/api/posts/x/related?limit=3')
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/api/posts.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/api/client.js`**

```js
const BASE = import.meta.env.VITE_API_URL || '/api'

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // non-JSON error body; keep default message
    }
    throw new HttpError(res.status, message)
  }
  return res.json()
}
```

- [ ] **Step 4: Implement `src/api/posts.js`**

```js
import { apiFetch } from './client.js'

export function getHome() {
  return apiFetch('/home')
}

export function getPosts({ category, exclude = [], limit } = {}) {
  const qs = new URLSearchParams()
  if (category) qs.set('category', category)
  if (exclude.length) qs.set('exclude', exclude.join(','))
  if (limit != null) qs.set('limit', String(limit))
  const suffix = qs.toString() ? `?${qs}` : ''
  return apiFetch(`/posts${suffix}`)
}

export function getPost(slug) {
  return apiFetch(`/posts/${slug}`)
}

export function getRelated(slug, limit = 3) {
  return apiFetch(`/posts/${slug}/related?limit=${limit}`)
}
```

- [ ] **Step 5: Run it to verify pass**

Run: `npm run test:client -- src/api/posts.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/api
git commit -m "feat: add frontend API client and post endpoint functions"
```

---

## Task 13: Data hooks

**Files:**
- Create: `src/hooks/useAsync.js`, `src/hooks/posts.js`, `src/hooks/posts.test.jsx`

- [ ] **Step 1: Write the failing test — `src/hooks/posts.test.jsx`**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHome, usePost, usePosts } from './posts.js'
import * as api from '../api/posts.js'

beforeEach(() => vi.restoreAllMocks())

describe('useHome', () => {
  it('transitions loading -> data', async () => {
    vi.spyOn(api, 'getHome').mockResolvedValue({ featured: null, theory: null, recent: [] })
    const { result } = renderHook(() => useHome())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data.recent).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('captures errors', async () => {
    vi.spyOn(api, 'getHome').mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useHome())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
  })
})

describe('usePost', () => {
  it('fetches by slug', async () => {
    vi.spyOn(api, 'getPost').mockResolvedValue({ post: { slug: 'x' }, prev: null, next: null })
    const { result } = renderHook(() => usePost('x'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data.post.slug).toBe('x')
  })
})

describe('usePosts', () => {
  it('does not fetch when params is null', async () => {
    const spy = vi.spyOn(api, 'getPosts').mockResolvedValue([])
    const { result } = renderHook(() => usePosts(null))
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(spy).not.toHaveBeenCalled()
  })
  it('fetches when params provided', async () => {
    vi.spyOn(api, 'getPosts').mockResolvedValue([{ slug: 'h1' }])
    const { result } = renderHook(() => usePosts({ category: 'Hardware' }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ slug: 'h1' }])
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/hooks/posts.test.jsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/hooks/useAsync.js`**

```js
import { useState, useEffect } from 'react'

// Runs `fn` when `enabled` and on `deps` change; tracks loading/data/error.
// `fn` must be stable enough to be recreated each render (we only depend on deps).
export function useAsync(fn, deps, enabled = true) {
  const [state, setState] = useState({
    data: null,
    loading: enabled,
    error: null,
  })

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
```

- [ ] **Step 4: Implement `src/hooks/posts.js`**

```js
import { useAsync } from './useAsync.js'
import { getHome, getPost, getPosts, getRelated } from '../api/posts.js'

export function useHome() {
  return useAsync(() => getHome(), [])
}

export function usePost(slug) {
  return useAsync(() => getPost(slug), [slug], Boolean(slug))
}

export function useRelated(slug, limit = 3) {
  return useAsync(() => getRelated(slug, limit), [slug, limit], Boolean(slug))
}

// params=null => disabled (used when no category filter is active).
export function usePosts(params) {
  const key = params ? JSON.stringify(params) : null
  return useAsync(() => getPosts(params), [key], Boolean(params))
}
```

- [ ] **Step 5: Run it to verify pass**

Run: `npm run test:client -- src/hooks/posts.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks
git commit -m "feat: add useAsync and post data hooks (home/post/posts/related)"
```

---

## Task 14: Formatting helpers

**Files:**
- Create: `src/lib/format.js`, `src/lib/format.test.js`

- [ ] **Step 1: Write the failing test — `src/lib/format.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { formatReadTime, formatComplexity, accentVar, formatCode } from './format.js'

describe('formatReadTime', () => {
  it('zero-pads to NN mins', () => {
    expect(formatReadTime(8)).toBe('08 mins')
    expect(formatReadTime(12)).toBe('12 mins')
  })
})

describe('formatComplexity', () => {
  it('renders enum as "… Tier"', () => {
    expect(formatComplexity('High')).toBe('High Tier')
    expect(formatComplexity('Entry')).toBe('Entry Tier')
  })
})

describe('accentVar', () => {
  it('maps accent enums to CSS vars', () => {
    expect(accentVar('purple')).toBe('var(--p-purple)')
    expect(accentVar('blueLight')).toBe('var(--p-blue-light)')
    expect(accentVar('orange')).toBe('var(--p-orange-line)')
  })
  it('falls back to purple for unknown', () => {
    expect(accentVar('???')).toBe('var(--p-purple)')
  })
})

describe('formatCode', () => {
  it('zero-pads to 3 digits', () => {
    expect(formatCode(42)).toBe('042')
    expect(formatCode(9)).toBe('009')
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/lib/format.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/format.js`**

```js
const ACCENT_VARS = {
  purple: '--p-purple',
  teal: '--p-teal',
  yellow: '--p-yellow',
  orange: '--p-orange-line',
  pink: '--p-pink',
  blueLight: '--p-blue-light',
  blueVibrant: '--p-blue-vibrant',
}

export function formatReadTime(minutes) {
  return `${String(minutes).padStart(2, '0')} mins`
}

export function formatComplexity(complexity) {
  return `${complexity} Tier`
}

export function accentVar(accent) {
  return `var(${ACCENT_VARS[accent] ?? ACCENT_VARS.purple})`
}

export function formatCode(n) {
  return String(n).padStart(3, '0')
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npm run test:client -- src/lib/format.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat: add read-time/complexity/accent/code formatting helpers"
```

---

## Task 15: Shared Loading and ErrorState components

**Files:**
- Create: `src/components/StateViews.jsx`, `src/components/StateViews.css`, `src/components/StateViews.test.jsx`

- [ ] **Step 1: Write the failing test — `src/components/StateViews.test.jsx`**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Loading, ErrorState, NotFound } from './StateViews.jsx'

describe('state views', () => {
  it('Loading shows a label', () => {
    render(<Loading />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
  it('ErrorState shows the message', () => {
    render(<ErrorState message="boom" />)
    expect(screen.getByText(/boom/)).toBeInTheDocument()
  })
  it('NotFound links home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/components/StateViews.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/StateViews.jsx`**

```jsx
import { Link } from 'react-router-dom'
import './StateViews.css'

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <span className="state-dot" /> {label}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong.' }) {
  return (
    <div className="state-view state-error" role="alert">
      <p>{message}</p>
      <Link to="/" className="state-link">
        Back to home
      </Link>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="state-view">
      <p>Signal lost — this article does not exist.</p>
      <Link to="/" className="state-link">
        Back to home
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Implement `src/components/StateViews.css`**

```css
.state-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
  justify-content: center;
  min-height: 50vh;
  padding: var(--pad-outer, 3rem);
  color: var(--c-grey);
  font-size: 1.4rem;
}
.state-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--p-purple);
  animation: state-pulse 1s ease-in-out infinite;
}
.state-error p {
  color: var(--p-pink);
}
.state-link {
  color: var(--p-blue-light);
  text-decoration: none;
}
.state-link:hover {
  text-decoration: underline;
}
@keyframes state-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

- [ ] **Step 5: Run it to verify pass**

Run: `npm run test:client -- src/components/StateViews.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/StateViews.jsx src/components/StateViews.css src/components/StateViews.test.jsx
git commit -m "feat: add shared Loading/Error/NotFound state views"
```

---

## Task 16: Markdown renderer (immersive break + image unwrap)

**Files:**
- Create: `src/components/Markdown.jsx`, `src/components/Markdown.test.jsx`

- [ ] **Step 1: Write the failing test — `src/components/Markdown.test.jsx`**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Markdown from './Markdown.jsx'

describe('Markdown', () => {
  it('renders paragraphs and headings', () => {
    render(<Markdown>{'# Title\n\nHello world.'}</Markdown>)
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('Hello world.')).toBeInTheDocument()
  })

  it('wraps a titled image in an immersive break with caption', () => {
    const { container } = render(
      <Markdown>{'![alt text](https://x/y.jpg "Near Absolute Zero")'}</Markdown>,
    )
    const wrapper = container.querySelector('.immersive-break')
    expect(wrapper).toBeTruthy()
    expect(wrapper.querySelector('img')).toHaveAttribute('alt', 'alt text')
    expect(wrapper.querySelector('.break-overlay h3').textContent).toBe('Near Absolute Zero')
  })

  it('does not nest the break div inside a <p>', () => {
    const { container } = render(
      <Markdown>{'![a](https://x/y.jpg "Cap")'}</Markdown>,
    )
    expect(container.querySelector('p .immersive-break')).toBeNull()
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/components/Markdown.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/Markdown.jsx`**

```jsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function ImmersiveImage({ src, alt, title }) {
  return (
    <div className="immersive-break">
      <img src={src} alt={alt} />
      {title ? (
        <div className="break-overlay">
          <h3>{title}</h3>
        </div>
      ) : null}
    </div>
  )
}

// Unwrap paragraphs whose only child is an image so the block-level
// .immersive-break div is not rendered inside a <p> (invalid HTML).
function Paragraph({ node, children }) {
  if (node?.children?.length === 1 && node.children[0].tagName === 'img') {
    return <>{children}</>
  }
  return <p>{children}</p>
}

export default function Markdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ img: ImmersiveImage, p: Paragraph }}
    >
      {children}
    </ReactMarkdown>
  )
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npm run test:client -- src/components/Markdown.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Markdown.jsx src/components/Markdown.test.jsx
git commit -m "feat: add markdown renderer with immersive-break image mapping"
```

---

## Task 17: FeedItem and RelatedCard as router links

**Files:**
- Modify: `src/components/FeedItem.jsx`, `src/components/RelatedCard.jsx`
- Create: `src/components/Cards.test.jsx`

- [ ] **Step 1: Write the failing test — `src/components/Cards.test.jsx`**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FeedItem from './FeedItem.jsx'
import RelatedCard from './RelatedCard.jsx'

function wrap(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('FeedItem', () => {
  it('links to the article by slug', () => {
    wrap(<FeedItem slug="shors-algorithm-in-practice" title="Shor" description="d" accent="purple" />)
    const link = screen.getByRole('link', { name: /more/i })
    expect(link).toHaveAttribute('href', '/article/shors-algorithm-in-practice')
  })
})

describe('RelatedCard', () => {
  it('links to the article and shows category/code tag', () => {
    wrap(<RelatedCard slug="topological-qubits" title="Topo" category="Hardware" codeNumber={61} accent="teal" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/article/topological-qubits')
    expect(screen.getByText('Hardware / 061')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/components/Cards.test.jsx`
Expected: FAIL — props/links don't match (current components use `<a href="/article">`).

- [ ] **Step 3: Rewrite `src/components/FeedItem.jsx`**

```jsx
import { Link } from 'react-router-dom'
import { accentVar } from '../lib/format.js'
import './FeedItem.css'

export default function FeedItem({ slug, title, description, accent }) {
  const color = accentVar(accent)
  return (
    <article className="feed-item" style={{ borderColor: color }}>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={`/article/${slug}`} className="more-link" style={{ color }}>
        More <span>⟶</span>
      </Link>
    </article>
  )
}
```

- [ ] **Step 4: Rewrite `src/components/RelatedCard.jsx`**

```jsx
import { Link } from 'react-router-dom'
import { accentVar, formatCode } from '../lib/format.js'
import './RelatedCard.css'

export default function RelatedCard({ slug, title, category, codeNumber, accent }) {
  const color = accentVar(accent)
  return (
    <Link to={`/article/${slug}`} className="related-card" style={{ borderColor: color }}>
      <div className="related-card-tag" style={{ color }}>
        {category} / {formatCode(codeNumber)}
      </div>
      <h4>{title}</h4>
      <div className="related-card-arrow" style={{ color }}>
        ⟶
      </div>
    </Link>
  )
}
```

- [ ] **Step 5: Run it to verify pass**

Run: `npm run test:client -- src/components/Cards.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/FeedItem.jsx src/components/RelatedCard.jsx src/components/Cards.test.jsx
git commit -m "feat: make FeedItem and RelatedCard data-driven router links"
```

---

## Task 18: HeroPane and TheoryPane (data-driven)

**Files:**
- Modify: `src/components/HeroPane.jsx`, `src/components/TheoryPane.jsx`
- Create: `src/components/Panes.test.jsx`

- [ ] **Step 1: Write the failing test — `src/components/Panes.test.jsx`**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HeroPane from './HeroPane.jsx'
import TheoryPane from './TheoryPane.jsx'

const post = {
  slug: 'decoherence-silent-killer',
  title: 'Decoherence',
  excerpt: 'noise excerpt',
  heroImage: 'https://x/y.jpg',
  accent: 'purple',
}

function wrap(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('HeroPane', () => {
  it('renders the featured post and links Next to it', () => {
    wrap(<HeroPane post={post} />)
    expect(screen.getByRole('heading', { name: 'Decoherence' })).toBeInTheDocument()
    expect(screen.getByText('noise excerpt')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute(
      'href',
      '/article/decoherence-silent-killer',
    )
  })
})

describe('TheoryPane', () => {
  it('renders the theory post when present', () => {
    wrap(<TheoryPane post={{ ...post, slug: 'superposition-bloch-sphere', title: 'Superposition' }} />)
    expect(screen.getByRole('heading', { name: 'Superposition' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute(
      'href',
      '/article/superposition-bloch-sphere',
    )
  })
  it('renders static fallback copy when post is null', () => {
    wrap(<TheoryPane post={null} />)
    expect(screen.getByRole('heading', { name: /superposition/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/components/Panes.test.jsx`
Expected: FAIL — components ignore `post` prop.

- [ ] **Step 3: Rewrite `src/components/HeroPane.jsx`**

Keep the existing markup/CSS classes and the decorative SVG/stat lockup; drive title, excerpt, image, and the Next link from `post`:
```jsx
import { Link } from 'react-router-dom'
import DotLabel from './DotLabel'
import IconButton from './IconButton'
import PillButton from './PillButton'
import './HeroPane.css'

export default function HeroPane({ post }) {
  return (
    <article className="pane-dark">
      <header className="section-header">
        <DotLabel color="var(--p-purple)">The Qubits</DotLabel>
        <IconButton ariaLabel="Save" color="var(--p-yellow)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </IconButton>
      </header>

      <h1>{post.title}</h1>

      <p className="subtext">{post.excerpt}</p>

      <div className="visual-stage">
        <div className="image-mask">
          <img src={post.heroImage} alt={post.title} />
        </div>
        <svg className="orbit-graphic" viewBox="0 0 100 100">
          <ellipse cx="50" cy="50" rx="48" ry="25" fill="none" stroke="var(--p-purple)" strokeWidth="0.3" transform="rotate(-15 50 50)" />
          <circle cx="95" cy="38" r="6" fill="var(--p-orange-solid)" />
        </svg>
      </div>

      <div className="footer-actions">
        <div className="data-lockup">
          <div className="data-value">433 QBs</div>
          <div className="data-label">converting logical states<br />to physical architecture</div>
        </div>
        <div>
          <PillButton color="var(--p-teal)" href="#" style={{ marginRight: '1rem' }}>Back</PillButton>
          <PillButton color="var(--p-orange-line)" as={Link} to={`/article/${post.slug}`}>Next</PillButton>
        </div>
      </div>
    </article>
  )
}
```

> **PillButton note:** if the existing `PillButton` does not support an `as`/`to` prop, render the Next button as `<Link className="pill-button-like" to={...}>` reusing PillButton's classes, OR extend PillButton to accept `as={Link}`. Inspect `src/components/PillButton.jsx` first and pick the smaller change; keep the existing visual classes. Apply the same pattern anywhere this plan uses `as={Link}`.

- [ ] **Step 4: Rewrite `src/components/TheoryPane.jsx`**

Preserve the bespoke superposition SVG and all classes; drive heading/excerpt/Next link from `post`, with static fallback copy when `post` is null:
```jsx
import { Link } from 'react-router-dom'
import DotLabel from './DotLabel'
import IconButton from './IconButton'
import PillButton from './PillButton'
import './TheoryPane.css'

export default function TheoryPane({ post }) {
  const title = post?.title ?? 'Superposition'
  const excerpt =
    post?.excerpt ??
    'Unlike classical bits which exist as 0 or 1, a qubit can exist in a complex linear combination of both states simultaneously until measured.'
  const to = post ? `/article/${post.slug}` : '#'

  return (
    <section className="pane-accent">
      <header className="section-header">
        <DotLabel color="var(--p-orange-line)">Theory</DotLabel>
        <IconButton ariaLabel="Close" color="var(--p-blue-dark)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </header>

      <svg className="star-icon" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFFFFF" stroke="none" />
      </svg>

      <h2>{title}</h2>

      <p className="subtext">{excerpt}</p>

      <svg className="quantum-vector" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
        <g>
          <rect x="0" y="40" width="400" height="6" fill="#333333" />
          <rect x="0" y="80" width="400" height="6" fill="#333333" />
          <rect x="0" y="120" width="400" height="6" fill="#333333" />
          <rect x="0" y="160" width="400" height="6" fill="#333333" />
          <rect x="0" y="200" width="400" height="6" fill="#333333" />
          <rect x="0" y="240" width="400" height="6" fill="#333333" />
        </g>
        <circle cx="200" cy="140" r="100" fill="var(--p-pink)" />
        <circle cx="200" cy="140" r="100" fill="none" stroke="var(--p-blue-vibrant)" strokeWidth="8" />
        <path d="M 80 240 Q 140 140 200 140 T 320 40" fill="none" stroke="var(--p-yellow)" strokeWidth="8" strokeLinecap="round" />
        <circle cx="260" cy="90" r="12" fill="var(--p-teal)" />
        <path d="M 80 240 L 95 240" stroke="var(--p-yellow)" strokeWidth="8" strokeLinecap="round" />
      </svg>

      <div className="pane-accent-footer">
        <div className="data-label" style={{ opacity: 1, alignSelf: 'flex-end', paddingBottom: '0.6rem' }}>
          mathematical probability<br />distribution models
        </div>
        <div>
          <PillButton
            color="var(--c-white)"
            bg="var(--p-blue-vibrant)"
            borderColor="var(--p-blue-vibrant)"
            hoverBg="var(--c-white)"
            hoverColor="var(--p-blue-vibrant)"
            hoverBorderColor="var(--c-white)"
            href="#"
            style={{ marginRight: '1rem' }}
          >
            Fav
          </PillButton>
          <PillButton
            color="var(--c-bg)"
            bg="var(--p-grey-solid)"
            borderColor="var(--p-grey-solid)"
            hoverBg="var(--c-white)"
            hoverColor="var(--c-bg)"
            hoverBorderColor="var(--c-white)"
            as={Link}
            to={to}
          >
            Next
          </PillButton>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run it to verify pass**

Run: `npm run test:client -- src/components/Panes.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/HeroPane.jsx src/components/TheoryPane.jsx src/components/Panes.test.jsx
git commit -m "feat: drive HeroPane and TheoryPane from post data"
```

---

## Task 19: KnowledgePane (data-driven feed + category links)

**Files:**
- Modify: `src/components/KnowledgePane.jsx`
- Create: `src/components/KnowledgePane.test.jsx`

- [ ] **Step 1: Write the failing test — `src/components/KnowledgePane.test.jsx`**

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import KnowledgePane from './KnowledgePane.jsx'

const posts = [
  { slug: 'a', title: 'A', excerpt: 'ea', accent: 'purple' },
  { slug: 'b', title: 'B', excerpt: 'eb', accent: 'teal' },
]

describe('KnowledgePane', () => {
  it('renders a FeedItem per post with real links', () => {
    render(
      <MemoryRouter>
        <KnowledgePane posts={posts} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /more/i, hidden: false })).toBeTruthy()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('tag pills link to category-filtered home', () => {
    render(
      <MemoryRouter>
        <KnowledgePane posts={posts} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Hardware' })).toHaveAttribute('href', '/?category=Hardware')
    expect(screen.getByRole('link', { name: 'Algorithms' })).toHaveAttribute('href', '/?category=Algorithms')
    expect(screen.getByRole('link', { name: 'Cryptography' })).toHaveAttribute('href', '/?category=Cryptography')
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/components/KnowledgePane.test.jsx`
Expected: FAIL — component is hardcoded and ignores `posts`.

- [ ] **Step 3: Rewrite `src/components/KnowledgePane.jsx`**

Keep `pane-light`, `Index` heading, and the tag-group visual; pills become `Link`s; feed maps `posts`:
```jsx
import { Link } from 'react-router-dom'
import DotLabel from './DotLabel'
import FeedItem from './FeedItem'
import './KnowledgePane.css'

const TAGS = [
  { label: 'Hardware', color: 'var(--p-teal)' },
  { label: 'Algorithms', color: 'var(--p-purple)' },
  { label: 'Cryptography', color: 'var(--p-orange-solid)' },
]

export default function KnowledgePane({ posts = [] }) {
  return (
    <section className="pane-light">
      <header className="section-header">
        <DotLabel color="var(--p-blue-light)">Knowledge Base</DotLabel>
      </header>

      <h2>Index</h2>

      <div className="tag-group">
        {TAGS.map((tag) => (
          <Link
            key={tag.label}
            to={`/?category=${tag.label}`}
            className="pill-button"
            style={{ color: tag.color, borderColor: tag.color }}
          >
            {tag.label}
          </Link>
        ))}
      </div>

      <div className="feed-list">
        {posts.map((post) => (
          <FeedItem
            key={post.slug}
            slug={post.slug}
            title={post.title}
            description={post.excerpt}
            accent={post.accent}
          />
        ))}
      </div>
    </section>
  )
}
```

> **Pill styling note:** the original pills were `PillButton` components. Reuse the existing pill CSS class so the look is unchanged. Inspect `src/components/PillButton.css` for the actual class name (e.g. `.pill-button`) and use that exact class on the `Link`. If `PillButton` supports `as={Link}`/`to` (see Task 18 note), prefer rendering `<PillButton as={Link} to=...>` instead of a raw `Link`.

- [ ] **Step 4: Run it to verify pass**

Run: `npm run test:client -- src/components/KnowledgePane.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/KnowledgePane.jsx src/components/KnowledgePane.test.jsx
git commit -m "feat: drive KnowledgePane feed from data; category pill links"
```

---

## Task 20: HomePage (compose home data + category filter + states)

**Files:**
- Modify: `src/pages/HomePage.jsx`
- Create: `src/pages/HomePage.test.jsx`

- [ ] **Step 1: Write the failing test — `src/pages/HomePage.test.jsx`**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage.jsx'
import * as api from '../api/posts.js'

const home = {
  featured: { slug: 'feat', title: 'Featured', excerpt: 'fx', heroImage: 'https://x/y.jpg', accent: 'purple' },
  theory: { slug: 'th', title: 'Theory Post', excerpt: 'tx', accent: 'teal' },
  recent: [{ slug: 'r1', title: 'Recent One', excerpt: 'rx', accent: 'yellow' }],
}

beforeEach(() => vi.restoreAllMocks())

function renderAt(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('shows loading then renders hero, theory, and feed', async () => {
    vi.spyOn(api, 'getHome').mockResolvedValue(home)
    renderAt('/')
    expect(screen.getByRole('status')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Featured' })).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Theory Post' })).toBeInTheDocument()
    expect(screen.getByText('Recent One')).toBeInTheDocument()
  })

  it('uses the filtered list when ?category= is present', async () => {
    vi.spyOn(api, 'getHome').mockResolvedValue(home)
    const getPosts = vi
      .spyOn(api, 'getPosts')
      .mockResolvedValue([{ slug: 'h1', title: 'Hardware One', excerpt: 'hx', accent: 'purple' }])
    renderAt('/?category=Hardware')
    await waitFor(() => expect(screen.getByText('Hardware One')).toBeInTheDocument())
    expect(getPosts).toHaveBeenCalledWith({
      category: 'Hardware',
      exclude: ['feat', 'th'],
      limit: 6,
    })
    expect(screen.queryByText('Recent One')).not.toBeInTheDocument()
  })

  it('shows an error state on failure', async () => {
    vi.spyOn(api, 'getHome').mockRejectedValue(new Error('down'))
    renderAt('/')
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/pages/HomePage.test.jsx`
Expected: FAIL — HomePage renders static panes, no data/states.

- [ ] **Step 3: Rewrite `src/pages/HomePage.jsx`**

```jsx
import { useSearchParams } from 'react-router-dom'
import HeroPane from '../components/HeroPane'
import TheoryPane from '../components/TheoryPane'
import KnowledgePane from '../components/KnowledgePane'
import { Loading, ErrorState } from '../components/StateViews'
import { useHome, usePosts } from '../hooks/posts'
import './HomePage.css'

export default function HomePage() {
  const [params] = useSearchParams()
  const category = params.get('category') || undefined

  const { data: home, loading, error } = useHome()

  const excludeSlugs = [home?.featured?.slug, home?.theory?.slug].filter(Boolean)
  const filter = category ? { category, exclude: excludeSlugs, limit: 6 } : null
  const { data: filtered } = usePosts(home && category ? filter : null)

  if (loading) return <Loading />
  if (error) return <ErrorState message="Could not load the feed." />

  const feed = category ? filtered ?? [] : home.recent

  return (
    <main className="editorial-grid home-grid">
      <HeroPane post={home.featured} />
      <div className="right-column">
        <TheoryPane post={home.theory} />
        <KnowledgePane posts={feed} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npm run test:client -- src/pages/HomePage.test.jsx`
Expected: PASS (all three cases).

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage.jsx src/pages/HomePage.test.jsx
git commit -m "feat: data-driven HomePage with category filter and states"
```

---

## Task 21: ArticlePage (fetch by slug + markdown + related + prev/next + states)

**Files:**
- Modify: `src/pages/ArticlePage.jsx`
- Create: `src/pages/ArticlePage.test.jsx`

- [ ] **Step 1: Write the failing test — `src/pages/ArticlePage.test.jsx`**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ArticlePage from './ArticlePage.jsx'
import * as api from '../api/posts.js'
import { HttpError } from '../api/client.js'

const post = {
  slug: 'decoherence-silent-killer',
  title: 'Decoherence',
  bodyMd: '# Heading\n\nBody paragraph about qubits.',
  author: 'Dr. Aris Thorne',
  readMinutes: 8,
  complexity: 'High',
  category: 'Hardware',
  accent: 'purple',
  codeNumber: 42,
}

beforeEach(() => vi.restoreAllMocks())

function renderSlug(slug) {
  return render(
    <MemoryRouter initialEntries={[`/article/${slug}`]}>
      <Routes>
        <Route path="/article/:slug" element={<ArticlePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ArticlePage', () => {
  it('renders the article body, meta, related, and next link', async () => {
    vi.spyOn(api, 'getPost').mockResolvedValue({
      post,
      prev: null,
      next: { slug: 'cryogenic-control-circuits', title: 'Cryo' },
    })
    vi.spyOn(api, 'getRelated').mockResolvedValue([
      { slug: 'topological-qubits', title: 'Topo', category: 'Hardware', codeNumber: 61, accent: 'teal' },
    ])
    renderSlug('decoherence-silent-killer')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Decoherence' })).toBeInTheDocument())
    expect(screen.getByText('Dr. Aris Thorne')).toBeInTheDocument()
    expect(screen.getByText('08 mins')).toBeInTheDocument()
    expect(screen.getByText('High Tier')).toBeInTheDocument()
    expect(screen.getByText('Body paragraph about qubits.')).toBeInTheDocument()
    expect(screen.getByText('Topo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute(
      'href',
      '/article/cryogenic-control-circuits',
    )
  })

  it('shows NotFound on 404', async () => {
    vi.spyOn(api, 'getPost').mockRejectedValue(new HttpError(404, 'Post not found'))
    vi.spyOn(api, 'getRelated').mockResolvedValue([])
    renderSlug('missing')
    await waitFor(() => expect(screen.getByText(/does not exist/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/pages/ArticlePage.test.jsx`
Expected: FAIL — ArticlePage is hardcoded.

- [ ] **Step 3: Rewrite `src/pages/ArticlePage.jsx`**

Keep the scroll/progress logic, nav header, hero/meta layout, and sidebar; drive everything from data and render the body via `Markdown`. Prev/Next become real links (the article hero title uses the existing lowercase styling automatically):
```jsx
import { useRef, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import DotLabel from '../components/DotLabel'
import IconButton from '../components/IconButton'
import PillButton from '../components/PillButton'
import RelatedCard from '../components/RelatedCard'
import ProgressBar from '../components/ProgressBar'
import Markdown from '../components/Markdown'
import { Loading, ErrorState, NotFound } from '../components/StateViews'
import { usePost, useRelated } from '../hooks/posts'
import { formatReadTime, formatComplexity, formatCode } from '../lib/format'
import './ArticlePage.css'

export default function ArticlePage() {
  const { slug } = useParams()
  const { data, loading, error } = usePost(slug)
  const { data: related } = useRelated(slug)

  const viewportRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const post = data?.post

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const handleScroll = () => {
      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight > 0) setProgress(Math.round((scrollTop / scrollHeight) * 100))
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [post])

  if (loading) return <Loading />
  if (error) return error.status === 404 ? <NotFound /> : <ErrorState message="Could not load this article." />
  if (!post) return <NotFound />

  const { prev, next } = data

  return (
    <main className="editorial-grid article-grid">
      <section className="article-viewport" ref={viewportRef}>
        <nav className="nav-header">
          <DotLabel color="var(--p-purple)">
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              Quantum Media / {formatCode(post.codeNumber)}
            </Link>
          </DotLabel>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <IconButton ariaLabel="Bookmark" className="icon-btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </IconButton>
            <IconButton ariaLabel="Share" className="icon-btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </IconButton>
          </div>
        </nav>

        <header className="article-hero">
          <h1>{post.title}</h1>
          <div className="hero-meta">
            <div className="meta-item">
              <div className="label">Author</div>
              <div className="value">{post.author}</div>
            </div>
            <div className="meta-item">
              <div className="label">Read Time</div>
              <div className="value">{formatReadTime(post.readMinutes)}</div>
            </div>
            <div className="meta-item">
              <div className="label">Complexity</div>
              <div className="value">{formatComplexity(post.complexity)}</div>
            </div>
          </div>
        </header>

        <div className="article-body">
          <Markdown>{post.bodyMd}</Markdown>
        </div>
      </section>

      <aside className="sidebar">
        <h2>Related<br />Signals</h2>

        <div className="related-list">
          {(related ?? []).map((r) => (
            <RelatedCard
              key={r.slug}
              slug={r.slug}
              title={r.title}
              category={r.category}
              codeNumber={r.codeNumber}
              accent={r.accent}
            />
          ))}
        </div>

        <ProgressBar label="Reading Progress" percent={progress} />

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          {prev ? (
            <PillButton color="var(--p-yellow)" as={Link} to={`/article/${prev.slug}`} style={{ flex: 1 }}>
              Previous
            </PillButton>
          ) : (
            <PillButton color="var(--p-yellow)" href="#" style={{ flex: 1 }}>Previous</PillButton>
          )}
          {next ? (
            <PillButton color="var(--p-blue-light)" as={Link} to={`/article/${next.slug}`} style={{ flex: 1 }}>
              Next
            </PillButton>
          ) : (
            <PillButton color="var(--p-blue-light)" href="#" style={{ flex: 1 }}>Next</PillButton>
          )}
        </div>
      </aside>
    </main>
  )
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npm run test:client -- src/pages/ArticlePage.test.jsx`
Expected: PASS (render + 404 case).

- [ ] **Step 5: Commit**

```bash
git add src/pages/ArticlePage.jsx src/pages/ArticlePage.test.jsx
git commit -m "feat: data-driven ArticlePage with markdown, related, prev/next, states"
```

---

## Task 22: App routing + drop-cap CSS

**Files:**
- Modify: `src/App.jsx`, `src/pages/ArticlePage.css`
- Create: `src/App.test.jsx`

- [ ] **Step 1: Write the failing test — `src/App.test.jsx`**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import * as api from './api/posts.js'

beforeEach(() => vi.restoreAllMocks())

describe('routing', () => {
  it('renders ArticlePage at /article/:slug', async () => {
    vi.spyOn(api, 'getPost').mockResolvedValue({
      post: {
        slug: 's', title: 'Routed', bodyMd: 'Body.', author: 'A',
        readMinutes: 5, complexity: 'Mid', category: 'Theory', accent: 'teal', codeNumber: 3,
      },
      prev: null,
      next: null,
    })
    vi.spyOn(api, 'getRelated').mockResolvedValue([])
    window.history.pushState({}, '', '/article/s')
    const { default: App } = await import('./App.jsx')
    render(<App />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Routed' })).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test:client -- src/App.test.jsx`
Expected: FAIL — route is `/article` (no `:slug`), so the page does not match.

- [ ] **Step 3: Update `src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ArticlePage from './pages/ArticlePage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 4: Add the drop-cap rule to `src/pages/ArticlePage.css`**

After the existing `.article-body .dropcap { … }` block (around `ArticlePage.css:87-95`), add a rule that targets the markdown-generated first paragraph (the old `.dropcap` span no longer exists):
```css
/* Drop cap for markdown-rendered body: first paragraph, first letter. */
.article-body > p:first-of-type::first-letter {
  float: left;
  font-size: 5rem;
  line-height: 0.8;
  padding-top: 0.5rem;
  padding-right: 0.8rem;
  color: var(--p-pink);
  font-weight: 700;
}
```

- [ ] **Step 5: Run it to verify pass**

Run: `npm run test:client -- src/App.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/App.test.jsx src/pages/ArticlePage.css
git commit -m "feat: route /article/:slug and add markdown drop-cap rule"
```

---

## Task 23: Full suite + manual dev verification

**Files:**
- None (verification task); fix-ups as needed in already-created files

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: client and server suites both pass. If anything fails, fix it before continuing (do not proceed with red tests).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors. Fix any introduced lint issues (unused imports, etc.).

- [ ] **Step 3: Start dev (DB must be seeded — Task 11 Step 7)**

Run: `npm run dev`
Expected: Vite on `http://localhost:5173`, API log "API listening on :3001". Vite proxies `/api`.

- [ ] **Step 4: Manually verify the flows (browser)**

Confirm each:
- Home renders the featured Hero, the Theory pane, and the feed — all from the DB.
- Clicking a feed item's "More" navigates to `/article/<slug>` and shows the markdown body, drop cap, meta, related cards, and the reading-progress bar moving on scroll.
- An article with a titled markdown image shows the `.immersive-break` with caption.
- Prev/Next move between adjacent articles; ends disable gracefully.
- Tag pills (Hardware/Algorithms/Cryptography) filter the feed via `/?category=…`; Hero/Theory stay pinned and do not duplicate in the feed.
- Refreshing the browser on `/article/<slug>` still works in `npm start` mode (build first — see Step 5).

- [ ] **Step 5: Verify the production single-service path**

Run:
```bash
npm run build
npm start
```
Then open `http://localhost:3001/article/<some-seeded-slug>` directly and refresh.
Expected: the SPA loads from Express (`dist/` + fallback), and `GET http://localhost:3001/api/home` returns JSON.

- [ ] **Step 6: Commit any fix-ups**

```bash
git add -A
git commit -m "test: green full suite; fixups from manual verification" || echo "nothing to commit"
```

---

## Task 24: Provision Postgres + deploy on Railway

**Files:**
- Possibly: a Railway config if the skill recommends one (e.g., start command / build command)

> **Use the `use-railway` skill for this task.** It owns project creation, Postgres provisioning, variables, and deploy. The steps below are the contract to fulfill, not raw CLI to guess.

- [ ] **Step 1: Invoke the Railway skill**

Use the `use-railway` skill. Goal: one service running this repo + one Postgres plugin.

- [ ] **Step 2: Provision Postgres and capture `DATABASE_URL`**

Provision a Postgres instance in the project; expose its connection string to the app service as `DATABASE_URL`.

- [ ] **Step 3: Configure the service build/start**

- Build command: `npm install && npm run build && npm run db:deploy`
- Start command: `npm start`
- Ensure `NODE_ENV=production` so Express serves `dist/` + SPA fallback.
- Railway injects `PORT`; `server/index.js` already reads it.

- [ ] **Step 4: Seed the production database once**

After the first successful deploy/migrate, run the seed against the Railway DB (via the skill's run/exec mechanism): `npm run db:seed`.
Expected: "Seeded 12 posts" (idempotent — safe to re-run).

- [ ] **Step 5: Verify the live deployment**

- `GET https://<railway-domain>/api/home` returns JSON with `featured`/`theory`/`recent`.
- The site loads, articles open, deep-link refresh works.

- [ ] **Step 6: Commit any Railway config files produced**

```bash
git add -A
git commit -m "chore: Railway deploy config for single-service blog" || echo "nothing to commit"
```

---

## Self-Review (completed during authoring)

**Spec coverage:** `/api/home` (T9), multi-`exclude` + `category`/`limit` validation (T6, T9), total-order adjacency via raw SQL (T8), featured invariant — partial index (T4) + fallback (T7), enums + `readMinutes` (T3), markdown drop cap (T22) + immersive break (T16), SPA fallback ordering (T10), no CORS (T9 app has none), idempotent upsert seed (T11), `bodyMd` only on single endpoint (T7/T8/T9 selects + tests), test DB isolation (T5), all navigational links — Hero/Theory/Feed/Related/Prev-Next/tag pills (T17–T22), 12 articles (T11), loading/error/not-found (T15, T20, T21), Railway deploy (T24). No gaps found.

**Placeholder scan:** the only deferred prose is the body text of 11 markdown articles (T11 Step 2), which is content authoring, not code — bounded by an explicit length/shape contract and one complete worked example. All code steps contain full code.

**Type/name consistency:** `cardSelect`, `getHomeData`, `listPosts`, `getPostBySlug`, `getAdjacent`, `getRelated` (queries); `parseCategory/parseLimit/parseExclude` + `ValidationError` (validate); `apiFetch`/`HttpError` (client); `getHome/getPosts/getPost/getRelated` (api); `useAsync`/`useHome/usePost/usePosts/useRelated` (hooks); `formatReadTime/formatComplexity/accentVar/formatCode` (format) — names are used consistently across tasks. `createApp({ staticDir })` signature matches its tests. The `PillButton as={Link}` dependency is called out with an inspect-first note in T18 and reused in T19/T21.
