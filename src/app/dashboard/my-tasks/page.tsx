import { getCurrentUserWithOrg } from '@/services/auth'
import { listTasks } from '@/services/task'
import { Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import TaskClientView from './task-client-view'

const statusLabels: Record<string, string> = {
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Progresso',
  IN_REVIEW: 'Em Revisão',
  DONE: 'Concluído',
  CANCELLED: 'Cancelado',
}

const priorityColors: Record<string, string> = {
  LOW: 'dark:bg-zinc-800 bg-zinc-200 dark:text-zinc-400 text-zinc-600',
  MEDIUM: 'bg-blue-500/10 text-blue-400',
  HIGH: 'bg-orange-500/10 text-orange-400',
  URGENT: 'bg-red-500/10 text-red-400',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export default async function MyTasksPage() {
  let userId = ''
  let organizationId = ''
  try {
    const { organizationId: orgId, user } = await getCurrentUserWithOrg()
    organizationId = orgId
    userId = user.id
  } catch {
    return (
      <div className="p-6">
        <p className="text-sm dark:text-zinc-500 text-zinc-500">Não autenticado.</p>
      </div>
    )
  }

  const allTasks = await listTasks(organizationId, { assignedToId: userId })

  const openTasks = allTasks.filter(
    t => t.status !== 'DONE' && t.status !== 'CANCELLED'
  )

  const completedTasks = allTasks
    .filter(t => t.status === 'DONE')
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return bTime - aTime
    })
    .slice(0, 10)

  const now = new Date()
  const overdueTasks = openTasks.filter(t => {
    if (!t.dueDate) return false
    return new Date(t.dueDate) < now
  })

  return (
    <TaskClientView
      openTasks={JSON.parse(JSON.stringify(openTasks))}
      completedTasks={JSON.parse(JSON.stringify(completedTasks))}
      overdueTasks={JSON.parse(JSON.stringify(overdueTasks))}
      statusLabels={statusLabels}
      priorityColors={priorityColors}
      priorityLabels={priorityLabels}
    />
  )
}
