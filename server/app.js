import express from 'express'
import { postsRouter } from './routes/posts.js'

export function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api', postsRouter)

  // Centralized error handler: ValidationError -> 400, else 500. No silent failures.
  app.use((err, req, res, _next) => {
    const status = err.status ?? 500
    if (status >= 500) console.error(err)
    res.status(status).json({ error: err.message ?? 'Internal Server Error' })
  })

  return app
}

export const app = createApp()
