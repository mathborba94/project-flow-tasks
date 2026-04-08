import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    if (!organizationId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'file e projectId são obrigatórios' },
        { status: 400 }
      )
    }

    const fileName = `projects/${projectId}/${Date.now()}-${file.name}`

    const { data, error } = await supabaseAdmin.storage
      .from('files')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Erro ao fazer upload: ' + error.message },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('files')
      .getPublicUrl(fileName)

    return NextResponse.json({
      path: data.path,
      publicUrl: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
