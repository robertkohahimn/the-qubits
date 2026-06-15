import { describe, it, expect } from 'vitest'
import { createPost } from '../test/factory.js'
import { getHomeData, listPosts, getPostBySlug, getRelated } from './queries.js'
import { getAdjacent } from './queries.js'

describe('getHomeData', () => {
  it('returns featured, theory, and recent excluding those two', async () => {
    await createPost({ slug: 'feat', featured: true, publishedAt: new Date('2026-02-01Z') })
    await createPost({ slug: 'th', category: 'Theory', publishedAt: new Date('2026-01-20Z') })
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
