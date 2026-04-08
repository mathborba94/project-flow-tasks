'use client'

import { useState, useEffect } from 'react'
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

interface CreateTimeEntryDialogProps {
  defaultTaskId?: string
  children?: React.ReactNode
}

export function CreateTimeEntryDialog({ defaultTaskId, children }: CreateTimeEntryDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    taskId: defaultTaskId || '',
    minutes: '',
    description: '',
  })

  useEffect(() => {
    if (open && tasks.length === 0) {
      fetch('/api/tasks')
        .then((res) => res.json())
        .then((data) => setTasks(data))
        .catch(console.error)
    }
  }, [open, tasks.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minutes: parseInt(formData.minutes),
        }),
      })

      if (res.ok) {
        setOpen(false)
        setFormData({ taskId: '', minutes: '', description: '' })
        router.refresh()
      } else {
        setError('Erro ao registrar tempo')
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
        {children || <Button>Registrar Tempo</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">Registrar Tempo</DialogTitle>
          <DialogDescription className="text-sm">
            Registre as horas trabalhadas em uma tarefa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="task" className="text-xs text-zinc-400">Tarefa</Label>
            <Select
              value={formData.taskId}
              onValueChange={(value) => setFormData({ ...formData, taskId: value || '' })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Selecione uma tarefa" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id} className="text-sm">
                    {task.title} {task.project && `(${task.project.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="minutes" className="text-xs text-zinc-400">Minutos</Label>
            <Input
              id="minutes"
              type="number"
              min="1"
              max="1440"
              value={formData.minutes}
              onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
              placeholder="Ex: 60"
              required
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs text-zinc-400">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o que foi feito..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading || !formData.taskId}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
