'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Paperclip, X, Loader2, Bot, Zap, Mic, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, BookOpen, TicketCheck } from 'lucide-react'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  personality: string | null
  shareToken: string
  organization: { name: string; logoUrl: string | null; slug: string }
  project: { id: string; name: string; color: string } | null
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  fileUrl?: string
  fileType?: string
  fileName?: string
  toolCalls?: { name: string; result: unknown }[]
  loading?: boolean
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  create_task: <TicketCheck className="w-3.5 h-3.5 text-emerald-400" />,
  get_task_status: <TicketCheck className="w-3.5 h-3.5 text-blue-400" />,
  get_project_status: <TicketCheck className="w-3.5 h-3.5 text-violet-400" />,
  search_knowledge_base: <BookOpen className="w-3.5 h-3.5 text-amber-400" />,
}

const TOOL_LABELS: Record<string, string> = {
  create_task: 'Tarefa criada',
  get_task_status: 'Status da tarefa',
  get_project_status: 'Status do projeto',
  search_knowledge_base: 'Base de conhecimento',
}

function ToolCallBadge({ name, result }: { name: string; result: unknown }) {
  const r = result as Record<string, unknown>
  return (
    <div className="mt-2 flex items-center gap-2 text-[10px] bg-zinc-800/60 border border-zinc-700/40 rounded-lg px-2.5 py-1.5">
      {TOOL_ICONS[name] ?? <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />}
      <span className="text-zinc-400 font-medium">{TOOL_LABELS[name] ?? name}</span>
      {r?.taskId && <span className="text-zinc-500 font-mono">#{(r.taskId as string).slice(-8)}</span>}
      {r?.error && <span className="text-red-400">{r.error as string}</span>}
    </div>
  )
}

function MessageBubble({ msg, agentName }: { msg: Message; agentName: string }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-violet-300" />
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* File attachment preview */}
        {msg.fileUrl && msg.fileType === 'image' && (
          <img src={msg.fileUrl} alt="anexo" className="rounded-xl max-w-xs max-h-48 object-cover border border-zinc-700" />
        )}
        {msg.fileUrl && msg.fileType !== 'image' && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${isUser ? 'bg-violet-900/30 border-violet-500/20 text-violet-300' : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400'}`}>
            {msg.fileType === 'audio' ? <Mic className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            <span className="truncate max-w-[200px]">{msg.fileName}</span>
          </div>
        )}

        {/* Bubble */}
        {msg.loading ? (
          <div className="px-4 py-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/40">
            <div className="flex items-center gap-2 text-zinc-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs">Digitando...</span>
            </div>
          </div>
        ) : (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-violet-600/20 border border-violet-500/25 text-zinc-100 rounded-tr-md'
                : 'bg-zinc-800/60 border border-zinc-700/40 text-zinc-200 rounded-tl-md'
            }`}
          >
            {msg.content}
          </div>
        )}

        {/* Tool call badges */}
        {msg.toolCalls?.map((tc, i) => (
          <ToolCallBadge key={i} name={tc.name} result={tc.result} />
        ))}
      </div>
    </div>
  )
}

export default function AgentChat({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachPreview, setAttachPreview] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Initialize session
  useEffect(() => {
    const storageKey = `agent_session_${agent.shareToken}`
    const saved = localStorage.getItem(storageKey)

    const init = async () => {
      try {
        // Try to reuse existing session
        if (saved) {
          setSessionToken(saved)
        } else {
          const res = await fetch(`/api/public/agent/${agent.shareToken}/session`, { method: 'POST' })
          const data = await res.json()
          if (data.sessionToken) {
            localStorage.setItem(storageKey, data.sessionToken)
            setSessionToken(data.sessionToken)
          }
        }
      } finally {
        setInitLoading(false)
      }
    }
    init()
  }, [agent.shareToken])

  // Welcome message
  useEffect(() => {
    if (!initLoading && sessionToken && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Olá! Sou ${agent.name}, agente de suporte da ${agent.organization.name}.\n\nComo posso te ajudar hoje? Você pode me perguntar sobre problemas técnicos, verificar o status de uma solicitação, ou criar um novo chamado. Também posso buscar artigos na nossa base de conhecimento! 😊`,
      }])
    }
  }, [initLoading, sessionToken, messages.length, agent])

  useEffect(() => { scrollToBottom() }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachedFile(file)

    if (file.type.startsWith('image/')) {
      setFileType('image')
      const reader = new FileReader()
      reader.onload = ev => setAttachPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      setFileType('audio')
      setAttachPreview(null)
    } else if (file.type === 'application/pdf') {
      setFileType('pdf')
      setAttachPreview(null)
    } else {
      setFileType('other')
      setAttachPreview(null)
    }
  }

  const removeFile = () => {
    setAttachedFile(null)
    setAttachPreview(null)
    setFileType(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || !sessionToken || loading) return

    const userContent = input.trim() || (fileType === 'audio' ? '[Áudio enviado]' : fileType === 'pdf' ? '[PDF enviado]' : '[Arquivo enviado]')
    const msgId = Date.now().toString()

    const userMsg: Message = {
      id: msgId,
      role: 'user',
      content: userContent,
      fileType: fileType ?? undefined,
      fileName: attachedFile?.name,
    }

    setMessages(prev => [...prev, userMsg, { id: msgId + '_loading', role: 'assistant', content: '', loading: true }])
    setInput('')
    setLoading(true)

    let uploadedUrl: string | null = null
    let finalFileType = fileType

    try {
      // Upload file if present
      if (attachedFile) {
        const fd = new FormData()
        fd.append('file', attachedFile)
        const uploadRes = await fetch(`/api/public/agent/${agent.shareToken}/upload`, { method: 'POST', body: fd })
        if (uploadRes.ok) {
          const upData = await uploadRes.json()
          uploadedUrl = upData.publicUrl
          finalFileType = upData.fileType
          userMsg.fileUrl = uploadedUrl!
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, fileUrl: uploadedUrl! } : m))
        }
      }

      removeFile()

      // Send to AI
      const res = await fetch(`/api/public/agent/${agent.shareToken}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          message: userContent,
          fileUrl: uploadedUrl,
          fileType: finalFileType,
          fileName: attachedFile?.name,
        }),
      })

      const data = await res.json()

      setMessages(prev => prev
        .filter(m => m.id !== msgId + '_loading')
        .concat({
          id: msgId + '_reply',
          role: 'assistant',
          content: data.message || 'Desculpe, ocorreu um erro. Tente novamente.',
          toolCalls: data.toolCalls,
        })
      )
    } catch {
      setMessages(prev => prev
        .filter(m => m.id !== msgId + '_loading')
        .concat({
          id: msgId + '_err',
          role: 'assistant',
          content: 'Erro de conexão. Por favor, tente novamente.',
        })
      )
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const newSession = async () => {
    const storageKey = `agent_session_${agent.shareToken}`
    localStorage.removeItem(storageKey)
    const res = await fetch(`/api/public/agent/${agent.shareToken}/session`, { method: 'POST' })
    const data = await res.json()
    if (data.sessionToken) {
      localStorage.setItem(storageKey, data.sessionToken)
      setSessionToken(data.sessionToken)
      setMessages([])
    }
  }

  if (initLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0e0b1e 0%, #09090b 45%, #090e1b 100%)' }}>
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#09090b]"
      style={{ background: 'linear-gradient(160deg, #0e0b1e 0%, #09090b 45%, #090e1b 100%)' }}
    >
      {/* Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/40 dark:bg-zinc-950 bg-white/60 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/20 flex items-center justify-center">
              {agent.organization.logoUrl ? (
                <img src={agent.organization.logoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <Bot className="w-4 h-4 text-violet-300" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{agent.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-zinc-500">{agent.organization.name} · Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={newSession}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800/40"
          >
            Nova conversa
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} agentName={agent.name} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="relative z-10 border-t border-zinc-800/40 dark:bg-zinc-950 bg-white/60 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* File preview */}
          {attachedFile && (
            <div className="mb-3 flex items-center gap-2 bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-3 py-2">
              {fileType === 'image' && attachPreview ? (
                <img src={attachPreview} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : fileType === 'audio' ? (
                <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-zinc-400" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-zinc-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 truncate">{attachedFile.name}</p>
                <p className="text-[10px] text-zinc-600 capitalize">{fileType}</p>
              </div>
              <button onClick={removeFile} className="text-zinc-500 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input row */}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="p-2.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-xl transition-colors flex-shrink-0"
              title="Anexar imagem, áudio ou PDF"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-zinc-700 resize-none transition-all max-h-32 overflow-y-auto"
                style={{ minHeight: '42px' }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 128) + 'px'
                }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !attachedFile)}
              className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>

          <p className="text-[10px] text-zinc-700 text-center mt-2.5">
            Pressione Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/30 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-1.5">
          <div className="w-3.5 h-3.5 bg-zinc-800 rounded-sm flex items-center justify-center">
            <Zap className="w-2 h-2 text-violet-400" />
          </div>
          <p className="text-[10px] text-zinc-700">
            Powered by{' '}
            <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition-colors">
              ProjectFlow
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
