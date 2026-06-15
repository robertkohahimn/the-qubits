import { describe, it, expect } from 'vitest'
import { parseCategory, parseLimit, parseExclude, ValidationError } from './validate.js'

describe('parseCategory', () => {
  it('accepts a valid category', () => {
    expect(parseCategory('Hardware')).toBe('Hardware')
  })
  it('returns undefined when absent', () => {
    expect(parseCategory(undefined)).toBeUndefined()
  })
  it('throws on invalid category', () => {
    expect(() => parseCategory('Nope')).toThrow(ValidationError)
  })
})

describe('parseLimit', () => {
  it('uses the fallback when absent', () => {
    expect(parseLimit(undefined, 6)).toBe(6)
  })
  it('clamps above 50', () => {
    expect(parseLimit('999', 6)).toBe(50)
  })
  it('clamps below 1', () => {
    expect(parseLimit('0', 6)).toBe(1)
  })
  it('throws on non-integer', () => {
    expect(() => parseLimit('abc', 6)).toThrow(ValidationError)
  })
})

describe('parseExclude', () => {
  it('returns [] when absent', () => {
    expect(parseExclude(undefined)).toEqual([])
  })
  it('splits a CSV string', () => {
    expect(parseExclude('a,b,c')).toEqual(['a', 'b', 'c'])
  })
  it('accepts a repeated-param array', () => {
    expect(parseExclude(['a', 'b'])).toEqual(['a', 'b'])
  })
  it('dedupes and drops blanks', () => {
    expect(parseExclude('a,,a,b')).toEqual(['a', 'b'])
  })
})
