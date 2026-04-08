'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Check, Loader2, CheckCircle2 } from 'lucide-react'

interface Project {
  id: string
  name: string
}

export default function QuickTaskButton({ userRole }: { userRole?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)

  useEffect(() => {
    if (open && projects.length === 0) {
      const url = (userRole === 'OWNER' || userRole === 'ADMIN')
        ? '/api/projects?all=1'
        : '/api/projects'
      fetch(url)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const projectList = Array.isArray(data) ? data : []
          setProjects(projectList)
          if (projectList.length > 0) {
            setSelectedProject(projectList[0].id)
          }
        })
        .catch(() => setProjects([]))
    }
  }, [open])

  const handleCreate = async () => {
    if (!title.trim() || !selectedProject) return
    setCreating(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          projectId: selectedProject,
          priority,
        }),
      })
      if (res.ok) {
        setCreated(true)
        setTimeout(() => {
          setOpen(false)
          setCreated(false)
          setTitle('')
          setDescription('')
          router.refresh()
        }, 1500)
      }
    } catch {
      // silent
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setCreated(false) }}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Nova Tarefa
      </button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setCreated(false); setProjects([]) } }}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          {created ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-zinc-100 mb-1">Tarefa criada!</h3>
              <p className="text-sm text-zinc-500">Redirecionando...</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Nova Tarefa Rápida</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div>
                  <Label className="text-xs text-zinc-400">Projeto</Label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="mt-1 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  >
                    {projects.length > 0 ? (
                      projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))
                    ) : (
                      <option value="">Nenhum projeto disponível</option>
                    )}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-zinc-400">Título</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="O que precisa ser feito?"
                    className="mt-1 bg-zinc-900/60 border-zinc-800"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleCreate()
                      }
                    }}
                  />
                </div>

                <div>
                  <Label className="text-xs text-zinc-400">Descrição (opcional)</Label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes..."
                    className="mt-1 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-zinc-400">Prioridade</Label>
                  <div className="mt-1 flex gap-1.5">
                    {[
                      { value: 'LOW', label: 'Baixa', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-700/40' },
                      { value: 'MEDIUM', label: 'Média', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                      { value: 'HIGH', label: 'Alta', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                      { value: 'URGENT', label: 'Urgente', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setPriority(opt.value as any)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                          priority === opt.value ? 'ring-1 ring-white/20 scale-105' : 'opacity-60 hover:opacity-100'
                        } ${opt.cls}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); setCreated(false) }}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={creating || !title.trim() || !selectedProject || projects.length === 0}>
                  {creating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Criar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
