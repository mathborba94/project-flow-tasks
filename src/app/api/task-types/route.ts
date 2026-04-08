import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const createTaskTypeSchema = z.object({
  name: z.string().min(1).max(100),
  slaMinutes: z.number().int().min(1).max(99999),
  description: z.string().max(500).optional().nullable(),
})

const updateTaskTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slaMinutes: z.number().int().min(1).max(99999).optional(),
  description: z.string().max(500).optional().nullable(),
})

export async function GET() {
  try {
    const { organizationId } = await getCurrentUserWithOrg()

    const taskTypes = await prisma.taskType.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(taskTypes)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const body = await request.json()
    const data = createTaskTypeSchema.parse(body)

    const taskType = await prisma.taskType.create({
      data: {
        organizationId,
        name: data.name.trim(),
        slaMinutes: data.slaMinutes,
        description: data.description?.trim() || null,
      },
    })

    return NextResponse.json(taskType, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ja existe um tipo de tarefa com este nome' },
        { status: 409 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Erro de validacao', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const body = await request.json()
    const { id, ...updateData } = body
    const data = updateTaskTypeSchema.parse(updateData)

    if (!id) {
      return NextResponse.json(
        { error: 'ID e obrigatorio' },
        { status: 400 }
      )
    }

    const existing = await prisma.taskType.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Tipo de tarefa nao encontrado' },
        { status: 404 }
      )
    }

    const taskType = await prisma.taskType.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.slaMinutes !== undefined ? { slaMinutes: data.slaMinutes } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      },
    })

    return NextResponse.json(taskType)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ja existe um tipo de tarefa com este nome' },
        { status: 409 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Erro de validacao', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID e obrigatorio' },
        { status: 400 }
      )
    }

    const existing = await prisma.taskType.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Tipo de tarefa nao encontrado' },
        { status: 404 }
      )
    }

    // Check if org has this as default
    const org = await prisma.organization.findFirst({
      where: { defaultTaskTypeId: id },
    })

    if (org) {
      // Clear the default before deleting
      await prisma.organization.update({
        where: { id: org.id },
        data: { defaultTaskTypeId: null },
      })
    }

    await prisma.taskType.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
