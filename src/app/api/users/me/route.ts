import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getCurrentUserWithOrg()
    const body = await request.json()
    const { name } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
