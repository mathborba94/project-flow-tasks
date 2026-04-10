'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Archive,
  RotateCcw,
  Settings,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-400' },
  PAUSED: { label: 'Pausado', className: 'bg-amber-500/10 text-amber-400' },
  COMPLETED: { label: 'Concluído', className: 'dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-400' },
}

const typeLabels: Record<string, string> = {
  SCOPE_FIXED: 'Escopo Fechado',
  CONTINUOUS: 'Contínuo',
}

export default function ProjectTopBar({
  project,
  progress,
  totalHours,
  totalCost,
}: {
  project: {
    id: string
    name: string
    status: string
    type: string
    color: string
    archived: boolean
  }
  progress: number
  totalHours: number
  totalCost: number
}) {
  const status = statusConfig[project.status] || statusConfig.ACTIVE

  return (
    <div className="flex-shrink-0 border-b dark:border-zinc-800 border-zinc-300/60 bg-[#09090b]">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/projects" className="text-zinc-500 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 dark:hover:text-zinc-700 text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#5c6ac4' }} />
            <h1 className="text-sm font-semibold dark:text-zinc-100 text-zinc-900">{project.name}</h1>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
              {status.label}
            </span>
            <span className="text-[10px] text-zinc-600 dark:bg-zinc-800/60 bg-zinc-100 px-2 py-0.5 rounded-full">
              {typeLabels[project.type] || 'Escopo Fechado'}
            </span>
            {project.archived && (
              <span className="text-[10px] text-zinc-600 dark:bg-zinc-800/60 bg-zinc-100 px-2 py-0.5 rounded-full">
                Arquivado
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs dark:text-zinc-500 text-zinc-500">
            <span className="tabular-nums">{progress}% progresso</span>
            <span className="tabular-nums">{Math.round(totalHours)}h</span>
            <span className="tabular-nums">R$ {Math.round(totalCost).toLocaleString('pt-BR')}</span>
          </div>

          <div className="flex items-center gap-1">
            {!project.archived ? (
              <button
                onClick={() => {
                  fetch(`/api/projects/${project.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'archive' }),
                  }).then(() => window.location.reload())
                }}
                className="p-1.5 text-zinc-600 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 dark:hover:text-zinc-700 text-zinc-300 transition-colors rounded"
                title="Arquivar projeto"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  fetch(`/api/projects/${project.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'unarchive' }),
                  }).then(() => window.location.reload())
                }}
                className="p-1.5 text-zinc-600 dark:hover:text-zinc-300 dark:text-zinc-600 text-zinc-400 dark:hover:text-zinc-700 text-zinc-300 transition-colors rounded"
                title="Desarquivar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
