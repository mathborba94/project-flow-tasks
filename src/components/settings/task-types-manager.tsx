'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Check, Loader2, X } from 'lucide-react'

interface TaskType {
  id: string
  name: string
  slaMinutes: number
  description: string | null
}

interface TaskTypesManagerProps {
  taskTypes: TaskType[]
  defaultTaskTypeId: string | null
}

export default function TaskTypesManager({ taskTypes: initialTaskTypes, defaultTaskTypeId: initialDefaultId }: TaskTypesManagerProps) {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>(initialTaskTypes)
  const [defaultTaskTypeId, setDefaultTaskTypeId] = useState<string | null>(initialDefaultId)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formSla, setFormSla] = useState(480)
  const [formDescription, setFormDescription] = useState('')

  const resetForm = () => {
    setFormName('')
    setFormSla(480)
    setFormDescription('')
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  const startEdit = (tt: TaskType) => {
    setEditingId(tt.id)
    setFormName(tt.name)
    setFormSla(tt.slaMinutes)
    setFormDescription(tt.description || '')
    setShowForm(true)
    setError('')
  }

  const handleSave = async () => {
    if (!formName.trim()) return

    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const url = editingId
        ? `/api/task-types`
        : '/api/task-types'

      const method = editingId ? 'PATCH' : 'POST'
      const body: Record<string, unknown> = {
        name: formName.trim(),
        slaMinutes: formSla,
        description: formDescription.trim() || null,
      }
      if (editingId) {
        body.id = editingId
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        if (editingId) {
          setTaskTypes((prev) =>
            prev.map((tt) => (tt.id === editingId ? { ...tt, ...data } : tt))
          )
        } else {
          setTaskTypes((prev) => [...prev, data])
        }
        resetForm()
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar')
      }
    } catch {
      setError('Erro de conexao')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este tipo de tarefa?')) return

    try {
      const res = await fetch(`/api/task-types?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setTaskTypes((prev) => prev.filter((tt) => tt.id !== id))
        if (defaultTaskTypeId === id) {
          setDefaultTaskTypeId(null)
        }
      }
    } catch {
      // ignore
    }
  }

  const handleDefaultChange = async (value: string) => {
    const newDefaultId = value === '__none__' ? null : value
    setDefaultTaskTypeId(newDefaultId)

    try {
      await fetch('/api/organizations/default-task-type', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultTaskTypeId: newDefaultId }),
      })
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      {/* Default task type selector */}
      <div className="flex items-center gap-3">
        <Label className="text-xs text-zinc-400 whitespace-nowrap">Tipo padrao:</Label>
        <Select
          value={defaultTaskTypeId || '__none__'}
          onValueChange={handleDefaultChange}
        >
          <SelectTrigger className="h-8 text-sm min-w-[200px]">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Nenhum</SelectItem>
            {taskTypes.map((tt) => (
              <SelectItem key={tt.id} value={tt.id}>
                {tt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task types list */}
      <div className="space-y-2">
        {taskTypes.length === 0 && !showForm && (
          <p className="text-sm text-zinc-600 py-4 text-center">
            Nenhum tipo de tarefa criado ainda.
          </p>
        )}

        {taskTypes.map((tt) => (
          <div
            key={tt.id}
            className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/50 rounded-lg px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200 truncate">{tt.name}</span>
                {defaultTaskTypeId === tt.id && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    padrao
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-zinc-500">SLA: {tt.slaMinutes}min</span>
                {tt.description && (
                  <span className="text-xs text-zinc-600 truncate">{tt.description}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => startEdit(tt)}
                className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                title="Editar"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(tt.id)}
                className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-zinc-300">
            {editingId ? 'Editar tipo de tarefa' : 'Novo tipo de tarefa'}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tt-name" className="text-xs text-zinc-400">Nome</Label>
              <Input
                id="tt-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Ex: Bug, Feature..."
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="tt-sla" className="text-xs text-zinc-400">SLA (minutos)</Label>
              <Input
                id="tt-sla"
                type="number"
                min={1}
                value={formSla}
                onChange={(e) => setFormSla(parseInt(e.target.value) || 1)}
                className="h-8 text-sm mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tt-desc" className="text-xs text-zinc-400">Descricao</Label>
            <Input
              id="tt-desc"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="h-8 text-sm mt-1"
              placeholder="Descricao opcional..."
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {saved && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Salvo com sucesso!
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={resetForm} disabled={saving}>
              <X className="w-3.5 h-3.5 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Salvando...</>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>
      )}

      {!showForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFormName('')
            setFormSla(480)
            setFormDescription('')
            setShowForm(true)
            setEditingId(null)
            setError('')
          }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Adicionar tipo de tarefa
        </Button>
      )}
    </div>
  )
}
