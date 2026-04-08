import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  defaultTaskTypeId: z.string().cuid().nullable(),
})

export async function PATCH(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const body = await request.json()
    const { defaultTaskTypeId } = schema.parse(body)

    // If setting a default, verify the task type belongs to this org
    if (defaultTaskTypeId) {
      const tt = await prisma.taskType.findFirst({
        where: { id: defaultTaskTypeId, organizationId },
      })
      if (!tt) {
        return NextResponse.json(
          { error: 'Tipo de tarefa nao encontrado' },
          { status: 404 }
        )
      }
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { defaultTaskTypeId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Erro de validacao', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
