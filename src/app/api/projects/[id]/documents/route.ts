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

    const project = await prisma.project.findUnique({
      where: { id, organizationId },
    })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const documents = await prisma.projectDocument.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await getCurrentUserWithOrg()

    const project = await prisma.project.findUnique({
      where: { id, organizationId },
    })
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { name, fileUrl, type = 'ATTACHMENT' } = body

    if (!name || !fileUrl) {
      return NextResponse.json(
        { error: 'name e fileUrl são obrigatórios' },
        { status: 400 }
      )
    }

    const document = await prisma.projectDocument.create({
      data: {
        organizationId,
        projectId: id,
        name,
        fileUrl,
        type,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await getCurrentUserWithOrg()

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId é obrigatório' },
        { status: 400 }
      )
    }

    const document = await prisma.projectDocument.findUnique({
      where: { id: documentId },
    })

    if (!document || document.projectId !== id || document.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    await prisma.projectDocument.delete({
      where: { id: documentId },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao remover documento' },
      { status: 500 }
    )
  }
}
