import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

const testEnv = dotenv.config({ path: '.env.test' }).parsed || {}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['server/**/*.test.js', 'prisma/**/*.test.js'],
    setupFiles: './server/test/setup.js',
    fileParallelism: false, // share one test DB; avoid cross-file races
    env: testEnv, // DATABASE_URL from .env.test, available before modules load
  },
})
