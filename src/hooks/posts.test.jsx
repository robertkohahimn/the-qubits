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
