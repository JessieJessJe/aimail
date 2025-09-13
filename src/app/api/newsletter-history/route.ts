import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    let newsletters
    
    if (userId) {
      // Get newsletters for specific user
      newsletters = await prisma.newsletter.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        take: 50
      })
    } else {
      // Get all newsletters with user info
      newsletters = await prisma.newsletter.findMany({
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        },
        orderBy: { sentAt: 'desc' },
        take: 100
      })
    }
    
    return NextResponse.json(newsletters)
    
  } catch (error) {
    console.error('Newsletter history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter history' },
      { status: 500 }
    )
  }
}