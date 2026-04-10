'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Clock, Briefcase } from 'lucide-react'
import Link from 'next/link'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function UserAllocationClient({ organizationId }: { organizationId: string }) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?type=user-allocation&month=${month}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [month])

  const allocMap = new Map((data?.allocation || []).map((a: any) => [a.userId, a]))
  const tasksByUser = new Map<string, any[]>()
  ;(data?.inProgress || []).forEach((t: any) => {
    if (t.assignedToId) {
      if (!tasksByUser.has(t.assignedToId)) tasksByUser.set(t.assignedToId, [])
      tasksByUser.get(t.assignedToId)!.push(t)
    }
  })

  const [yearStr, monStr] = month.split('-')
  const monthLabel = monStr ? MONTHS[parseInt(monStr, 10) - 1] : ''

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-in">
        <Link href="/dashboard/reports" className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 text-zinc-700 mb-2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar aos relatórios
        </Link>
        <h1 className="text-base font-semibold dark:text-zinc-100 text-zinc-900 tracking-tight">Alocação de Usuários</h1>
        <p className="text-sm dark:text-zinc-500 text-zinc-500 mt-0.5">Horas por usuário no mês</p>
      </div>

      {/* Month filter */}
      <div className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800 border-zinc-300/60 rounded-lg p-4 mb-4 animate-fade-in">
        <div>
          <label className="text-[11px] dark:text-zinc-500 text-zinc-500 mb-1 block">Mês</label>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-300 rounded-md px-3 py-1.5 text-sm dark:text-zinc-200 text-zinc-800 focus:outline-none focus:ring-1 dark:focus:ring-zinc-700 focus:ring-zinc-400"
          >
            {(() => {
              const now = new Date()
              const opts = []
              for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                opts.push(<option key={val} value={val}>{MONTHS[d.getMonth()]} {d.getFullYear()}</option>)
              }
              return opts
            })()}
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800 border-zinc-300/60 rounded-lg animate-fade-in-delay">
        {loading ? (
          <div className="p-8 text-center"><p className="text-sm dark:text-zinc-500 text-zinc-500">Carregando...</p></div>
        ) : !data?.users?.length ? (
          <div className="p-8 text-center"><p className="text-sm dark:text-zinc-500 text-zinc-500">Nenhum usuário encontrado</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b dark:border-zinc-800 border-zinc-300/60">
                  <th className="text-left px-4 py-2.5 text-[11px] dark:text-zinc-500 text-zinc-500 font-medium">Usuário</th>
                  <th className="text-right px-4 py-2.5 text-[11px] dark:text-zinc-500 text-zinc-500 font-medium">Horas ({monthLabel})</th>
                  <th className="text-right px-4 py-2.5 text-[11px] dark:text-zinc-500 text-zinc-500 font-medium">Custo</th>
                  <th className="text-right px-4 py-2.5 text-[11px] dark:text-zinc-500 text-zinc-500 font-medium">Registros</th>
                  <th className="text-left px-4 py-2.5 text-[11px] dark:text-zinc-500 text-zinc-500 font-medium">Tarefas em Andamento</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user: any) => {
                  const alloc = allocMap.get(user.id) as any
                  const tasks = tasksByUser.get(user.id) || []
                  return (
                    <tr key={user.id} className="border-b dark:border-zinc-800 dark:divide-zinc-800/30 divide-zinc-200/50 dark:hover:bg-zinc-900/40 hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-2.5 dark:text-zinc-300 text-zinc-700 font-medium">{user.name}</td>
                      <td className="px-4 py-2.5 dark:text-zinc-300 text-zinc-700 text-right tabular-nums">
                        {alloc ? Math.round((alloc._sum.minutes / 60) * 10) / 10 : '0'}h
                      </td>
                      <td className="px-4 py-2.5 dark:text-zinc-400 text-zinc-400 text-right tabular-nums">
                        R$ {alloc ? Math.round(Number(alloc._sum.costSnapshot || 0)).toLocaleString('pt-BR') : '0'}
                      </td>
                      <td className="px-4 py-2.5 dark:text-zinc-400 text-zinc-400 text-right tabular-nums">
                        {alloc?._count || 0}
                      </td>
                      <td className="px-4 py-2.5 dark:text-zinc-400 text-zinc-400">
                        {tasks.length > 0 ? (
                          <span className="text-[11px] text-blue-400">{tasks.length} tarefa(s)</span>
                        ) : (
                          <span className="text-[11px] dark:text-zinc-600 text-zinc-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-progress tasks detail */}
      {data?.inProgress && data.inProgress.length > 0 && (
        <div className="dark:bg-zinc-950/50 bg-white border dark:border-zinc-800 border-zinc-300/60 rounded-lg p-4 mt-4 animate-fade-in-delay-2">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 dark:text-zinc-500 text-zinc-500" />
            <h2 className="text-sm font-medium dark:text-zinc-200 text-zinc-800">Tarefas em Andamento</h2>
          </div>
          <div className="space-y-2">
            {data.inProgress.map((task: any) => (
              <div key={task.id} className="flex justify-between items-center py-2 px-2 rounded dark:hover:bg-zinc-900/40 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs dark:text-zinc-300 text-zinc-700">{task.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] dark:text-zinc-500 text-zinc-500">{task.project?.name || '-'}</span>
                  <span className="text-[11px] dark:text-zinc-500 text-zinc-500">{task.assignedTo ? data.users.find((u: any) => u.id === task.assignedToId)?.name : 'Sem responsável'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
