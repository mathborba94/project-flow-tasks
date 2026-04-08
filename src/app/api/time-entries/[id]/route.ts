import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await getCurrentUserWithOrg()

    const entry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (!entry || entry.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
    }

    await prisma.timeEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover registro' }, { status: 500 })
  }
}
