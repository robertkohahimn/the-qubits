import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FeedItem from './FeedItem.jsx'
import RelatedCard from './RelatedCard.jsx'

function wrap(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('FeedItem', () => {
  it('links to the article by slug', () => {
    wrap(<FeedItem slug="shors-algorithm-in-practice" title="Shor" description="d" accent="purple" />)
    const link = screen.getByRole('link', { name: /more/i })
    expect(link).toHaveAttribute('href', '/article/shors-algorithm-in-practice')
  })
})

describe('RelatedCard', () => {
  it('links to the article and shows category/code tag', () => {
    wrap(<RelatedCard slug="topological-qubits" title="Topo" category="Hardware" codeNumber={61} accent="teal" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/article/topological-qubits')
    expect(screen.getByText('Hardware / 061')).toBeInTheDocument()
  })
})
