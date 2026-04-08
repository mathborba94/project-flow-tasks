import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const categories = await prisma.knowledgeCategory.findMany({
      where: { organizationId },
      include: {
        _count: { select: { articles: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const body = await request.json()
    const { name, description, color, includeInPublic } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const category = await prisma.knowledgeCategory.create({
      data: {
        organizationId,
        name,
        description: description || null,
        color: color || '#6B7280',
        includeInPublic: includeInPublic || false,
      },
      include: {
        _count: { select: { articles: true } },
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma categoria com este nome' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const body = await request.json()
    const existing = await prisma.knowledgeCategory.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    const category = await prisma.knowledgeCategory.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.includeInPublic !== undefined && { includeInPublic: body.includeInPublic }),
      },
    })
    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const existing = await prisma.knowledgeCategory.findFirst({
      where: { id, organizationId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    await prisma.knowledgeCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
