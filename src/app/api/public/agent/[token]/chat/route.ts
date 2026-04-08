import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'
import { sendTaskCreatedEmail, sendTaskAssignedEmail } from '@/lib/email'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Cria uma nova tarefa/solicitação no projeto da equipe de suporte. Use quando o usuário quer abrir um chamado.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Título da tarefa' },
          description: { type: 'string', description: 'Descrição detalhada do problema ou solicitação' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], description: 'Prioridade da tarefa' },
          requesterName: { type: 'string', description: 'Nome de quem está solicitando' },
          requesterEmail: { type: 'string', description: 'E-mail de quem está solicitando' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_task_status',
      description: 'Consulta o status de uma tarefa pelo ID. Use quando o usuário informar um ID de tarefa para verificar o andamento.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'ID da tarefa (formato cuid)' },
        },
        required: ['taskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_status',
      description: 'Consulta o status geral do projeto vinculado ao agente.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge_base',
      description: 'Busca artigos na base de conhecimento da organização. Use antes de criar uma tarefa para verificar se já existe uma solução.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Termos de busca para encontrar artigos relevantes' },
        },
        required: ['query'],
      },
    },
  },
]

// ─── Tool executors ──────────────────────────────────────────────────────────

async function execCreateTask(args: Record<string, string>, organizationId: string, projectId: string | null, orgName: string) {
  if (!projectId) return { error: 'Nenhum projeto configurado para este agente' }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: {
      pipeline: { include: { stages: { orderBy: { order: 'asc' }, take: 1 } } },
    },
  })
  if (!project) return { error: 'Projeto não encontrado' }

  const firstStageId = project.pipeline?.stages[0]?.id ?? undefined

  const task = await prisma.task.create({
    data: {
      organizationId,
      projectId,
      title: args.title,
      description: args.description || null,
      priority: (args.priority as any) || 'MEDIUM',
      status: 'TODO',
      pipelineStageId: firstStageId,
      requesterName: args.requesterName || null,
      requesterEmail: args.requesterEmail || null,
    },
    select: { id: true, title: true, priority: true, status: true, createdAt: true },
  })

  // Fire-and-forget email to requester
  if (args.requesterEmail) {
    sendTaskCreatedEmail({
      taskId: task.id,
      taskTitle: task.title,
      projectName: project.name,
      orgName,
      priority: task.priority,
      requesterName: args.requesterName || null,
      requesterEmail: args.requesterEmail,
    })
  }

  return {
    success: true,
    taskId: task.id,
    title: task.title,
    priority: task.priority,
    status: task.status,
    message: `Tarefa criada com sucesso! ID: ${task.id}`,
  }
}

async function execGetTaskStatus(args: Record<string, string>, organizationId: string) {
  const task = await prisma.task.findFirst({
    where: { id: args.taskId, organizationId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      assignedTo: { select: { name: true } },
      pipelineStage: { select: { name: true } },
    },
  })

  if (!task) return { error: 'Tarefa não encontrada ou sem permissão de acesso' }

  const statusLabels: Record<string, string> = {
    TODO: 'A fazer', IN_PROGRESS: 'Em andamento', IN_REVIEW: 'Em revisão',
    DONE: 'Concluída', CANCELLED: 'Cancelada',
  }

  return {
    id: task.id,
    title: task.title,
    status: statusLabels[task.status] ?? task.status,
    priority: task.priority,
    stage: task.pipelineStage?.name ?? 'Não atribuída',
    assignedTo: task.assignedTo?.name ?? 'Não atribuída',
    createdAt: task.createdAt,
    completedAt: task.completedAt,
  }
}

async function execGetProjectStatus(organizationId: string, projectId: string | null) {
  if (!projectId) return { error: 'Nenhum projeto configurado' }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: {
      tasks: {
        select: { status: true, priority: true },
      },
    },
  })

  if (!project) return { error: 'Projeto não encontrado' }

  const total = project.tasks.length
  const done = project.tasks.filter(t => t.status === 'DONE').length
  const inProgress = project.tasks.filter(t => t.status === 'IN_PROGRESS').length
  const todo = project.tasks.filter(t => t.status === 'TODO').length
  const urgent = project.tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length

  return {
    name: project.name,
    status: project.status,
    total,
    done,
    inProgress,
    todo,
    urgent,
    completion: total > 0 ? Math.round((done / total) * 100) : 0,
  }
}

async function execSearchKB(args: Record<string, string>, organizationId: string) {
  const articles = await prisma.knowledgeBase.findMany({
    where: {
      organizationId,
      status: 'PUBLISHED',
      OR: [
        { categoryId: null },
        { category: { includeInPublic: true } },
      ],
    },
    select: {
      id: true,
      title: true,
      content: true,
      category: { select: { name: true } },
    },
    take: 30,
  })

  if (articles.length === 0) return { articles: [], message: 'Nenhum artigo encontrado na base de conhecimento' }

  // Use GPT to rank relevant articles
  try {
    const list = articles.map((a, i) => `[${i}] ${a.title}: ${a.content.slice(0, 150)}`).join('\n')
    const ranking = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 40,
      temperature: 0,
      messages: [
        { role: 'system', content: 'Retorne apenas os índices (separados por vírgula) dos 3 artigos mais relevantes para a busca. Ex: 0,4,7' },
        { role: 'user', content: `Busca: "${args.query}"\n\nArtigos:\n${list}` },
      ],
    })
    const indices = (ranking.choices[0]?.message?.content ?? '')
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 0 && n < articles.length)
      .slice(0, 3)

    const top = indices.length > 0 ? indices.map(i => articles[i]) : articles.slice(0, 3)
    return {
      articles: top.map(a => ({
        title: a.title,
        excerpt: a.content.replace(/[#*_`\[\]]/g, '').slice(0, 300),
        category: a.category?.name ?? null,
      })),
    }
  } catch {
    return {
      articles: articles.slice(0, 3).map(a => ({
        title: a.title,
        excerpt: a.content.replace(/[#*_`\[\]]/g, '').slice(0, 300),
        category: a.category?.name ?? null,
      })),
    }
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { sessionToken, message, fileUrl, fileType, fileName } = body

    if (!sessionToken || !message?.trim()) {
      return NextResponse.json({ error: 'sessionToken e message são obrigatórios' }, { status: 400 })
    }

    // Load session + agent
    const session = await prisma.supportSession.findUnique({
      where: { sessionToken },
      include: {
        agent: {
          include: {
            organization: { select: { id: true, name: true, slug: true, description: true, website: true } },
            project: { select: { id: true, name: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true, fileUrl: true, fileType: true, fileName: true },
        },
      },
    })

    if (!session || session.agent.shareToken !== token) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 403 })
    }

    const { agent } = session
    const { organization } = agent

    // Handle audio transcription
    let userText = message.trim()
    if (fileType === 'audio' && fileUrl) {
      try {
        const audioRes = await fetch(fileUrl)
        const audioBlob = await audioRes.blob()
        const ext = fileName?.split('.').pop() || 'webm'
        const audioFile = new File([audioBlob], `audio.${ext}`, { type: audioBlob.type || 'audio/webm' })
        const transcription = await openai.audio.transcriptions.create({ file: audioFile, model: 'whisper-1' })
        userText = `[Áudio transcrito]: ${transcription.text}`
      } catch {
        userText = message.trim() + ' [Áudio recebido mas não foi possível transcrever]'
      }
    }

    if (fileType === 'pdf' && fileUrl) {
      userText = message.trim() + `\n[PDF anexado: ${fileName || 'documento.pdf'}]`
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(agent, organization)

    // Build OpenAI message history
    const history: OpenAI.Chat.ChatCompletionMessageParam[] = session.messages.map(m => {
      if (m.role === 'user') {
        if (m.fileType === 'image' && m.fileUrl) {
          return {
            role: 'user',
            content: [
              { type: 'text', text: m.content },
              { type: 'image_url', image_url: { url: m.fileUrl, detail: 'auto' } },
            ],
          } as OpenAI.Chat.ChatCompletionUserMessageParam
        }
        return { role: 'user', content: m.content }
      }
      return { role: 'assistant', content: m.content }
    })

    // Build user message (potentially multimodal)
    let userMessage: OpenAI.Chat.ChatCompletionMessageParam
    if (fileType === 'image' && fileUrl) {
      userMessage = {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: fileUrl, detail: 'auto' } },
        ],
      }
    } else {
      userMessage = { role: 'user', content: userText }
    }

    // Save user message to DB
    await prisma.supportMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: userText,
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        fileName: fileName || null,
      },
    })

    // First OpenAI call
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      userMessage,
    ]

    const firstResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      max_tokens: 1000,
    })

    const firstChoice = firstResponse.choices[0]
    let assistantContent = firstChoice.message.content ?? ''
    const toolResults: { name: string; result: unknown }[] = []

    // Handle tool calls
    if (firstChoice.finish_reason === 'tool_calls' && firstChoice.message.tool_calls?.length) {
      const toolCallMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...messages,
        firstChoice.message,
      ]

      for (const tc of firstChoice.message.tool_calls) {
        // Only handle standard function tool calls
        if (tc.type !== 'function') continue
        const fn = (tc as any).function as { name: string; arguments: string }
        let result: unknown
        const args = JSON.parse(fn.arguments || '{}')

        switch (fn.name) {
          case 'create_task':
            result = await execCreateTask(args, organization.id, agent.projectId ?? null, organization.name)
            break
          case 'get_task_status':
            result = await execGetTaskStatus(args, organization.id)
            break
          case 'get_project_status':
            result = await execGetProjectStatus(organization.id, agent.projectId ?? null)
            break
          case 'search_knowledge_base':
            result = await execSearchKB(args, organization.id)
            break
          default:
            result = { error: 'Função desconhecida' }
        }

        toolResults.push({ name: fn.name, result })

        toolCallMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        })
      }

      // Second call with tool results
      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: toolCallMessages,
        max_tokens: 1000,
      })

      assistantContent = secondResponse.choices[0]?.message?.content ?? ''
    }

    // Save assistant message
    await prisma.supportMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: assistantContent,
      },
    })

    // Update session timestamp
    await prisma.supportSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      message: assistantContent,
      toolCalls: toolResults,
    })
  } catch (err) {
    console.error('[agent/chat]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function buildSystemPrompt(
  agent: { name: string; personality: string | null; voiceTone: string | null; conductPrompt: string | null; project: { name: string } | null },
  org: { name: string; slug: string; description: string | null; website: string | null }
) {
  const lines: string[] = [
    `Você é ${agent.name}, um agente de suporte da empresa ${org.name}.`,
    '',
    '## Sobre a empresa',
    `Nome: ${org.name}`,
  ]

  if (org.description) lines.push(`Descrição: ${org.description}`)
  if (org.website) lines.push(`Site: ${org.website}`)
  if (org.slug) lines.push(`Base de conhecimento pública: /public/knowledge/${org.slug}`)
  if (agent.project) lines.push(`Projeto de suporte: ${agent.project.name}`)

  lines.push('')
  lines.push('## Sua personalidade e comportamento')

  if (agent.personality) lines.push(`Personalidade: ${agent.personality}`)
  if (agent.voiceTone) lines.push(`Tom de voz: ${agent.voiceTone}`)

  lines.push('')
  lines.push('## Instruções de conduta')
  lines.push('1. Antes de criar uma tarefa, SEMPRE pesquise a base de conhecimento para ver se já existe uma solução.')
  lines.push('2. Se encontrar artigos relevantes, apresente-os e diga que resolver pela base de conhecimento é mais rápido.')
  lines.push('3. Se o usuário ainda quiser criar uma tarefa, colete título, descrição e prioridade antes de criar.')
  lines.push('4. Ao criar a tarefa, confirme os detalhes com o usuário antes de executar.')
  lines.push('5. Forneça o ID da tarefa criada para que o usuário possa acompanhar.')
  lines.push('6. Responda sempre em Português (PT-BR).')

  if (agent.conductPrompt) {
    lines.push('')
    lines.push('## Instruções adicionais')
    lines.push(agent.conductPrompt)
  }

  return lines.join('\n')
}
