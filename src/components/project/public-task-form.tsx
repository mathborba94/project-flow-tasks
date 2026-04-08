'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, CheckCircle2, Loader2, Copy, Paperclip, X, BookOpen, Sparkles, ArrowRight, ChevronRight } from 'lucide-react'

interface Member {
  id: string
  name: string
  email: string
}

interface Stage {
  id: string
  name: string
  order: number
}

interface TaskType {
  id: string
  name: string
  slaMinutes: number
}

interface KBArticle {
  id: string
  title: string
  excerpt: string
  categoryName: string | null
}

export default function PublicTaskForm({
  projectId,
  orgSlug,
  members,
  stages,
  taskTypes,
  defaultTaskTypeId,
}: {
  projectId: string
  orgSlug?: string
  members: Member[]
  stages: Stage[]
  taskTypes?: TaskType[]
  defaultTaskTypeId?: string | null
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [assigneeId, setAssigneeId] = useState('')
  const [taskTypeId, setTaskTypeId] = useState(defaultTaskTypeId || '')
  const [requesterName, setRequesterName] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // KB suggestions state
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([])
  const [kbOrgSlug, setKbOrgSlug] = useState<string | undefined>(orgSlug)
  const [kbLoading, setKbLoading] = useState(false)
  const [kbDismissed, setKbDismissed] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastQueryRef = useRef('')

  const searchKB = useCallback(async (query: string) => {
    if (!query || query.length < 10 || query === lastQueryRef.current) return
    lastQueryRef.current = query
    setKbLoading(true)
    try {
      const res = await fetch(
        `/api/public/projects/${projectId}/knowledge-search?q=${encodeURIComponent(query)}`
      )
      if (res.ok) {
        const data = await res.json()
        if (data.articles?.length > 0) {
          setKbArticles(data.articles)
          if (data.orgSlug) setKbOrgSlug(data.orgSlug)
          setKbDismissed(false)
        } else {
          setKbArticles([])
        }
      }
    } catch {
      // silently ignore
    } finally {
      setKbLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (title.length < 10) {
      setKbArticles([])
      setKbLoading(false)
      return
    }
    setKbLoading(true)
    debounceRef.current = setTimeout(() => {
      searchKB(title)
    }, 700)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [title, searchKB])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
  }

  const removeFile = () => {
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setError('')

    try {
      let fileUrl: string | null = null

      if (attachedFile) {
        const formData = new FormData()
        formData.append('file', attachedFile)
        formData.append('projectId', projectId)

        const uploadRes = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || 'Erro ao enviar arquivo')
        }

        const { publicUrl } = await uploadRes.json()
        fileUrl = publicUrl
      }

      const res = await fetch(`/api/public/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          assignedToId: assigneeId || null,
          taskTypeId: taskTypeId || null,
          requesterName: requesterName.trim() || null,
          requesterEmail: requesterEmail.trim() || null,
          fileUrl,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Erro ao criar tarefa')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro de conexão. Tente novamente.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const formUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/projects/${projectId}/new-task`

  const priorityOptions = [
    { value: 'LOW', label: 'Baixa', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-700/40' },
    { value: 'MEDIUM', label: 'Média', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'HIGH', label: 'Alta', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { value: 'URGENT', label: 'Urgente', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  ]

  const showSuggestions = !kbDismissed && (kbLoading || kbArticles.length > 0) && title.length >= 10

  if (submitted) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Tarefa criada com sucesso!</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Sua solicitação foi recebida e será analisada pela equipe.
        </p>
        <Button
          onClick={() => {
            setSubmitted(false)
            setTitle('')
            setDescription('')
            setPriority('MEDIUM')
            setAssigneeId('')
            setTaskTypeId(defaultTaskTypeId || '')
            setAttachedFile(null)
            setKbArticles([])
            setKbDismissed(false)
            lastQueryRef.current = ''
          }}
          variant="outline"
        >
          Criar outra tarefa
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl overflow-hidden">
      {/* Form header */}
      <div className="px-6 py-4 border-b border-zinc-800/40 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-200">Solicitar Tarefa</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(formUrl)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-zinc-800/40"
            title="Copiar link do formulário"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar link
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-sm">
            Título <span className="text-red-400">*</span>
          </Label>
          <div className="relative mt-1.5">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descreva brevemente o que precisa ser feito"
              className="bg-zinc-900/60 border-zinc-800 pr-8"
              required
            />
            {kbLoading && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
              </div>
            )}
          </div>

          {/* KB Suggestions Panel */}
          {showSuggestions && (
            <div className="mt-2.5 rounded-xl border border-violet-500/20 bg-violet-950/20 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-violet-500/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-medium text-violet-300">
                    Encontrei artigos que podem te ajudar
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setKbDismissed(true)}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed tip */}
              <div className="px-3.5 pt-2.5 pb-1">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  <span className="text-emerald-400 font-medium">Dica:</span>{' '}
                  Resolver pela base de conhecimento é bem mais rápido do que abrir uma tarefa. Confira se sua dúvida já está respondida:
                </p>
              </div>

              {/* Articles */}
              {kbLoading && kbArticles.length === 0 ? (
                <div className="px-3.5 py-3 flex items-center gap-2 text-xs text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Buscando artigos relacionados...
                </div>
              ) : (
                <ul className="px-2 pb-2 pt-1 space-y-1">
                  {kbArticles.map(article => (
                    <li key={article.id}>
                      {kbOrgSlug ? (
                        <a
                          href={`/public/knowledge/${kbOrgSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-violet-500/10 transition-colors group"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-zinc-200 group-hover:text-violet-200 transition-colors truncate">
                              {article.title}
                            </p>
                            {article.excerpt && (
                              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {article.excerpt}
                              </p>
                            )}
                            {article.categoryName && (
                              <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-500 border border-zinc-700/30">
                                {article.categoryName}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-violet-400 flex-shrink-0 mt-0.5 transition-colors" />
                        </a>
                      ) : (
                        <div className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg">
                          <BookOpen className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-zinc-200 truncate">{article.title}</p>
                            {article.excerpt && (
                              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {article.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Footer action */}
              {kbOrgSlug && kbArticles.length > 0 && (
                <div className="px-3.5 pb-3 pt-1 border-t border-violet-500/10 flex items-center justify-between">
                  <a
                    href={`/public/knowledge/${kbOrgSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-medium"
                  >
                    Ver toda a base de conhecimento
                    <ArrowRight className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setKbDismissed(true)}
                    className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Já sei o que preciso
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-sm">
            Descrição
          </Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhe sua solicitação com informações relevantes..."
            className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none min-h-[100px]"
          />
        </div>

        {/* Task Type */}
        {taskTypes && taskTypes.length > 0 && (
          <div>
            <Label htmlFor="taskType" className="text-sm">Tipo de Tarefa</Label>
            <select
              id="taskType"
              value={taskTypeId}
              onChange={(e) => setTaskTypeId(e.target.value)}
              className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            >
              <option value="">Selecione...</option>
              {taskTypes.map(tt => (
                <option key={tt.id} value={tt.id}>{tt.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Priority */}
        <div>
          <Label className="text-sm">Prioridade</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {priorityOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  priority === opt.value
                    ? 'ring-1 ring-white/20 scale-105'
                    : 'opacity-60 hover:opacity-100'
                } ${opt.className}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignee */}
        {members.length > 0 && (
          <div>
            <Label htmlFor="assignee" className="text-sm">Responsável (opcional)</Label>
            <select
              id="assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1.5 w-full bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            >
              <option value="">Automático</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Requester info */}
        <div className="border-t border-zinc-800/40 pt-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">Seus dados</h3>
          <div>
            <Label htmlFor="requesterName" className="text-sm">Nome</Label>
            <Input
              id="requesterName"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              placeholder="Seu nome"
              className="mt-1.5 bg-zinc-900/60 border-zinc-800"
            />
          </div>
          <div>
            <Label htmlFor="requesterEmail" className="text-sm">Email de contato</Label>
            <Input
              id="requesterEmail"
              type="email"
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mt-1.5 bg-zinc-900/60 border-zinc-800"
            />
          </div>
        </div>

        {/* File attachment */}
        <div>
          <Label className="text-sm">Anexo (opcional)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {attachedFile ? (
            <div className="mt-1.5 flex items-center gap-2 bg-zinc-800/40 border border-zinc-700/40 rounded-md px-3 py-2">
              <Paperclip className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              <span className="text-sm text-zinc-300 truncate flex-1">{attachedFile.name}</span>
              <button
                type="button"
                onClick={removeFile}
                className="text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0"
                title="Remover arquivo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1.5 w-full flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-md py-2.5 text-sm text-zinc-500 hover:text-zinc-400 hover:border-zinc-600 transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
              Anexar arquivo (opcional)
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting || !title.trim()}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Solicitação
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
