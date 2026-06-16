import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import request from 'supertest'
import { createApp } from './app.js'

let dir
let app

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'dist-'))
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>app</title>')
  app = createApp({ staticDir: dir })
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('SPA fallback', () => {
  it('serves index.html for a client route', async () => {
    const res = await request(app).get('/article/anything')
    expect(res.status).toBe(200)
    expect(res.text).toContain('<title>app</title>')
  })

  it('does not let the fallback shadow /api (unknown api route still JSON/404)', async () => {
    const res = await request(app).get('/api/posts/none')
    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/json/)
  })
})
