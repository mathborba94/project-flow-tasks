import { getCurrentUserWithOrg } from '@/services/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Bot, Plus, MessageSquare, ExternalLink, Zap } from 'lucide-react'

export default async function SupportAgentsPage() {
  const { organizationId } = await getCurrentUserWithOrg()

  const agents = await prisma.supportAgent.findMany({
    where: { organizationId },
    include: {
      project: { select: { name: true, color: true } },
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const origin = process.env.NEXT_PUBLIC_APP_URL || ''

  return (
    <div className="p-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Agentes de Suporte</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Chatbots com IA para atender seus clientes e criar tarefas automaticamente</p>
        </div>
        <Link
          href="/dashboard/support-agents/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Agente
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Bot className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-400 mb-1">Nenhum agente criado</p>
          <p className="text-xs text-zinc-600 mb-6 max-w-xs mx-auto">
            Crie um agente de suporte com IA para atender clientes, responder dúvidas e criar tarefas automaticamente.
          </p>
          <Link
            href="/dashboard/support-agents/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar primeiro agente
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {agents.map(agent => (
            <div
              key={agent.id}
              className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700/60 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-violet-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-zinc-100">{agent.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${
                      agent.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700/40'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${agent.active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      {agent.active ? 'Ativo' : 'Inativo'}
                    </span>
                    {agent.showOnPublicKB && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        Base de conhecimento
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    {agent.project && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: agent.project.color }} />
                        {agent.project.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {agent._count.sessions} sessões
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={`/public/agent/${agent.shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-md transition-colors"
                    title="Abrir chat"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Link
                    href={`/dashboard/support-agents/${agent.id}`}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-md transition-colors border border-zinc-800"
                  >
                    Configurar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
