import { Button } from '@/components/ui/button'
import { getCurrentUserWithOrg } from '@/services/auth'
import { listTimeEntries } from '@/services/time-entry'
import { CreateTimeEntryDialog } from './create-time-entry-dialog'
import { Clock, Plus, User } from 'lucide-react'

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 animate-fade-in">
      <div>
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">{title}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function TimePage() {
  let organizationId = 'demo-org'
  try {
    const { organizationId: orgId } = await getCurrentUserWithOrg()
    organizationId = orgId
  } catch {}

  const entries = await listTimeEntries(organizationId)

  const totalHours = entries.reduce((sum, e) => sum + e.minutes, 0) / 60
  const totalCost = entries.reduce((sum, e) => sum + Number(e.costSnapshot), 0)

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title="Registro de Tempo"
        subtitle="Acompanhe todas as horas registradas"
        action={<CreateTimeEntryDialog><button className="inline-flex items-center gap-1.5 text-xs font-medium bg-white text-black px-3 py-1.5 rounded-md hover:bg-zinc-200 transition-colors"><Plus className="w-3.5 h-3.5" />Novo Registro</button></CreateTimeEntryDialog>}
      />

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-4 text-xs text-zinc-500 animate-fade-in-delay">
        <span><span className="text-zinc-200 font-medium tabular-nums">{entries.length}</span> registros</span>
        <span><span className="text-zinc-200 font-medium tabular-nums">{Math.round(totalHours * 10) / 10}h</span> totais</span>
        <span><span className="text-zinc-200 font-medium tabular-nums">R$ {Math.round(totalCost).toLocaleString('pt-BR')}</span> custo</span>
      </div>

      {/* Entries */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg overflow-hidden animate-fade-in-delay">
        <div className="divide-y divide-zinc-800/40">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/40 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 truncate">{entry.task.title}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 mt-0.5">
                  <User className="w-3 h-3" />
                  <span>{entry.user.name}</span>
                  {entry.project && (
                    <>
                      <span className="text-zinc-800">·</span>
                      <span>{entry.project.name}</span>
                    </>
                  )}
                  {entry.description && (
                    <>
                      <span className="text-zinc-800">·</span>
                      <span className="truncate max-w-[180px]">{entry.description}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-sm font-medium text-zinc-200 tabular-nums">{Math.round(entry.minutes / 60 * 10) / 10}h</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  R$ {Math.round(Number(entry.costSnapshot)).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="text-center py-16">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500">Nenhum registro de tempo</p>
            <p className="text-xs text-zinc-700 mt-1">Registre horas trabalhadas nas tarefas</p>
          </div>
        )}
      </div>
    </div>
  )
}
