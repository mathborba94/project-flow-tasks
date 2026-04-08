'use client'

import { useState } from 'react'
import { FolderKanban, Clock, DollarSign, FileText, Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  type: string
  color: string
  totalHours: number
  totalCost: number
  _count: { tasks: number }
  owner?: { name: string }
}

const statusConfig: Record<string, { label: string; dot: string }> = {
  ACTIVE: { label: 'Ativo', dot: 'bg-emerald-500' },
  PAUSED: { label: 'Pausado', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Concluído', dot: 'bg-zinc-500' },
}

export default function ProjectsList({ projects, members, createButton }: {
  projects: Project[]
  members: Array<{ id: string; name: string }>
  createButton: React.ReactNode
}) {
  const [search, setSearch] = useState('')

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q)) ||
      (p.owner?.name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Projetos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Gerencie todos os projetos da sua organização</p>
        </div>
        {createButton}
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, descrição ou responsável..."
          className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((project, i) => {
          const status = statusConfig[project.status] || statusConfig.ACTIVE
          return (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group block animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 hover:border-zinc-700/60 transition-colors relative overflow-hidden"
                style={{ borderBottom: `3px solid ${project.color || '#5c6ac4'}` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      <span className="text-xs text-zinc-500">{status.label}</span>
                    </div>
                  </div>
                </div>
                {project.description && (
                  <p className="text-xs text-zinc-600 mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
                )}
                <div className="flex items-center gap-4 pt-3 border-t border-zinc-800/40 text-xs text-zinc-600">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{project._count.tasks}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{Math.round(project.totalHours || 0)}h</span>
                  </div>
                  {project.type === 'SCOPE_FIXED' && (
                    <div className="flex items-center gap-1 ml-auto">
                      <DollarSign className="w-3 h-3" />
                      <span>R$ {Math.round(project.totalCost || 0).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FolderKanban className="w-5 h-5 text-zinc-700" />
          </div>
          <p className="text-sm text-zinc-500">
            {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          </p>
          {!search && <p className="text-xs text-zinc-700 mt-1">Crie seu primeiro projeto para começar</p>}
        </div>
      )}
    </div>
  )
}
