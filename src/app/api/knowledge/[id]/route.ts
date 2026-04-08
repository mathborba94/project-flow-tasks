import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params
    const article = await prisma.knowledgeBase.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
      },
    })
    if (!article) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }
    return NextResponse.json(article)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.knowledgeBase.findFirst({
      where: { id, organizationId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }

    const article = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
      },
      include: { category: true },
    })
    return NextResponse.json(article)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params

    const existing = await prisma.knowledgeBase.findFirst({
      where: { id, organizationId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }

    await prisma.knowledgeBase.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
