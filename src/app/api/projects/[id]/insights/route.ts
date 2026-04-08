import { NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { organizationId } = await getCurrentUserWithOrg()

    const project = await prisma.project.findUnique({
      where: { id, organizationId },
      include: {
        tasks: {
          include: {
            assignedTo: { select: { name: true } },
            timeEntries: { select: { minutes: true } },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const tasks = project.tasks
    const totalTasks = tasks.length
    const doneTasks = tasks.filter(t => t.status === 'DONE').length
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const todoTasks = tasks.filter(t => t.status === 'TODO').length
    const cancelledTasks = tasks.filter(t => t.status === 'CANCELLED').length
    const totalMinutes = tasks.reduce((sum, t) =>
      sum + t.timeEntries.reduce((s, e) => s + e.minutes, 0), 0
    )
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10

    const highPriority = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length
    const overdue = tasks.filter(t => {
      if (!t.completedAt && t.status !== 'DONE') {
        const daysSinceCreated = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceCreated > 14
      }
      return false
    }).length

    const prompt = `Analise o projeto "${project.name}" (${project.type === 'SCOPE_FIXED' ? 'Escopo Fechado' : 'Contínuo'}) e forneça insights pricos em português.

Dados do projeto:
- Status: ${project.status}
- Total de tarefas: ${totalTasks}
- Concluídas: ${doneTasks} (${totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0}%)
- Em progresso: ${inProgressTasks}
- A fazer: ${todoTasks}
- Canceladas: ${cancelledTasks}
- Horas totais: ${totalHours}h
- Tarefas alta prioridade: ${highPriority}
- Tarefas possivelmente atrasadas (>14 dias): ${overdue}

Forneça:
1. Um resumo do estado atual (2-3 frases)
2. Principais riscos ou preocupações
3. Recomendações de ação prioritárias
4. Um insight surpreendente sobre os dados

Seja conciso, direto e prático. Use markdown básico para formatação.`

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    })

    const insight = completion.choices[0]?.message?.content || 'Não foi possível gerar insights no momento.'

    return NextResponse.json({ insight })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'

    // Fallback se OpenAI falhar
    return NextResponse.json({
      insight: 'Não foi possível conectar ao serviço de IA no momento. Verifique sua conexão e tente novamente.',
      error: message,
    }, { status: 200 })
  }
}
