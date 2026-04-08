import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await getCurrentUserWithOrg()

    if (id !== organizationId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const org = await prisma.organization.findUnique({
      where: { id },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    return NextResponse.json(org)
  } catch {
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await getCurrentUserWithOrg()

    if (id !== organizationId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, website, timezone, logoUrl, publicKnowledgeBase } = body

    // Validate slug uniqueness if changed
    if (slug && slug !== organizationId) {
      const existing = await prisma.organization.findUnique({
        where: { slug },
      })
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'Slug já está em uso' },
          { status: 409 }
        )
      }
    }

    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(website !== undefined && { website }),
        ...(timezone && { timezone }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(publicKnowledgeBase !== undefined && { publicKnowledgeBase }),
      },
    })

    return NextResponse.json(org)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
