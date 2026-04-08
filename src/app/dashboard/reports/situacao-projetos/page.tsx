'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, FolderKanban, TrendingUp, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function SituacaoProjetosPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports?type=project-health')
      .then(r => r.json())
      .then(data => setProjects(data.projects || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-400'
    if (pct >= 50) return 'text-blue-400'
    if (pct >= 25) return 'text-amber-400'
    return 'text-red-400'
  }

  const getProgressBg = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-blue-500'
    if (pct >= 25) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Ativo',
    PAUSED: 'Pausado',
    COMPLETED: 'Concluído',
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400',
    PAUSED: 'bg-amber-500/10 text-amber-400',
    COMPLETED: 'bg-zinc-800 text-zinc-400',
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 animate-fade-in">
        <Link href="/dashboard/reports" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar aos relatórios
        </Link>
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Situação de Projetos</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Saúde dos projetos: progresso, orçamento e atrasos</p>
      </div>

      {loading ? (
        <div className="p-8 text-center"><p className="text-sm text-zinc-500">Carregando...</p></div>
      ) : projects.length === 0 ? (
        <div className="p-8 text-center">
          <FolderKanban className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Nenhum projeto encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className={`bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-5 animate-fade-in`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#5c6ac4' }} />
                  <h3 className="text-sm font-medium text-zinc-200">{project.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[project.status] || statusColors.ACTIVE}`}>
                    {statusLabels[project.status] || project.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-zinc-500">Responsável</p>
                  <p className="text-xs text-zinc-400">{project.owner?.name || '-'}</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {project.type === 'SCOPE_FIXED' ? (
                  <div>
                    <p className="text-[11px] text-zinc-500 mb-1">Progresso</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-800/40 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${getProgressBg(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium tabular-nums ${getProgressColor(project.progress)}`}>
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-zinc-500 mb-1">Tipo</p>
                    <p className="text-xs text-zinc-400">{project.type === 'CONTINUOUS' ? 'Contínuo' : 'Escopo Fechado'}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">Horas</p>
                  <p className="text-sm text-zinc-300 tabular-nums">{Math.round(project.totalHours || 0)}h</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">Custo</p>
                  <p className="text-sm text-zinc-300 tabular-nums">R$ {Math.round(project.totalCost || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">Orçamento</p>
                  {project.budget ? (
                    <div>
                      <p className="text-sm text-zinc-300 tabular-nums">
                        R$ {Number(project.budget).toLocaleString('pt-BR')}
                      </p>
                      {project.totalCost > 0 && (
                        <p className={`text-[10px] ${Number(project.totalCost) > Number(project.budget) ? 'text-red-400' : 'text-emerald-400'}`}>
                          {Math.round((Number(project.totalCost) / Number(project.budget)) * 100)}% utilizado
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-600">Não definido</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">Tarefas Atrasadas</p>
                  {project.overdueTasks > 0 ? (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-sm text-red-400 tabular-nums">{project.overdueTasks}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] text-emerald-400">OK</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget vs actual bar */}
              {project.budget && Number(project.budget) > 0 && (
                <div className="bg-zinc-900/40 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-zinc-500">Orçamento vs Realizado</span>
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      R$ {Math.round(project.totalCost || 0).toLocaleString('pt-BR')} / R$ {Number(project.budget).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800/40 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        Number(project.totalCost) > Number(project.budget)
                          ? 'bg-red-500'
                          : Number(project.totalCost) > Number(project.budget) * 0.8
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((Number(project.totalCost) / Number(project.budget)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
