'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail, Lock, ArrowLeft, Loader2, Zap, Check, Brain, DollarSign,
  Timer, ArrowRight, User, Sparkles,
} from 'lucide-react'

const features = [
  { icon: DollarSign, label: 'Custo por projeto em tempo real' },
  { icon: Timer, label: 'SLA e prazos monitorados' },
  { icon: Brain, label: 'Insights de IA automáticos' },
  { icon: Check, label: 'Relatórios de produtividade' },
]

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [emailConfirmation, setEmailConfirmation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await response.json()
        if (!response.ok) {
          setError(data.error || 'Erro ao fazer login')
          setLoading(false)
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const data = await response.json()
        if (!response.ok) {
          setError(data.error || 'Erro ao criar conta')
          setLoading(false)
        } else if (data.emailConfirmation) {
          setEmailConfirmation(true)
          setLoading(false)
        } else {
          window.location.href = '/dashboard'
        }
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode)
    setError('')
    setEmailConfirmation(false)
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* ─── LEFT PANEL: Branding ─── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative flex-col justify-between p-10 overflow-hidden border-r border-zinc-800/40">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-[#09090b] to-[#09090b] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center group-hover:border-zinc-700 transition-colors">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-200 tracking-tight">ProjectFlow</span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-4">
            Inteligência Operacional
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-100 leading-snug mb-6">
            Custo, prazo e<br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              produtividade reais
            </span>
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed mb-8 max-w-xs">
            Gestão operacional completa para equipes de tecnologia. Controle tudo numa só plataforma.
          </p>
          <ul className="space-y-3">
            {features.map(({ icon: Icon, label }, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <span className="text-sm text-zinc-400">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-[10px] text-zinc-700 leading-relaxed">
            © 2026 ProjectFlow · Em conformidade com a LGPD (Lei nº 13.709/2018)
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Form ─── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/10 via-[#09090b] to-blue-950/8 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center group-hover:border-zinc-700 transition-colors">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-200">ProjectFlow</span>
            </Link>
          </div>

          {/* Mode tabs */}
          <div className="flex bg-zinc-900/60 border border-zinc-800/70 rounded-xl p-1 mb-7">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* Header */}
          <div className="mb-6">
            {mode === 'login' ? (
              <>
                <h1 className="text-xl font-semibold text-white tracking-tight mb-1.5">Bem-vindo de volta</h1>
                <p className="text-sm text-zinc-500">Entre na sua conta para continuar</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-white tracking-tight mb-1.5">Criar conta grátis</h1>
                <p className="text-sm text-zinc-500">Comece sem cartão de crédito</p>
              </>
            )}
          </div>

          {/* Closed-beta banner (register only) */}
          {mode === 'register' && !emailConfirmation && (
            <div className="mb-5 flex items-start gap-2.5 bg-violet-950/30 border border-violet-500/20 rounded-xl px-3.5 py-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-violet-300">Acesso aberto por tempo limitado</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                  Durante o closed-beta o cadastro é gratuito. Planos de cobrança serão aplicados após o encerramento desta fase.
                </p>
              </div>
            </div>
          )}

          {/* Email confirmation state */}
          {emailConfirmation ? (
            <div className="dark:bg-zinc-950 bg-white/70 border border-zinc-800/70 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-100 mb-2">Verifique seu email</h2>
              <p className="text-xs text-zinc-500 leading-relaxed mb-5">
                Enviamos um link de confirmação para <span className="text-zinc-300 font-medium">{email}</span>.
                Clique no link para ativar sua conta.
              </p>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Já confirmei → Fazer login
              </button>
            </div>
          ) : (
            /* Form card */
            <div className="dark:bg-zinc-950 bg-white/70 border border-zinc-800/70 rounded-2xl p-6 backdrop-blur-sm shadow-2xl shadow-black/40">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name (register only) */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-zinc-700 transition-all"
                        placeholder="Seu nome"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-zinc-700 transition-all"
                      placeholder="voce@empresa.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Senha</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-zinc-700 transition-all"
                      placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                      required
                      minLength={mode === 'register' ? 6 : undefined}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2.5">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(255,255,255,0.08)] mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Entrar' : 'Criar conta grátis'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Back link */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
