import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const { organizationId } = await getCurrentUserWithOrg()

    const users = await prisma.user.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(users)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}
