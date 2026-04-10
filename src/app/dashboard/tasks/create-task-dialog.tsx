'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Task {
  id: string
  title: string
  project?: { name: string }
}

interface CreateTaskDialogProps {
  projects?: { id: string; name: string }[]
  members?: { id: string; name: string }[]
  children?: React.ReactNode
}

export function CreateTaskDialog({ projects = [], members = [], children }: CreateTaskDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    assignedToId: '',
    priority: 'MEDIUM',
    status: 'TODO',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setOpen(false)
        setFormData({ projectId: '', title: '', description: '', assignedToId: '', priority: 'MEDIUM', status: 'TODO' })
        router.refresh()
      } else {
        setError('Erro ao criar tarefa')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children || <Button>Nova Tarefa</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">Nova Tarefa</DialogTitle>
          <DialogDescription className="text-sm">
            Crie uma tarefa e vincule a um projeto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs dark:text-zinc-400 text-zinc-600">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Implementar autenticação"
              required
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs dark:text-zinc-400 text-zinc-600">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes da tarefa..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="project" className="text-xs dark:text-zinc-400 text-zinc-600">Projeto</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="assignee" className="text-xs dark:text-zinc-400 text-zinc-600">Responsável</Label>
              <Select
                value={formData.assignedToId}
                onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-sm">{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="priority" className="text-xs dark:text-zinc-400 text-zinc-600">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value || 'MEDIUM' })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW" className="text-sm">Baixa</SelectItem>
                  <SelectItem value="MEDIUM" className="text-sm">Média</SelectItem>
                  <SelectItem value="HIGH" className="text-sm">Alta</SelectItem>
                  <SelectItem value="URGENT" className="text-sm">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs dark:text-zinc-400 text-zinc-600">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value || 'TODO' })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO" className="text-sm">A Fazer</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="text-sm">Em Progresso</SelectItem>
                  <SelectItem value="IN_REVIEW" className="text-sm">Em Revisão</SelectItem>
                  <SelectItem value="DONE" className="text-sm">Concluído</SelectItem>
                  <SelectItem value="CANCELLED" className="text-sm">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t dark:border-zinc-800/60 border-zinc-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading || !formData.title.trim()}>
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
