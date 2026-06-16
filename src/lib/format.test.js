import { describe, it, expect } from 'vitest'
import { formatReadTime, formatComplexity, accentVar, formatCode } from './format.js'

describe('formatReadTime', () => {
  it('zero-pads to NN mins', () => {
    expect(formatReadTime(8)).toBe('08 mins')
    expect(formatReadTime(12)).toBe('12 mins')
  })
})

describe('formatComplexity', () => {
  it('renders enum as "… Tier"', () => {
    expect(formatComplexity('High')).toBe('High Tier')
    expect(formatComplexity('Entry')).toBe('Entry Tier')
  })
})

describe('accentVar', () => {
  it('maps accent enums to CSS vars', () => {
    expect(accentVar('purple')).toBe('var(--p-purple)')
    expect(accentVar('blueLight')).toBe('var(--p-blue-light)')
    expect(accentVar('orange')).toBe('var(--p-orange-line)')
  })
  it('falls back to purple for unknown', () => {
    expect(accentVar('???')).toBe('var(--p-purple)')
  })
})

describe('formatCode', () => {
  it('zero-pads to 3 digits', () => {
    expect(formatCode(42)).toBe('042')
    expect(formatCode(9)).toBe('009')
  })
})
