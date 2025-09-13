import { PrismaClient } from '@prisma/client'
import { DEFAULT_USER_SPEC } from '../src/lib/db'

const prisma = new PrismaClient()

async function main() {
  // Create sample users
  const users = [
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
      spec: JSON.stringify({
        ...DEFAULT_USER_SPEC,
        preferences: {
          ...DEFAULT_USER_SPEC.preferences,
          topics: ['technology', 'startups', 'AI'],
          sendTime: '08:00'
        }
      })
    },
    {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      spec: JSON.stringify({
        ...DEFAULT_USER_SPEC,
        preferences: {
          ...DEFAULT_USER_SPEC.preferences,
          topics: ['programming', 'web development', 'open source'],
          excludeTopics: ['crypto'],
          sendTime: '09:30'
        },
        tone: 'casual'
      })
    },
    {
      email: 'alex.johnson@example.com',
      name: 'Alex Johnson',
      spec: JSON.stringify({
        ...DEFAULT_USER_SPEC,
        preferences: {
          ...DEFAULT_USER_SPEC.preferences,
          topics: ['security', 'privacy', 'blockchain'],
          sendTime: '07:00'
        },
        length: 'short'
      })
    }
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData
    })
    console.log(`Created/found user: ${user.email}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })