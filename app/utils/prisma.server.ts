import process from 'node:process'
import { PrismaClient } from '@prisma/client'

const prismaGlobal = globalThis as typeof globalThis & {
    prisma?: PrismaClient
}

export const prisma: PrismaClient
    = prismaGlobal.prisma
    || new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

if (process.env.NODE_ENV !== 'production') {
    prismaGlobal.prisma = prisma
}
