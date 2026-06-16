import { apiFetch } from './client.js'

export function getHome() {
  return apiFetch('/home')
}

export function getPosts({ category, exclude = [], limit } = {}) {
  const qs = new URLSearchParams()
  if (category) qs.set('category', category)
  if (exclude.length) qs.set('exclude', exclude.join(','))
  if (limit != null) qs.set('limit', String(limit))
  const suffix = qs.toString() ? `?${qs}` : ''
  return apiFetch(`/posts${suffix}`)
}

export function getPost(slug) {
  return apiFetch(`/posts/${encodeURIComponent(slug)}`)
}

export function getRelated(slug, limit = 3) {
  return apiFetch(`/posts/${encodeURIComponent(slug)}/related?limit=${limit}`)
}
