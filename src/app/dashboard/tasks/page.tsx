import { getCurrentUserWithOrg } from '@/services/auth'
import { listTasks } from '@/services/task'
import { listProjects } from '@/services/project'
import { listOrganizationMembers } from '@/services/organization'
import Link from 'next/link'
import { CreateTaskDialog } from './create-task-dialog'
import { Plus } from 'lucide-react'
import TaskList from '@/components/task/list'

export default async function TasksPage() {
  let organizationId = 'demo-org'
  try {
    const { organizationId: orgId } = await getCurrentUserWithOrg()
    organizationId = orgId
  } catch {}

  const [tasks, projects, members] = await Promise.all([
    listTasks(organizationId),
    listProjects(organizationId),
    listOrganizationMembers(organizationId),
  ])

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Tarefas</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Gerencie e acompanhe todas as tarefas</p>
        </div>
        <CreateTaskDialog projects={projects} members={members}>
          <button className="inline-flex items-center gap-1.5 text-xs font-medium bg-white text-black px-3 py-1.5 rounded-md hover:bg-zinc-200 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Nova Tarefa
          </button>
        </CreateTaskDialog>
      </div>

      <TaskList tasks={tasks} />
    </div>
  )
}
