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
  COMPLETED: { label: 'Concluído', dot: 'dark:bg-zinc-500 bg-zinc-400' },
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
          <h1 className="text-base font-semibold dark:text-zinc-100 text-zinc-900 tracking-tight">Projetos</h1>
          <p className="text-sm dark:text-zinc-500 text-zinc-500 mt-0.5">Gerencie todos os projetos da sua organização</p>
        </div>
        {createButton}
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-zinc-600 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, descrição ou responsável..."
          className="w-full pl-9 pr-4 py-2 dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-300 rounded-lg text-sm dark:text-zinc-200 text-zinc-900 dark:placeholder-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:ring-1 dark:focus:ring-zinc-700 focus:ring-zinc-400"
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
                className="dark:bg-zinc-950/50 bg-white dark:border-zinc-800/60 border-zinc-200 rounded-lg p-4 dark:hover:border-zinc-700/60 hover:border-zinc-300 transition-colors relative overflow-hidden"
                style={{ borderBottom: `3px solid ${project.color || '#5c6ac4'}` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium dark:text-zinc-200 text-zinc-800 group-dark:hover:text-white group-hover:text-zinc-900 transition-colors truncate">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      <span className="text-xs dark:text-zinc-500 text-zinc-500">{status.label}</span>
                    </div>
                  </div>
                </div>
                {project.description && (
                  <p className="text-xs dark:text-zinc-600 text-zinc-500 mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
                )}
                <div className="flex items-center gap-4 pt-3 border-t dark:border-zinc-800/40 border-zinc-200 text-xs dark:text-zinc-600 text-zinc-500">
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
          <div className="w-10 h-10 dark:bg-zinc-900 bg-zinc-100 dark:border-zinc-800 border-zinc-300 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FolderKanban className="w-5 h-5 dark:text-zinc-700 text-zinc-400" />
          </div>
          <p className="text-sm dark:text-zinc-500 text-zinc-500">
            {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          </p>
          {!search && <p className="text-xs dark:text-zinc-700 text-zinc-400 mt-1">Crie seu primeiro projeto para começar</p>}
        </div>
      )}
    </div>
  )
}
