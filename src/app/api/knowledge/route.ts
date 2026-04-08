import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const where: any = { organizationId }
    if (categoryId) where.categoryId = categoryId

    const articles = await prisma.knowledgeBase.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(articles)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const body = await request.json()
    const { title, content, status, categoryId } = body

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    const article = await prisma.knowledgeBase.create({
      data: {
        organizationId,
        title,
        content: content || '',
        status: status || 'DRAFT',
        categoryId: categoryId || null,
      },
      include: { category: { select: { id: true, name: true } } },
    })
    return NextResponse.json(article, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
