export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
    this.status = 400
  }
}

const CATEGORIES = new Set(['Hardware', 'Algorithms', 'Theory', 'Cryptography'])

export function parseCategory(raw) {
  if (raw === undefined || raw === '') return undefined
  if (!CATEGORIES.has(raw)) throw new ValidationError(`Unknown category: ${raw}`)
  return raw
}

export function parseLimit(raw, fallback) {
  if (raw === undefined || raw === '') return fallback
  if (!/^\d+$/.test(String(raw))) throw new ValidationError(`Invalid limit: ${raw}`)
  const n = Number(raw)
  return Math.min(50, Math.max(1, n))
}

export function parseExclude(raw) {
  if (raw === undefined) return []
  const parts = Array.isArray(raw) ? raw : String(raw).split(',')
  const seen = new Set()
  const out = []
  for (const p of parts) {
    const s = p.trim()
    if (s && !seen.has(s)) {
      seen.add(s)
      out.push(s)
    }
  }
  return out
}
