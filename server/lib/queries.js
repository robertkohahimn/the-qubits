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
