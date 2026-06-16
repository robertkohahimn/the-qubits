import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Markdown from './Markdown.jsx'

describe('Markdown', () => {
  it('renders paragraphs and headings', () => {
    render(<Markdown>{'# Title\n\nHello world.'}</Markdown>)
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('Hello world.')).toBeInTheDocument()
  })

  it('wraps a titled image in an immersive break with caption', () => {
    const { container } = render(
      <Markdown>{'![alt text](https://x/y.jpg "Near Absolute Zero")'}</Markdown>,
    )
    const wrapper = container.querySelector('.immersive-break')
    expect(wrapper).toBeTruthy()
    expect(wrapper.querySelector('img')).toHaveAttribute('alt', 'alt text')
    expect(wrapper.querySelector('.break-overlay h3').textContent).toBe('Near Absolute Zero')
  })

  it('does not nest the break div inside a <p>', () => {
    const { container } = render(
      <Markdown>{'![a](https://x/y.jpg "Cap")'}</Markdown>,
    )
    expect(container.querySelector('p .immersive-break')).toBeNull()
  })
})
