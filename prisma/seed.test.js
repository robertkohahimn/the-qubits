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
