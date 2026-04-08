import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgSlug = searchParams.get('orgSlug')

    if (!orgSlug) {
      return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true, description: true, website: true, publicKnowledgeBase: true, slug: true, logoUrl: true },
    })

    if (!org || !org.publicKnowledgeBase) {
      return NextResponse.json({ error: 'Base de conhecimento não disponível' }, { status: 404 })
    }

    const categories = await prisma.knowledgeCategory.findMany({
      where: { organizationId: org.id, includeInPublic: true },
      include: {
        articles: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Get active support agent for KB widget
    const supportAgent = await prisma.supportAgent.findFirst({
      where: { organizationId: org.id, showOnPublicKB: true, active: true },
      select: { name: true, shareToken: true },
    })

    // Get public projects (with forms enabled)
    const publicProjects = await prisma.project.findMany({
      where: { organizationId: org.id, allowPublicTasks: true, archived: false },
      select: { id: true, name: true, description: true, color: true },
      orderBy: { name: 'asc' },
    })

    // Also get articles without category
    const uncategorized = await prisma.knowledgeBase.findMany({
      where: {
        organizationId: org.id,
        status: 'PUBLISHED',
        categoryId: null,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      organization: {
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        description: org.description,
        website: org.website,
      },
      categories,
      uncategorized,
      publicProjects,
      supportAgent: supportAgent ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
