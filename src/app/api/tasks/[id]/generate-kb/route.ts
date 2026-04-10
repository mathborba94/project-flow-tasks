import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { id } = await params

    const [task, categories] = await Promise.all([
      prisma.task.findFirst({
        where: { id, organizationId },
        include: {
          comments: {
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: 'asc' },
          },
          attachments: { select: { name: true, fileUrl: true } },
          taskType: { select: { name: true } },
          project: { select: { name: true } },
        },
      }),
      prisma.knowledgeCategory.findMany({
        where: { organizationId },
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' },
      }),
    ])

    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    const commentsText = task.comments
      .map(c => `${c.author?.name || 'Anônimo'}: ${c.content}`)
      .join('\n')

    const attachmentsText = task.attachments
      .map(a => `- ${a.name}`)
      .join('\n')

    const categoriesText = categories.length > 0
      ? categories
          .map(c => `- ID: ${c.id} | Nome: ${c.name}${c.description ? ` | Descrição: ${c.description}` : ''}`)
          .join('\n')
      : 'Nenhuma categoria disponível'

    const prompt = `Você é um especialista em documentação técnica. Com base nos dados da tarefa abaixo, gere um artigo para a base de conhecimento em português brasileiro.

DADOS DA TAREFA:
- Título: ${task.title}
- Tipo: ${task.taskType?.name || 'Não definido'}
- Projeto: ${task.project?.name || 'Não definido'}
- Descrição: ${task.description || 'Sem descrição'}
- Comentários:
${commentsText || 'Nenhum comentário'}
- Anexos:
${attachmentsText || 'Nenhum anexo'}

CATEGORIAS DISPONÍVEIS:
${categoriesText}

Gere um artigo informativo, claro e bem estruturado. Responda SOMENTE com um JSON válido:
{
  "title": "Título do artigo",
  "content": "Conteúdo completo em markdown com seções, exemplos e boas práticas extraídas da tarefa",
  "suggestedCategoryId": "ID da categoria mais adequada ou null"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    const suggested = categories.find(c => c.id === result.suggestedCategoryId) || null

    return NextResponse.json({
      title: result.title || task.title,
      content: result.content || '',
      suggestedCategoryId: suggested?.id || null,
      suggestedCategoryName: suggested?.name || null,
      categories,
    })
  } catch (error: any) {
    console.error('KB generation error:', error)
    return NextResponse.json({ error: 'Erro ao gerar artigo' }, { status: 500 })
  }
}
