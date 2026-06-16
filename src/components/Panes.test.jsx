import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HeroPane from './HeroPane.jsx'
import TheoryPane from './TheoryPane.jsx'

const post = {
  slug: 'decoherence-silent-killer',
  title: 'Decoherence',
  excerpt: 'noise excerpt',
  heroImage: 'https://x/y.jpg',
  accent: 'purple',
}

function wrap(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('HeroPane', () => {
  it('renders the featured post and links Next to it', () => {
    wrap(<HeroPane post={post} />)
    expect(screen.getByRole('heading', { name: 'Decoherence' })).toBeInTheDocument()
    expect(screen.getByText('noise excerpt')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute(
      'href',
      '/article/decoherence-silent-killer',
    )
  })
})

describe('TheoryPane', () => {
  it('renders the theory post when present', () => {
    wrap(<TheoryPane post={{ ...post, slug: 'superposition-bloch-sphere', title: 'Superposition' }} />)
    expect(screen.getByRole('heading', { name: 'Superposition' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute(
      'href',
      '/article/superposition-bloch-sphere',
    )
  })
  it('renders static fallback copy when post is null', () => {
    wrap(<TheoryPane post={null} />)
    expect(screen.getByRole('heading', { name: /superposition/i })).toBeInTheDocument()
  })
})
