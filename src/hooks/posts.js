import { useAsync } from './useAsync.js'
import { getHome, getPost, getPosts, getRelated } from '../api/posts.js'

export function useHome() {
  return useAsync(() => getHome(), [])
}

export function usePost(slug) {
  return useAsync(() => getPost(slug), [slug], Boolean(slug))
}

export function useRelated(slug, limit = 3) {
  return useAsync(() => getRelated(slug, limit), [slug, limit], Boolean(slug))
}

// params=null => disabled (used when no category filter is active).
export function usePosts(params) {
  const key = params ? JSON.stringify(params) : null
  return useAsync(() => getPosts(params), [key], Boolean(params))
}
