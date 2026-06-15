import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import KnowledgePane from './KnowledgePane.jsx'

const posts = [
  { slug: 'a', title: 'A', excerpt: 'ea', accent: 'purple' },
  { slug: 'b', title: 'B', excerpt: 'eb', accent: 'teal' },
]

describe('KnowledgePane', () => {
  it('renders a FeedItem per post with real links', () => {
    render(
      <MemoryRouter>
        <KnowledgePane posts={posts} />
      </MemoryRouter>,
    )
    // One "More" link per post (plan test used singular getByRole, but the
    // component maps every post to a FeedItem, so there are N "More" links).
    expect(screen.getAllByRole('link', { name: /more/i, hidden: false })).toHaveLength(posts.length)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('tag pills link to category-filtered home', () => {
    render(
      <MemoryRouter>
        <KnowledgePane posts={posts} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Hardware' })).toHaveAttribute('href', '/?category=Hardware')
    expect(screen.getByRole('link', { name: 'Algorithms' })).toHaveAttribute('href', '/?category=Algorithms')
    expect(screen.getByRole('link', { name: 'Cryptography' })).toHaveAttribute('href', '/?category=Cryptography')
  })
})
