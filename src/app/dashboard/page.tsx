import { getCurrentOrganization } from '@/services/auth'
import { getOrganizationDashboard } from '@/services/time-entry'
import { FolderKanban, CheckSquare, Clock, DollarSign, Plus, FolderPlus, Users } from 'lucide-react'
import Link from 'next/link'
import DashboardCharts from '@/components/dashboard/charts'

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 animate-fade-in">
      <h1 className="text-base font-semibold text-zinc-100 tracking-tight">{title}</h1>
      <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 hover:border-zinc-700/60 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <Icon className="w-3.5 h-3.5 text-zinc-600" />
      </div>
      <p className="text-2xl font-semibold text-zinc-100 tracking-tight">{value}</p>
    </div>
  )
}

const statusLabels: Record<string, string> = {
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Progresso',
  IN_REVIEW: 'Em Revisão',
  DONE: 'Concluído',
  CANCELLED: 'Cancelado',
}

const statusColors: Record<string, string> = {
  TODO: 'bg-zinc-800 text-zinc-400',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400',
  IN_REVIEW: 'bg-amber-500/10 text-amber-400',
  DONE: 'bg-emerald-500/10 text-emerald-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
}

export default async function DashboardPage() {
  let orgId = 'demo-org'
  let orgName = ''
  try {
    const org = await getCurrentOrganization()
    orgId = org.organization.id
    orgName = org.organization.name
  } catch {
    // demo
  }

  const dashboard = await getOrganizationDashboard(orgId)

  const hasData = (dashboard?.totalProjects || 0) > 0 || (dashboard?.totalTasks || 0) > 0

  if (!hasData) {
    return (
      <div className="p-6 max-w-6xl">
        <PageHeader title="Dashboard" subtitle="Visão geral da sua operação" />

        {/* Welcome Card */}
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-8 mb-6 animate-fade-in">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Bem-vindo ao ProjectFlow!
                </h2>
                <p className="text-sm text-zinc-500">
                  {orgName ? `Organização: ${orgName}` : 'Comece a usar agora'}
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Sua organização está pronta para começar. Crie seu primeiro projeto e adicione tarefas para acompanhar tempo, custos e progresso.
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-2 text-xs font-medium bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Primeiro Projeto
              </Link>
              <Link
                href="/dashboard/team"
                className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 border border-zinc-800 px-4 py-2 rounded-lg hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Convidar Equipe
              </Link>
            </div>
          </div>
        </div>

        {/* Stats (empty) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Projetos" value="0" icon={FolderKanban} />
          <StatCard label="Tarefas" value="0" icon={CheckSquare} />
          <StatCard label="Horas" value="0h" icon={Clock} />
          <StatCard label="Custo" value="R$ 0" icon={DollarSign} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader title="Dashboard" subtitle="Visão geral da sua operação" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="animate-fade-in">
          <StatCard label="Projetos" value={dashboard?.totalProjects || 0} icon={FolderKanban} />
        </div>
        <div className="animate-fade-in-delay">
          <StatCard label="Tarefas" value={dashboard?.totalTasks || 0} icon={CheckSquare} />
        </div>
        <div className="animate-fade-in-delay-2">
          <StatCard label="Horas" value={`${Math.round(dashboard?.totalHours || 0)}h`} icon={Clock} />
        </div>
        <div className="animate-fade-in-delay-3">
          <StatCard label="Custo" value={`R$ ${Math.round(dashboard?.totalCost || 0).toLocaleString('pt-BR')}`} icon={DollarSign} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DashboardCharts />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks by Status */}
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay">
          <h2 className="text-sm font-medium text-zinc-200 mb-4">Tarefas por status</h2>
          <div className="space-y-px">
            {Object.entries(dashboard?.tasksByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[status] || 'bg-zinc-800 text-zinc-400'}`}>
                  {statusLabels[status] || status}
                </span>
                <span className="text-sm font-medium text-zinc-300 tabular-nums">{count as number}</span>
              </div>
            ))}
            {Object.keys(dashboard?.tasksByStatus || {}).length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-6">Nenhuma tarefa encontrada</p>
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay-2">
          <h2 className="text-sm font-medium text-zinc-200 mb-4">Projetos ativos</h2>
          {dashboard?.activeProjects?.length ? (
            <div className="space-y-px">
              {dashboard.activeProjects.map((p: { id: string; name: string }) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projects/${p.id}`}
                  className="flex items-center gap-2 py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors group cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{p.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-600 text-center py-6">Nenhum projeto ativo</p>
          )}
        </div>
      </div>
    </div>
  )
}
