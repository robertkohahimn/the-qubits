import { Router } from 'express'
import { parseCategory, parseLimit, parseExclude } from '../lib/validate.js'
import {
  getHomeData,
  listPosts,
  getPostBySlug,
  getAdjacent,
  getRelated,
} from '../lib/queries.js'

export const postsRouter = Router()

postsRouter.get('/home', async (req, res, next) => {
  try {
    res.json(await getHomeData())
  } catch (err) {
    next(err)
  }
})

postsRouter.get('/posts', async (req, res, next) => {
  try {
    const category = parseCategory(req.query.category)
    const exclude = parseExclude(req.query.exclude)
    const limit = parseLimit(req.query.limit, 6)
    res.json(await listPosts({ category, exclude, limit }))
  } catch (err) {
    next(err)
  }
})

postsRouter.get('/posts/:slug', async (req, res, next) => {
  try {
    const post = await getPostBySlug(req.params.slug)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    const { prev, next: nextPost } = await getAdjacent(req.params.slug)
    res.json({ post, prev, next: nextPost })
  } catch (err) {
    next(err)
  }
})

postsRouter.get('/posts/:slug/related', async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 3)
    res.json(await getRelated(req.params.slug, limit))
  } catch (err) {
    next(err)
  }
})
