import { prisma } from '../db.js'
import { Prisma } from '@prisma/client'

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
