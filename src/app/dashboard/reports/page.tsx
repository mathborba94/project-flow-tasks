import { getCurrentUserWithOrg } from '@/services/auth'
import { BarChart3, Clock, Users, AlertTriangle, FolderKanban, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const reports = [
  {
    slug: 'posicao-resumida',
    title: 'Posição Resumida',
    description: 'Visão geral de projetos, tarefas, horas e custos',
    icon: BarChart3,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    slug: 'consumo-horas',
    title: 'Consumo de Horas',
    description: 'Horas registradas por período, projeto e usuário',
    icon: Clock,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    slug: 'alocacao-usuarios',
    title: 'Alocação de Usuários',
    description: 'Total de horas por usuário no mês e tarefas em andamento',
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    slug: 'tarefas-atrasadas',
    title: 'Tarefas Atrasadas',
    description: 'Tarefas com data de vencimento passada e não concluídas',
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  {
    slug: 'situacao-projetos',
    title: 'Situação de Projetos',
    description: 'Saúde dos projetos: progresso, orçamento vs realizado, atrasos',
    icon: FolderKanban,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
]

export default async function ReportsIndexPage() {
  let organizationId = 'demo-org'
  try {
    const { organizationId: orgId } = await getCurrentUserWithOrg()
    organizationId = orgId
  } catch {}

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Relatórios</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Análise detalhada da sua operação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report, i) => (
          <Link
            key={report.slug}
            href={`/dashboard/reports/${report.slug}`}
            className={`bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700/60 transition-all group animate-fade-in`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`w-10 h-10 ${report.bgColor} rounded-lg flex items-center justify-center mb-3`}>
              <report.icon className={`w-5 h-5 ${report.color}`} />
            </div>
            <h3 className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors mb-1">
              {report.title}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-3">
              {report.description}
            </p>
            <div className="flex items-center gap-1 text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
              Abrir relatório
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
