import 'dotenv/config' // load .env so `node prisma/seed.js` has DATABASE_URL (Prisma CLI auto-loads, plain node does not)
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
