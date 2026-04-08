import { getCurrentUserWithOrg } from '@/services/auth'
import { getOrganizationDashboard } from '@/services/time-entry'
import prisma from '@/lib/prisma'
import {
  FolderKanban, CheckSquare, Clock, DollarSign,
  Plus, Users, AlertCircle, Timer, CircleCheck, CalendarClock,
} from 'lucide-react'
import Link from 'next/link'
import DashboardCharts from '@/components/dashboard/charts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 animate-fade-in">
      <h1 className="text-base font-semibold text-zinc-100 tracking-tight">{title}</h1>
      <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  accent?: string
}) {
  return (
    <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 hover:border-zinc-700/60 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${accent || 'text-zinc-600'}`} />
      </div>
      <p className="text-2xl font-semibold text-zinc-100 tracking-tight tabular-nums">{value}</p>
    </div>
  )
}

const statusLabels: Record<string, string> = {
  TODO: 'A Fazer', IN_PROGRESS: 'Em Andamento', IN_REVIEW: 'Em Revisão',
  DONE: 'Concluído', CANCELLED: 'Cancelado',
}
const statusColors: Record<string, string> = {
  TODO: 'bg-zinc-800 text-zinc-400',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400',
  IN_REVIEW: 'bg-amber-500/10 text-amber-400',
  DONE: 'bg-emerald-500/10 text-emerald-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
}
const priorityColors: Record<string, string> = {
  LOW: 'bg-zinc-800/60 text-zinc-500',
  MEDIUM: 'bg-blue-500/10 text-blue-400',
  HIGH: 'bg-orange-500/10 text-orange-400',
  URGENT: 'bg-red-500/10 text-red-400',
}
const priorityLabels: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
}

function TaskRow({ task }: { task: { id: string; title: string; status: string; priority: string; project?: { name: string } | null } }) {
  return (
    <Link
      href={`/dashboard/tasks/${task.id}`}
      className="flex items-center gap-3 py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors group"
    >
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
        {priorityLabels[task.priority] || task.priority}
      </span>
      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors flex-1 truncate">{task.title}</span>
      {task.project && (
        <span className="text-[10px] text-zinc-600 truncate max-w-[80px]">{task.project.name}</span>
      )}
    </Link>
  )
}

function SectionCard({ title, icon: Icon, children, empty, emptyText }: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children?: React.ReactNode
  empty?: boolean
  emptyText?: string
}) {
  return (
    <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 text-zinc-600" />
        <h2 className="text-sm font-medium text-zinc-300">{title}</h2>
      </div>
      {empty ? (
        <p className="text-xs text-zinc-600 text-center py-5">{emptyText || 'Nenhuma tarefa'}</p>
      ) : children}
    </div>
  )
}

// ─── Motivational phrases ─────────────────────────────────────────────────────

const MOTIVATIONAL_PHRASES = [
  { text: 'Cada tarefa concluída é um passo mais perto do objetivo.', author: 'Anônimo' },
  { text: 'O progresso, não a perfeição, é o que importa.', author: 'Anônimo' },
  { text: 'Grandes conquistas começam com pequenas entregas consistentes.', author: 'Anônimo' },
  { text: 'A disciplina é a ponte entre metas e realizações.', author: 'Jim Rohn' },
  { text: 'Não espere pela motivação. Comece e ela virá.', author: 'Anônimo' },
  { text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier' },
  { text: 'Foco no que você pode controlar. Entregue o melhor dentro disso.', author: 'Anônimo' },
  { text: 'Uma tarefa por vez. Constância vence urgência.', author: 'Anônimo' },
  { text: 'Feito é melhor que perfeito — mas feito com cuidado é melhor ainda.', author: 'Anônimo' },
  { text: 'Seu próximo "concluído" está mais perto do que parece.', author: 'Anônimo' },
  { text: 'O trabalho de hoje é o resultado de amanhã.', author: 'Anônimo' },
  { text: 'Produtividade não é fazer mais — é fazer o que importa.', author: 'Anônimo' },
]

function getRandomPhrase(seed: number) {
  return MOTIVATIONAL_PHRASES[seed % MOTIVATIONAL_PHRASES.length]
}

// ─── Member Dashboard ─────────────────────────────────────────────────────────

async function MemberDashboard({ userId, organizationId, userName }: {
  userId: string
  organizationId: string
  userName: string
}) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [assignedToday, inProgress, lastCompleted, overdue, monthEntries] = await Promise.all([
    // Tarefas atribuídas a mim hoje
    prisma.task.findMany({
      where: {
        organizationId,
        assignedToId: userId,
        createdAt: { gte: todayStart },
        status: { notIn: ['DONE', 'CANCELLED'] },
      },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Minhas tarefas em andamento
    prisma.task.findMany({
      where: { organizationId, assignedToId: userId, status: 'IN_PROGRESS' },
      include: { project: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    // Últimas concluídas por mim
    prisma.task.findMany({
      where: { organizationId, assignedToId: userId, status: 'DONE' },
      include: { project: { select: { name: true } } },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
    // Em atraso
    prisma.task.findMany({
      where: {
        organizationId,
        assignedToId: userId,
        dueDate: { lt: now },
        status: { notIn: ['DONE', 'CANCELLED'] },
      },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    // Horas do mês
    prisma.timeEntry.aggregate({
      where: { organizationId, userId, createdAt: { gte: monthStart } },
      _sum: { minutes: true, costSnapshot: true },
    }),
  ])

  const totalMinutes = monthEntries._sum.minutes || 0
  const totalHours = totalMinutes / 60
  const totalCost = Number(monthEntries._sum.costSnapshot || 0)

  const phrase = getRandomPhrase(now.getDate() + now.getMonth() + lastCompleted.length)
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = userName.split(' ')[0]

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">{greeting}, {firstName} 👋</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </div>

      {/* Stats pessoais do mês */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="animate-fade-in">
          <StatCard label="Atribuídas hoje" value={assignedToday.length} icon={CalendarClock} />
        </div>
        <div className="animate-fade-in-delay">
          <StatCard label="Em andamento" value={inProgress.length} icon={Timer} accent="text-blue-500" />
        </div>
        <div className="animate-fade-in-delay-2">
          <StatCard label="Em atraso" value={overdue.length} icon={AlertCircle} accent={overdue.length > 0 ? 'text-red-400' : 'text-zinc-600'} />
        </div>
        <div className="animate-fade-in-delay-3">
          <StatCard label={`Horas em ${now.toLocaleDateString('pt-BR', { month: 'short' })}`} value={`${totalHours.toFixed(1)}h`} icon={Clock} accent="text-violet-400" />
        </div>
      </div>

      {/* Resumo de horas do mês */}
      {totalMinutes > 0 && (
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-sm font-medium text-zinc-300">
                Resumo de Horas — {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-base font-semibold text-zinc-100 tabular-nums">{totalHours.toFixed(1)}h</p>
                <p className="text-[11px] text-zinc-600">executadas</p>
              </div>
              {totalCost > 0 && (
                <div className="text-right border-l border-zinc-800 pl-4">
                  <p className="text-base font-semibold text-zinc-100 tabular-nums">
                    R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-zinc-600">custo total</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              {/* Progress vs meta de 160h mensais */}
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min((totalHours / 160) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-600 mt-1 text-right">
              {((totalHours / 160) * 100).toFixed(0)}% de 160h
            </p>
          </div>
        </div>
      )}

      {/* Grade de tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Atribuídas a mim hoje"
          icon={CalendarClock}
          empty={assignedToday.length === 0}
          emptyText="Nenhuma tarefa atribuída hoje"
        >
          <div className="space-y-px">
            {assignedToday.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        </SectionCard>

        <SectionCard
          title="Em andamento"
          icon={Timer}
          empty={inProgress.length === 0}
          emptyText="Nenhuma tarefa em andamento"
        >
          <div className="space-y-px">
            {inProgress.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            title="Últimas concluídas"
            icon={CircleCheck}
            empty={lastCompleted.length === 0}
            emptyText="Nenhuma tarefa concluída ainda"
          >
            <div className="space-y-px">
              {lastCompleted.map(t => (
                <Link
                  key={t.id}
                  href={`/dashboard/tasks/${t.id}`}
                  className="flex items-center gap-3 py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors group"
                >
                  <CircleCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-300 flex-1 truncate transition-colors">{t.title}</span>
                  {t.completedAt && (
                    <span className="text-[10px] text-zinc-700">
                      {new Date(t.completedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </SectionCard>

          {/* Frase motivacional */}
          <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg px-4 py-3">
            <p className="text-xs text-zinc-400 italic leading-relaxed">"{phrase.text}"</p>
            {phrase.author !== 'Anônimo' && (
              <p className="text-[11px] text-zinc-600 mt-1.5">— {phrase.author}</p>
            )}
          </div>
        </div>

        {overdue.length > 0 && (
          <SectionCard title="Em atraso" icon={AlertCircle}>
            <div className="space-y-px">
              {overdue.map(t => (
                <Link
                  key={t.id}
                  href={`/dashboard/tasks/${t.id}`}
                  className="flex items-center gap-3 py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors group"
                >
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : '—'}
                  </span>
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 flex-1 truncate transition-colors">{t.title}</span>
                </Link>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}

// ─── Admin/Owner Dashboard ────────────────────────────────────────────────────

async function AdminDashboard({ organizationId, orgName }: {
  organizationId: string
  orgName: string
}) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [dashboard, tasksAssignedToday, inProgress, lastCompleted] = await Promise.all([
    getOrganizationDashboard(organizationId),
    // Tarefas atribuídas hoje (a qualquer membro)
    prisma.task.findMany({
      where: {
        organizationId,
        assignedToId: { not: null },
        createdAt: { gte: todayStart },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        project: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Tarefas em andamento
    prisma.task.findMany({
      where: { organizationId, status: 'IN_PROGRESS' },
      include: {
        project: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    // Últimas concluídas
    prisma.task.findMany({
      where: { organizationId, status: 'DONE' },
      include: {
        project: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
  ])

  const hasData = (dashboard?.totalProjects || 0) > 0 || (dashboard?.totalTasks || 0) > 0

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader title="Dashboard" subtitle="Visão geral da sua operação" />

      {!hasData && (
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-8 mb-6 animate-fade-in">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Bem-vindo ao ProjectFlow!</h2>
                <p className="text-sm text-zinc-500">{orgName ? `Organização: ${orgName}` : 'Comece a usar agora'}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Sua organização está pronta. Crie seu primeiro projeto e adicione tarefas para acompanhar tempo, custos e progresso.
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
      )}

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

      {/* Tarefas operacionais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Atribuídas hoje */}
        <SectionCard
          title="Atribuídas hoje"
          icon={CalendarClock}
          empty={tasksAssignedToday.length === 0}
          emptyText="Nenhuma tarefa atribuída hoje"
        >
          <div className="space-y-px">
            {tasksAssignedToday.map(t => (
              <Link
                key={t.id}
                href={`/dashboard/tasks/${t.id}`}
                className="flex items-center gap-2 py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors group"
              >
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${statusColors[t.status] || statusColors.TODO}`}>
                  {statusLabels[t.status]}
                </span>
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 flex-1 truncate transition-colors">{t.title}</span>
                {t.assignedTo && (
                  <span className="text-[10px] text-zinc-700 shrink-0">{t.assignedTo.name.split(' ')[0]}</span>
                )}
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Em andamento */}
        <SectionCard
          title="Em andamento"
          icon={Timer}
          empty={inProgress.length === 0}
          emptyText="Nenhuma tarefa em andamento"
        >
          <div className="space-y-px">
            {inProgress.map(t => (
              <Link
                key={t.id}
                href={`/dashboard/tasks/${t.id}`}
                className="flex items-center gap-2 py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors group"
              >
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 flex-1 truncate transition-colors">{t.title}</span>
                {t.assignedTo && (
                  <span className="text-[10px] text-zinc-600 shrink-0">{t.assignedTo.name.split(' ')[0]}</span>
                )}
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Últimas concluídas */}
        <SectionCard
          title="Últimas concluídas"
          icon={CircleCheck}
          empty={lastCompleted.length === 0}
          emptyText="Nenhuma tarefa concluída"
        >
          <div className="space-y-px">
            {lastCompleted.map(t => (
              <Link
                key={t.id}
                href={`/dashboard/tasks/${t.id}`}
                className="flex items-center gap-2 py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors group"
              >
                <CircleCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-xs text-zinc-500 group-hover:text-zinc-300 flex-1 truncate transition-colors">{t.title}</span>
                {t.completedAt && (
                  <span className="text-[10px] text-zinc-700 shrink-0">
                    {new Date(t.completedAt).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Tarefas por status + Projetos ativos */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
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
            </div>
          </div>

          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay-2">
            <h2 className="text-sm font-medium text-zinc-200 mb-4">Projetos ativos</h2>
            {dashboard?.activeProjects?.length ? (
              <div className="space-y-px">
                {dashboard.activeProjects.map((p: { id: string; name: string }) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    className="flex items-center gap-2 py-2 px-2 rounded hover:bg-zinc-900/40 transition-colors group"
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
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  try {
    const { user, organizationId } = await getCurrentUserWithOrg()

    if (user.role === 'MEMBER' || user.role === 'VIEWER') {
      return (
        <MemberDashboard
          userId={user.id}
          organizationId={organizationId}
          userName={user.name}
        />
      )
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    })

    return (
      <AdminDashboard
        organizationId={organizationId}
        orgName={org?.name || ''}
      />
    )
  } catch {
    return (
      <div className="p-6">
        <p className="text-sm text-zinc-500">Erro ao carregar dashboard.</p>
      </div>
    )
  }
}
