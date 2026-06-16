import express from 'express'
import { postsRouter } from './routes/posts.js'

export function createApp({ staticDir } = {}) {
  const app = express()
  app.use(express.json())
  app.use('/api', postsRouter)

  // API 404 (registered before the SPA fallback so it cannot be shadowed).
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

  if (staticDir) {
    app.use(express.static(staticDir))
    // SPA fallback LAST: every non-/api, non-asset path returns index.html.
    app.get('*', (req, res) => res.sendFile('index.html', { root: staticDir }))
  }

  // Centralized error handler: ValidationError -> 400, else 500.
  // 4xx keep their message (useful validation feedback); 5xx return a generic
  // message so internal details (stack/driver errors) are never leaked.
  app.use((err, req, res, _next) => {
    const status = err.status ?? 500
    if (status >= 500) console.error(err)
    const message = status >= 500 ? 'Internal Server Error' : (err.message ?? 'Bad Request')
    res.status(status).json({ error: message })
  })

  return app
}

export const app = createApp()
