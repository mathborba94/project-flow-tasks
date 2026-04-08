import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const agent = await prisma.supportAgent.findUnique({
      where: { shareToken: token, active: true },
      select: { id: true },
    })
    if (!agent) return NextResponse.json({ error: 'Agente inválido' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'bin'
    const path = `agent-chat/${agent.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabaseAdmin.storage.from('files').upload(path, file, {
      upsert: true,
      contentType: file.type,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: urlData } = supabaseAdmin.storage.from('files').getPublicUrl(path)

    // Determine file type category
    let fileType = 'other'
    if (file.type.startsWith('image/')) fileType = 'image'
    else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) fileType = 'audio'
    else if (file.type === 'application/pdf') fileType = 'pdf'

    return NextResponse.json({ publicUrl: urlData.publicUrl, fileType, fileName: file.name })
  } catch {
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}
