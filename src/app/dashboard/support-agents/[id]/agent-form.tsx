'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Save, Trash2, ExternalLink, Copy, Check, Code2, ArrowLeft, MessageSquare, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'

interface Project { id: string; name: string; color: string }
interface Session { sessionToken: string; createdAt: string; updatedAt: string; _count: { messages: number }; visitorName?: string }
interface Agent {
  id: string
  name: string
  personality: string | null
  voiceTone: string | null
  conductPrompt: string | null
  projectId: string | null
  active: boolean
  showOnPublicKB: boolean
  shareToken: string
  sessions: Session[]
}

const PERSONALITY_SUGGESTIONS = [
  'Profissional e amigável',
  'Técnico e preciso',
  'Descontraído e acessível',
  'Empático e paciente',
  'Direto e objetivo',
]

const TONE_SUGGESTIONS = [
  'Formal',
  'Informal',
  'Neutro',
  'Entusiasmado',
  'Cuidadoso',
]

const CONDUCT_TEMPLATES = [
  {
    label: 'Suporte técnico',
    text: 'Você auxilia no diagnóstico e resolução de problemas técnicos. Sempre peça versão do sistema, passos para reproduzir o erro e screenshots quando relevante. Tente resolver o problema antes de escalar para uma tarefa.',
  },
  {
    label: 'Atendimento geral',
    text: 'Você é o primeiro ponto de contato. Identifique se a solicitação pode ser resolvida pela base de conhecimento. Para dúvidas simples, responda diretamente. Para solicitações que requerem ação da equipe, crie uma tarefa com todos os detalhes.',
  },
  {
    label: 'Onboarding',
    text: 'Você guia novos usuários na configuração e uso do sistema. Apresente recursos de forma progressiva e incentive a leitura da documentação. Crie tarefas apenas para configurações que precisam de intervenção manual da equipe.',
  },
]

export default function AgentForm({
  agent,
  projects,
  isNew,
  origin,
}: {
  agent: Agent | null
  projects: Project[]
  isNew: boolean
  origin: string
}) {
  const router = useRouter()

  const [name, setName] = useState(agent?.name || 'Agente de Suporte')
  const [personality, setPersonality] = useState(agent?.personality || '')
  const [voiceTone, setVoiceTone] = useState(agent?.voiceTone || '')
  const [conductPrompt, setConductPrompt] = useState(agent?.conductPrompt || '')
  const [projectId, setProjectId] = useState(agent?.projectId || '')
  const [active, setActive] = useState(agent?.active ?? true)
  const [showOnPublicKB, setShowOnPublicKB] = useState(agent?.showOnPublicKB ?? false)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'link' | 'script' | null>(null)
  const [activeTab, setActiveTab] = useState<'config' | 'share' | 'sessions'>('config')

  const shareUrl = agent ? `${origin}/public/agent/${agent.shareToken}` : ''

  const embedScript = agent
    ? `<!-- ProjectFlow Support Agent Widget -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${origin}/agent-widget.js';
    s.setAttribute('data-agent', '${agent.shareToken}');
    s.setAttribute('data-origin', '${origin}');
    document.head.appendChild(s);
  })();
</script>`
    : ''

  const handleCopy = async (type: 'link' | 'script') => {
    await navigator.clipboard.writeText(type === 'link' ? shareUrl : embedScript)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')

    try {
      if (isNew) {
        const res = await fetch('/api/support-agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, personality, voiceTone, conductPrompt, projectId: projectId || null, active, showOnPublicKB }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        router.push(`/dashboard/support-agents/${data.id}`)
        router.refresh()
      } else {
        const res = await fetch(`/api/support-agents/${agent!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, personality, voiceTone, conductPrompt, projectId: projectId || null, active, showOnPublicKB }),
        })
        if (!res.ok) throw new Error('Erro ao salvar')
        router.refresh()
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!agent || !confirm('Excluir este agente e todo o histórico de conversas?')) return
    setDeleting(true)
    await fetch(`/api/support-agents/${agent.id}`, { method: 'DELETE' })
    router.push('/dashboard/support-agents')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/support-agents" className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-md transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-zinc-100">{isNew ? 'Novo Agente' : name}</h1>
          <p className="text-xs text-zinc-500">{isNew ? 'Configure seu agente de suporte com IA' : 'Configurações do agente'}</p>
        </div>
        {!isNew && (
          <div className="flex items-center gap-2">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-md transition-colors"
              title="Abrir chat"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      {!isNew && (
        <div className="flex gap-1 mb-6 bg-zinc-900/60 border border-zinc-800 rounded-lg p-1 w-fit">
          {[
            { id: 'config', label: 'Configuração' },
            { id: 'share', label: 'Compartilhar' },
            { id: 'sessions', label: `Sessões (${agent?.sessions?.length ?? 0})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── CONFIG TAB ── */}
      {(isNew || activeTab === 'config') && (
        <div className="space-y-5">
          {/* Name + status */}
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Identidade</h2>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome do agente *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-zinc-700"
                placeholder="Ex: Ana, Suporte TI, Help Desk..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Personalidade</label>
              <input
                value={personality}
                onChange={e => setPersonality(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-zinc-700"
                placeholder="Descreva como o agente deve se comportar..."
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PERSONALITY_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPersonality(s)}
                    className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                      personality === s
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tom de voz</label>
              <input
                value={voiceTone}
                onChange={e => setVoiceTone(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-zinc-700"
                placeholder="Como o agente se comunica..."
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TONE_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVoiceTone(s)}
                    className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                      voiceTone === s
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conduct prompt */}
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Forma de condução</h2>
            <p className="text-xs text-zinc-500">Instruções adicionais de comportamento e contexto para o agente.</p>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {CONDUCT_TEMPLATES.map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setConductPrompt(t.text)}
                  className="text-[10px] px-2 py-1 rounded-md border bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              value={conductPrompt}
              onChange={e => setConductPrompt(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-zinc-700 resize-none"
              placeholder="Descreva como o agente deve conduzir o atendimento, quais informações coletar, quando escalar, etc..."
            />
          </div>

          {/* Project + flags */}
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Integração</h2>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Projeto para criar tarefas</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              >
                <option value="">Nenhum projeto vinculado</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-600 mt-1">O agente usará este projeto para criar tarefas e consultar status.</p>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-zinc-800/40">
              <div>
                <p className="text-xs font-medium text-zinc-300">Agente ativo</p>
                <p className="text-[10px] text-zinc-600">Desative para pausar o atendimento sem excluir o agente</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`transition-colors ${active ? 'text-emerald-400' : 'text-zinc-600'}`}
              >
                {active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-zinc-800/40">
              <div>
                <p className="text-xs font-medium text-zinc-300">Mostrar na Base de Conhecimento pública</p>
                <p className="text-[10px] text-zinc-600">Exibe um botão de chat flutuante na KB pública da organização</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnPublicKB(!showOnPublicKB)}
                className={`transition-colors ${showOnPublicKB ? 'text-violet-400' : 'text-zinc-600'}`}
              >
                {showOnPublicKB ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center gap-3 justify-between">
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir agente
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isNew ? 'Criar Agente' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* ── SHARE TAB ── */}
      {!isNew && activeTab === 'share' && agent && (
        <div className="space-y-4">
          {/* Direct link */}
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Link de compartilhamento</h2>
            <p className="text-xs text-zinc-500">Compartilhe este link diretamente com seus clientes ou incorpore no seu site.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 h-9 px-3 bg-zinc-900/40 border border-zinc-800 rounded-lg text-xs text-zinc-400 font-mono"
              />
              <button
                onClick={() => handleCopy('link')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
              >
                {copied === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'link' ? 'Copiado!' : 'Copiar'}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir
              </a>
            </div>
          </div>

          {/* Embed script */}
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Widget para incorporar</h2>
            </div>
            <p className="text-xs text-zinc-500">
              Cole este script antes de <code className="text-violet-300 bg-zinc-900 px-1 rounded">&lt;/head&gt;</code> no seu site.
              Um botão flutuante aparecerá no canto inferior direito.
            </p>
            <div className="relative">
              <pre className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 text-[11px] text-zinc-400 font-mono overflow-x-auto whitespace-pre-wrap">
                {embedScript}
              </pre>
              <button
                onClick={() => handleCopy('script')}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-zinc-300 transition-colors"
              >
                {copied === 'script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied === 'script' ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-3 text-[11px] text-zinc-500 space-y-1">
              <p><span className="text-zinc-400">data-agent</span>: token do agente</p>
              <p><span className="text-zinc-400">data-origin</span>: URL base da aplicação</p>
              <p>Adicione <span className="text-zinc-400">data-position="left"</span> para mover o widget para o lado esquerdo.</p>
              <p>Adicione <span className="text-zinc-400">data-label="Fale conosco"</span> para personalizar o texto do botão.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SESSIONS TAB ── */}
      {!isNew && activeTab === 'sessions' && agent && (
        <div className="space-y-3">
          {agent.sessions.length === 0 ? (
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-10 text-center">
              <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Nenhuma conversa ainda</p>
            </div>
          ) : (
            agent.sessions.map(s => (
              <div key={s.sessionToken} className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300">{s.visitorName || 'Visitante anônimo'}</p>
                  <p className="text-[10px] text-zinc-600">{s._count.messages} mensagens · {new Date(s.updatedAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
