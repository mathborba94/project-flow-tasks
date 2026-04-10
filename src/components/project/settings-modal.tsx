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
import { User, Loader2 } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  color: string
  status: string
  type: string
  budget: any
  hourlyRate: any
  startDate: Date | string | null
  endDate: Date | string | null
  targetEndDate: Date | string | null
  completionStageId: string | null
  allowPublicTasks: boolean
  ownerId?: string
  owner?: { id: string; name: string; email: string } | null
}

interface OrgUser {
  id: string
  name: string
  email: string
  role: string
}

export default function SettingsModal({
  open,
  onOpenChange,
  project,
  stages = [],
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  stages?: Array<{ id: string; name: string; order: number }>
  onSave?: (updated: Partial<Project>) => void
}) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [color, setColor] = useState(project.color)
  const [status, setStatus] = useState(project.status)
  const [type, setType] = useState(project.type)
  const [budget, setBudget] = useState(project.budget?.toString() || '')
  const [hourlyRate, setHourlyRate] = useState(project.hourlyRate?.toString() || '')
  const [startDate, setStartDate] = useState(project.startDate ? (typeof project.startDate === 'string' ? project.startDate.split('T')[0] : project.startDate.toISOString().split('T')[0]) : '')
  const [endDate, setEndDate] = useState(project.endDate ? (typeof project.endDate === 'string' ? project.endDate.split('T')[0] : project.endDate.toISOString().split('T')[0]) : '')
  const [targetEndDate, setTargetEndDate] = useState(project.targetEndDate ? (typeof project.targetEndDate === 'string' ? project.targetEndDate.split('T')[0] : project.targetEndDate.toISOString().split('T')[0]) : '')
  const [completionStageId, setCompletionStageId] = useState(project.completionStageId || '')
  const [allowPublicTasks, setAllowPublicTasks] = useState(project.allowPublicTasks || false)
  const [ownerId, setOwnerId] = useState(project.ownerId || '')
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [saving, setSaving] = useState(false)

  // Carregar usuários da organização para seleção de owner
  useEffect(() => {
    if (open) {
      setLoadingUsers(true)
      fetch('/api/users')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setOrgUsers(data)
        })
        .catch(() => {})
        .finally(() => setLoadingUsers(false))
    }
  }, [open])

  // Sincronizar ownerId quando o modal abrir ou project mudar
  useEffect(() => {
    setOwnerId(project.ownerId || project.owner?.id || '')
  }, [open, project.ownerId, project.owner?.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          color,
          status,
          type,
          budget: budget ? parseFloat(budget) : null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          startDate: startDate || null,
          endDate: endDate || null,
          targetEndDate: targetEndDate || null,
          completionStageId: completionStageId || null,
          allowPublicTasks,
          ownerId: ownerId || null,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        // Notify parent to update local state
        onSave?.({
          completionStageId: updated.completionStageId,
          allowPublicTasks: updated.allowPublicTasks,
          name: updated.name,
          description: updated.description,
          color: updated.color,
          status: updated.status,
          type: updated.type,
          budget: updated.budget,
          hourlyRate: updated.hourlyRate,
          ownerId: updated.ownerId,
          owner: updated.owner,
        })
        onOpenChange(false)
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const statusOptions = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'PAUSED', label: 'Pausado' },
    { value: 'COMPLETED', label: 'Concluído' },
  ]

  const typeOptions = [
    { value: 'SCOPE_FIXED', label: 'Escopo Fechado' },
    { value: 'CONTINUOUS', label: 'Contínuo' },
  ]

  const colorPresets = [
    '#5c6ac4', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações do Projeto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome e Cor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 bg-zinc-900/60 border-zinc-800"
              />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none min-h-[80px]"
            />
          </div>

          {/* Status e Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              >
                {typeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Orçamento e Taxa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">Orçamento (R$)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
                className="mt-1 bg-zinc-900/60 border-zinc-800"
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Taxa Horária (R$)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="0.00"
                className="mt-1 bg-zinc-900/60 border-zinc-800"
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 bg-zinc-900/60 border-zinc-800"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Término</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 bg-zinc-900/60 border-zinc-800"
              />
            </div>
            <div>
              <Label htmlFor="targetEndDate">Prazo</Label>
              <Input
                id="targetEndDate"
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                className="mt-1 bg-zinc-900/60 border-zinc-800"
              />
            </div>
          </div>

          {/* Product Owner */}
          <div className="bg-zinc-900/40 rounded-lg p-4 border border-zinc-800/40">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Product Owner (P.O.)</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-violet-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400">Responsável pelo projeto</p>
                {project.owner && (
                  <p className="text-sm text-zinc-200 truncate">
                    {project.owner.name} <span className="text-zinc-600">({project.owner.email})</span>
                  </p>
                )}
              </div>
            </div>
            <Label htmlFor="owner" className="text-xs text-zinc-400">Transferir propriedade</Label>
            {loadingUsers ? (
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Carregando usuários...
              </div>
            ) : (
              <select
                id="owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="mt-1 w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <option value="">Manter owner atual</option>
                {orgUsers
                  .filter(u => u.role === 'OWNER' || u.role === 'ADMIN')
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'OWNER' ? 'Proprietário' : 'Admin'})
                    </option>
                  ))
                }
              </select>
            )}
          </div>
        </div>

        {/* Pipeline & Tasks Config */}
        {stages.length > 0 && (
          <div className="bg-zinc-900/40 rounded-lg p-4 space-y-4 border border-zinc-800/40">
            <h3 className="text-sm font-medium text-zinc-300">Pipeline & Tarefas</h3>
            <div>
              <Label htmlFor="completionStage" className="text-xs text-zinc-400">Etapa de Conclusão</Label>
              <p className="text-[11px] text-zinc-600 mt-0.5 mb-1.5">Tarefas não poderão ser criadas diretamente nesta etapa</p>
              <select
                id="completionStage"
                value={completionStageId}
                onChange={(e) => setCompletionStageId(e.target.value)}
                className="mt-0 w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <option value="">Nenhuma (todas as etapas permitem criação)</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowPublicTasks"
                checked={allowPublicTasks}
                onChange={(e) => setAllowPublicTasks(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-brand focus:ring-brand"
              />
              <Label htmlFor="allowPublicTasks" className="text-sm text-zinc-300 cursor-pointer">
                Permitir formulário público de tarefas
              </Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
