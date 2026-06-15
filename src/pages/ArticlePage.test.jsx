import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ArticlePage from './ArticlePage.jsx'
import * as api from '../api/posts.js'
import { HttpError } from '../api/client.js'

const post = {
  slug: 'decoherence-silent-killer',
  title: 'Decoherence',
  bodyMd: '# Heading\n\nBody paragraph about qubits.',
  author: 'Dr. Aris Thorne',
  readMinutes: 8,
  complexity: 'High',
  category: 'Hardware',
  accent: 'purple',
  codeNumber: 42,
}

beforeEach(() => vi.restoreAllMocks())

function renderSlug(slug) {
  return render(
    <MemoryRouter initialEntries={[`/article/${slug}`]}>
      <Routes>
        <Route path="/article/:slug" element={<ArticlePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ArticlePage', () => {
  it('renders the article body, meta, related, and next link', async () => {
    vi.spyOn(api, 'getPost').mockResolvedValue({
      post,
      prev: null,
      next: { slug: 'cryogenic-control-circuits', title: 'Cryo' },
    })
    vi.spyOn(api, 'getRelated').mockResolvedValue([
      { slug: 'topological-qubits', title: 'Topo', category: 'Hardware', codeNumber: 61, accent: 'teal' },
    ])
    renderSlug('decoherence-silent-killer')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Decoherence' })).toBeInTheDocument())
    expect(screen.getByText('Dr. Aris Thorne')).toBeInTheDocument()
    expect(screen.getByText('08 mins')).toBeInTheDocument()
    expect(screen.getByText('High Tier')).toBeInTheDocument()
    expect(screen.getByText('Body paragraph about qubits.')).toBeInTheDocument()
    expect(screen.getByText('Topo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute(
      'href',
      '/article/cryogenic-control-circuits',
    )
  })

  it('shows NotFound on 404', async () => {
    vi.spyOn(api, 'getPost').mockRejectedValue(new HttpError(404, 'Post not found'))
    vi.spyOn(api, 'getRelated').mockResolvedValue([])
    renderSlug('missing')
    await waitFor(() => expect(screen.getByText(/does not exist/i)).toBeInTheDocument())
  })
})
