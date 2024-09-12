import process from 'node:process'
import { PrismaClient } from '@prisma/client'
import { withOptimize } from '@prisma/extension-optimize'

const prismaGlobal = globalThis as typeof globalThis & {
    prisma?: PrismaClient
}

export const prisma: PrismaClient
    = prismaGlobal.prisma
    || new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }).$extends(withOptimize({ apiKey: process.env.PRISMA_OPTIMIZE_API_KEY || '' }))

if (process.env.NODE_ENV !== 'production') {
    prismaGlobal.prisma = prisma
}
