'use client'

import { useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, Circle } from 'lucide-react'

interface GanttTask {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string | Date | null
  createdAt?: string | Date | null
  completedAt?: string | Date | null
  assignedTo?: { id: string; name: string } | null
  pipelineStageId?: string | null
  stageName?: string
}

interface GanttProps {
  tasks: GanttTask[]
  stages?: { id: string; name: string; color?: string | null; order: number }[]
  projectStartDate?: string | Date | null
  projectEndDate?: string | Date | null
  projectTargetEndDate?: string | Date | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Circle }> = {
  TODO:        { label: 'A Fazer',     color: 'dark:text-zinc-400 text-zinc-400',    bg: 'bg-zinc-600',    icon: Circle },
  IN_PROGRESS: { label: 'Em Progresso',color: 'text-blue-400',    bg: 'bg-blue-500',    icon: Clock },
  IN_REVIEW:   { label: 'Em Revisão',  color: 'text-amber-400',   bg: 'bg-amber-500',   icon: AlertCircle },
  DONE:        { label: 'Concluído',   color: 'text-emerald-400', bg: 'bg-emerald-500', icon: CheckCircle2 },
  CANCELLED:   { label: 'Cancelado',   color: 'text-red-400',     bg: 'bg-zinc-700',    icon: AlertCircle },
}

const PRIORITY_BORDER: Record<string, string> = {
  LOW:    'border-zinc-600',
  MEDIUM: 'border-blue-500/60',
  HIGH:   'border-orange-500/60',
  URGENT: 'border-red-500',
}

const DAY_PX = 28

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function GanttChart({ tasks, stages = [], projectStartDate, projectEndDate, projectTargetEndDate }: GanttProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ task: GanttTask; x: number; y: number } | null>(null)

  const { minDate, maxDate, totalDays, days, months } = useMemo(() => {
    const allDates: Date[] = []

    const ps = toDate(projectStartDate)
    const pe = toDate(projectEndDate) || toDate(projectTargetEndDate)
    if (ps) allDates.push(ps)
    if (pe) allDates.push(pe)

    tasks.forEach(t => {
      const ca = toDate(t.createdAt)
      const dd = toDate(t.dueDate)
      const co = toDate(t.completedAt)
      if (ca) allDates.push(ca)
      if (dd) allDates.push(dd)
      if (co) allDates.push(co)
    })

    let minD = allDates.length > 0
      ? startOfDay(new Date(Math.min(...allDates.map(d => d.getTime()))))
      : startOfDay(new Date())
    let maxD = allDates.length > 0
      ? startOfDay(new Date(Math.max(...allDates.map(d => d.getTime()))))
      : startOfDay(addDays(new Date(), 30))

    // padding
    minD = addDays(minD, -3)
    maxD = addDays(maxD, 7)

    const totalDays = diffDays(minD, maxD) + 1
    const days: Date[] = []
    for (let i = 0; i < totalDays; i++) days.push(addDays(minD, i))

    // Build month headers
    const months: { label: string; startIdx: number; span: number }[] = []
    let currentMonth = -1
    days.forEach((d, i) => {
      const m = d.getMonth()
      const y = d.getFullYear()
      if (m !== currentMonth) {
        currentMonth = m
        months.push({ label: `${MONTH_NAMES[m]} ${y}`, startIdx: i, span: 0 })
      }
      months[months.length - 1].span++
    })

    return { minDate: minD, maxDate: maxD, totalDays, days, months }
  }, [tasks, projectStartDate, projectEndDate, projectTargetEndDate])

  // Enrich tasks with stage name
  const stageMap = useMemo(() => {
    const m = new Map<string, string>()
    stages.forEach(s => m.set(s.id, s.name))
    return m
  }, [stages])

  const enrichedTasks = useMemo(() =>
    tasks.map(t => ({
      ...t,
      stageName: t.pipelineStageId ? stageMap.get(t.pipelineStageId) : undefined,
    }))
  , [tasks, stageMap])

  // Group by status
  const grouped = useMemo(() => {
    const groups: Record<string, GanttTask[]> = {}
    const order = ['IN_PROGRESS', 'IN_REVIEW', 'TODO', 'DONE', 'CANCELLED']
    order.forEach(s => { groups[s] = [] })
    enrichedTasks.forEach(t => {
      if (groups[t.status]) groups[t.status].push(t)
      else groups[t.status] = [t]
    })
    return order.filter(s => groups[s].length > 0).map(s => ({ status: s, tasks: groups[s] }))
  }, [enrichedTasks])

  const today = startOfDay(new Date())
  const todayOffset = diffDays(minDate, today)

  const getBarStyle = (task: GanttTask) => {
    const start = toDate(task.createdAt) ? startOfDay(toDate(task.createdAt)!) : minDate
    const end = toDate(task.dueDate)
      ? startOfDay(toDate(task.dueDate)!)
      : toDate(task.completedAt)
      ? startOfDay(toDate(task.completedAt)!)
      : addDays(start, 1)

    const left = Math.max(0, diffDays(minDate, start)) * DAY_PX
    const width = Math.max(DAY_PX, diffDays(start, end) * DAY_PX)

    return { left, width }
  }

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -DAY_PX * 7, behavior: 'smooth' })
  }
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: DAY_PX * 7, behavior: 'smooth' })
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="w-10 h-10 dark:text-zinc-600 text-zinc-400 mb-3" />
        <p className="text-sm dark:text-zinc-500 text-zinc-500">Nenhuma tarefa para exibir no Gantt</p>
        <p className="text-xs dark:text-zinc-600 text-zinc-400 mt-1">Adicione tarefas com datas para visualizar o cronograma</p>
      </div>
    )
  }

  const LABEL_WIDTH = 200

  return (
    <div className="relative select-none">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${cfg.bg}`} />
              <span className="text-[11px] dark:text-zinc-500 text-zinc-500">{cfg.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={scrollLeft} className="p-1 rounded dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 dark:hover:bg-zinc-800/60 bg-zinc-100 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={scrollRight} className="p-1 rounded dark:text-zinc-500 text-zinc-500 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 dark:hover:bg-zinc-800/60 bg-zinc-100 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex border dark:border-zinc-800/60 border-zinc-200 rounded-lg overflow-hidden">
        {/* Fixed label column */}
        <div className="flex-shrink-0 dark:bg-zinc-950 bg-white" style={{ width: LABEL_WIDTH }}>
          {/* Header spacer for month + day rows */}
          <div className="h-[52px] border-b dark:border-zinc-800/60 border-zinc-200 dark:bg-zinc-900/60 bg-zinc-50 px-3 flex items-end pb-1">
            <span className="text-[10px] dark:text-zinc-600 text-zinc-400 uppercase tracking-wider">Tarefa</span>
          </div>

          {/* Groups */}
          {grouped.map(group => {
            const cfg = STATUS_CONFIG[group.status] || STATUS_CONFIG.TODO
            const Icon = cfg.icon
            return (
              <div key={group.status}>
                {/* Group header */}
                <div className="h-7 px-3 flex items-center gap-1.5 dark:bg-zinc-900/30 bg-zinc-200/50 border-b dark:border-zinc-800/40 border-zinc-200">
                  <Icon className={`w-3 h-3 ${cfg.color} flex-shrink-0`} />
                  <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-[10px] dark:text-zinc-600 text-zinc-400 ml-auto">{group.tasks.length}</span>
                </div>
                {/* Tasks */}
                {group.tasks.map(task => (
                  <div
                    key={task.id}
                    className="h-9 px-3 flex items-center border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors"
                    title={task.title}
                  >
                    <span className="text-xs dark:text-zinc-300 text-zinc-300 truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Scrollable timeline */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700"
          style={{ minWidth: 0 }}
        >
          <div style={{ width: totalDays * DAY_PX, position: 'relative' }}>
            {/* Month header */}
            <div className="h-6 flex border-b dark:border-zinc-800/40 border-zinc-200 dark:bg-zinc-900/60 bg-zinc-50 sticky top-0">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center px-2 border-r dark:border-zinc-800/40 border-zinc-200 flex-shrink-0"
                  style={{ width: m.span * DAY_PX }}
                >
                  <span className="text-[10px] dark:text-zinc-500 text-zinc-500 whitespace-nowrap">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Day header */}
            <div className="h-[26px] flex border-b dark:border-zinc-800/60 border-zinc-200 dark:bg-zinc-900/40 bg-zinc-100 sticky top-6">
              {days.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                const isToday = diffDays(minDate, d) === todayOffset
                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 flex items-center justify-center border-r border-zinc-800/20 ${
                      isWeekend ? 'dark:bg-zinc-900/60 bg-zinc-50' : ''
                    } ${isToday ? 'bg-blue-500/10' : ''}`}
                    style={{ width: DAY_PX }}
                  >
                    <span className={`text-[9px] tabular-nums ${
                      isToday ? 'text-blue-400 font-medium' : isWeekend ? 'dark:text-zinc-600 text-zinc-400' : 'dark:text-zinc-600 text-zinc-400'
                    }`}>
                      {d.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Today line */}
            {todayOffset >= 0 && todayOffset < totalDays && (
              <div
                className="absolute top-[52px] bottom-0 w-px bg-blue-500/40 z-10 pointer-events-none"
                style={{ left: todayOffset * DAY_PX + DAY_PX / 2 }}
              />
            )}

            {/* Group rows */}
            {grouped.map(group => (
              <div key={group.status}>
                {/* Group header row */}
                <div className="h-7 border-b dark:border-zinc-800/40 border-zinc-200 dark:bg-zinc-900/20 bg-zinc-100/50 relative">
                  {/* Weekend stripes */}
                  {days.map((d, i) => {
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6
                    return isWeekend ? (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 dark:bg-zinc-900/40 bg-zinc-100"
                        style={{ left: i * DAY_PX, width: DAY_PX }}
                      />
                    ) : null
                  })}
                </div>

                {/* Task rows */}
                {group.tasks.map(task => {
                  const { left, width } = getBarStyle(task)
                  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO
                  const borderClass = PRIORITY_BORDER[task.priority] || 'border-zinc-600'
                  const hasDueDate = !!toDate(task.dueDate)
                  const isOverdue = hasDueDate && toDate(task.dueDate)! < today && task.status !== 'DONE'

                  return (
                    <div
                      key={task.id}
                      className="h-9 border-b border-zinc-800/20 relative hover:bg-zinc-800/10 transition-colors"
                      onMouseEnter={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({ task, x: e.clientX, y: rect.top })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Weekend stripes */}
                      {days.map((d, i) => {
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6
                        return isWeekend ? (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 dark:bg-zinc-900/30 bg-zinc-200/50"
                            style={{ left: i * DAY_PX, width: DAY_PX }}
                          />
                        ) : null
                      })}

                      {/* Task bar */}
                      <div
                        className={`absolute top-2 bottom-2 rounded ${cfg.bg} ${
                          isOverdue ? 'opacity-60' : 'opacity-80'
                        } border ${borderClass} flex items-center px-2 overflow-hidden cursor-pointer hover:opacity-100 transition-opacity`}
                        style={{ left, width: Math.max(width, DAY_PX - 4) }}
                      >
                        <span className="text-[10px] text-white font-medium truncate whitespace-nowrap">
                          {task.assignedTo?.name?.split(' ')[0] || ''}
                        </span>
                        {isOverdue && (
                          <AlertCircle className="w-3 h-3 text-red-300 flex-shrink-0 ml-auto" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 dark:bg-zinc-900 bg-white border dark:border-zinc-700 border-zinc-300 border-zinc-300 rounded-lg p-3 shadow-2xl pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 12, window.innerWidth - 260),
            top: tooltip.y - 80,
            minWidth: 220,
            maxWidth: 260,
          }}
        >
          <p className="text-xs font-medium dark:text-zinc-100 text-zinc-900 mb-2 leading-tight">{tooltip.task.title}</p>
          <div className="space-y-1">
            {tooltip.task.stageName && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] dark:text-zinc-500 text-zinc-500">Etapa</span>
                <span className="text-[10px] dark:text-zinc-300 text-zinc-300">{tooltip.task.stageName}</span>
              </div>
            )}
            {tooltip.task.assignedTo && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] dark:text-zinc-500 text-zinc-500">Responsável</span>
                <span className="text-[10px] dark:text-zinc-300 text-zinc-300">{tooltip.task.assignedTo.name}</span>
              </div>
            )}
            {tooltip.task.dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] dark:text-zinc-500 text-zinc-500">Prazo</span>
                <span className={`text-[10px] tabular-nums ${
                  toDate(tooltip.task.dueDate)! < today && tooltip.task.status !== 'DONE'
                    ? 'text-red-400'
                    : 'dark:text-zinc-300 text-zinc-300'
                }`}>
                  {toDate(tooltip.task.dueDate)!.toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            {tooltip.task.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] dark:text-zinc-500 text-zinc-500">Concluído em</span>
                <span className="text-[10px] dark:text-zinc-300 text-zinc-300 tabular-nums">
                  {toDate(tooltip.task.completedAt)!.toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t dark:border-zinc-800 border-zinc-300 border-zinc-300">
              <span className="text-[10px] dark:text-zinc-500 text-zinc-500">Status</span>
              <span className={`text-[10px] ${STATUS_CONFIG[tooltip.task.status]?.color || 'dark:text-zinc-400 text-zinc-400'}`}>
                {STATUS_CONFIG[tooltip.task.status]?.label || tooltip.task.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
