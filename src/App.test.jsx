import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import * as api from './api/posts.js'

beforeEach(() => vi.restoreAllMocks())

describe('routing', () => {
  it('renders ArticlePage at /article/:slug', async () => {
    vi.spyOn(api, 'getPost').mockResolvedValue({
      post: {
        slug: 's', title: 'Routed', bodyMd: 'Body.', author: 'A',
        readMinutes: 5, complexity: 'Mid', category: 'Theory', accent: 'teal', codeNumber: 3,
      },
      prev: null,
      next: null,
    })
    vi.spyOn(api, 'getRelated').mockResolvedValue([])
    window.history.pushState({}, '', '/article/s')
    const { default: App } = await import('./App.jsx')
    render(<App />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Routed' })).toBeInTheDocument())
  })
})
