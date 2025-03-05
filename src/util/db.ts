import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prismadb =
  globalForPrisma.prisma || new PrismaClient()