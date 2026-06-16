import { prisma } from '../db.js'

let seq = 0

export async function resetDb() {
  // Truncate restarts identity so id ordering is deterministic per test.
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Post" RESTART IDENTITY CASCADE;')
  // Keep the fixture sequence in lockstep with the reset DB ids.
  seq = 0
}

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
