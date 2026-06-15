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
