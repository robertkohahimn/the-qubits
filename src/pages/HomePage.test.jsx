import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage.jsx'
import * as api from '../api/posts.js'

const home = {
  featured: { slug: 'feat', title: 'Featured', excerpt: 'fx', heroImage: 'https://x/y.jpg', accent: 'purple' },
  theory: { slug: 'th', title: 'Theory Post', excerpt: 'tx', accent: 'teal' },
  recent: [{ slug: 'r1', title: 'Recent One', excerpt: 'rx', accent: 'yellow' }],
}

beforeEach(() => vi.restoreAllMocks())

function renderAt(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('shows loading then renders hero, theory, and feed', async () => {
    vi.spyOn(api, 'getHome').mockResolvedValue(home)
    renderAt('/')
    expect(screen.getByRole('status')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Featured' })).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Theory Post' })).toBeInTheDocument()
    expect(screen.getByText('Recent One')).toBeInTheDocument()
  })

  it('uses the filtered list when ?category= is present', async () => {
    vi.spyOn(api, 'getHome').mockResolvedValue(home)
    const getPosts = vi
      .spyOn(api, 'getPosts')
      .mockResolvedValue([{ slug: 'h1', title: 'Hardware One', excerpt: 'hx', accent: 'purple' }])
    renderAt('/?category=Hardware')
    await waitFor(() => expect(screen.getByText('Hardware One')).toBeInTheDocument())
    expect(getPosts).toHaveBeenCalledWith({
      category: 'Hardware',
      exclude: ['feat', 'th'],
      limit: 6,
    })
    expect(screen.queryByText('Recent One')).not.toBeInTheDocument()
  })

  it('shows an error state on failure', async () => {
    vi.spyOn(api, 'getHome').mockRejectedValue(new Error('down'))
    renderAt('/')
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
