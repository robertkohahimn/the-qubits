import { beforeEach, afterAll } from 'vitest'
import { resetDb } from './factory.js'
import { prisma } from '../db.js'

beforeEach(async () => {
  await resetDb()
})

afterAll(async () => {
  await prisma.$disconnect()
})
