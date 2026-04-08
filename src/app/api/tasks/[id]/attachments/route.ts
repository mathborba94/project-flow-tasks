import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await getCurrentUserWithOrg()

    const task = await prisma.task.findFirst({
      where: { id, organizationId },
    })
    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(attachments)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar anexos' },
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

    const task = await prisma.task.findFirst({
      where: { id, organizationId },
    })
    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'file é obrigatório' }, { status: 400 })
    }

    const fileName = `tasks/${id}/${Date.now()}-${file.name}`
    const { data, error } = await supabaseAdmin.storage
      .from('files')
      .upload(fileName, file, { upsert: true, contentType: file.type })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao fazer upload: ' + error.message },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('files')
      .getPublicUrl(fileName)

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: id,
        projectId: task.projectId,
        name: file.name,
        fileUrl: urlData.publicUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
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
    const attachmentId = searchParams.get('attachmentId')

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'attachmentId é obrigatório' },
        { status: 400 }
      )
    }

    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
      include: { task: true },
    })

    if (!attachment || attachment.task?.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      )
    }

    // Delete from storage
    const fileName = attachment.fileUrl.split('/').slice(-2).join('/')
    await supabaseAdmin.storage.from('files').remove([`tasks/${attachment.taskId}/${fileName.split('/').pop()}`]).catch(() => {})

    await prisma.taskAttachment.delete({ where: { id: attachmentId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao remover anexo' },
      { status: 500 }
    )
  }
}
