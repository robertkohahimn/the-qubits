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
