import { PrismaClient } from '@prisma/client'

// Single shared client; avoids exhausting connections during dev hot-reload.
const globalForPrisma = globalThis
export const prisma = globalForPrisma.__prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma
