import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createApp } from './app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const staticDir = isProd ? join(__dirname, '..', 'dist') : undefined

const app = createApp({ staticDir })
const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`API listening on :${port}${isProd ? ' (serving dist/)' : ''}`)
})
