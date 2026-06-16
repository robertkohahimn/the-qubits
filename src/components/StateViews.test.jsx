import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Loading, ErrorState, NotFound } from './StateViews.jsx'

describe('state views', () => {
  it('Loading shows a label', () => {
    render(<Loading />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
  it('ErrorState shows the message', () => {
    render(<ErrorState message="boom" />)
    expect(screen.getByText(/boom/)).toBeInTheDocument()
  })
  it('NotFound links home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
  })
})
