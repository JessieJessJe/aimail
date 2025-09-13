import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { spec, name } = await request.json()
    const { id } = await params

    // Validate JSON if spec is provided
    if (spec) {
      try {
        JSON.parse(spec)
      } catch {
        return NextResponse.json({ error: 'Invalid JSON in spec' }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (spec !== undefined) updateData.spec = spec
    if (name !== undefined) updateData.name = name

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}