import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getHome, getPosts, getPost, getRelated } from './posts.js'
import { HttpError } from './client.js'

const originalFetch = global.fetch

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  // These tests assign global.fetch directly; restoreAllMocks won't undo that.
  global.fetch = originalFetch
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
