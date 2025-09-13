import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Default user spec template
export const DEFAULT_USER_SPEC = {
  preferences: {
    topics: ['technology', 'startups', 'programming'],
    excludeTopics: [],
    sendTime: '09:00',
    timezone: 'UTC',
    frequency: 'daily'
  },
  tone: 'professional',
  length: 'medium',
  includeAnalysis: true
}