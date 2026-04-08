import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const body = await request.json()

    const updateData: any = {}
    if ('publicKnowledgeBase' in body) updateData.publicKnowledgeBase = body.publicKnowledgeBase

    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    })
    return NextResponse.json(org)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
