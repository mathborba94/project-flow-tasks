'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

type Tab = 'register' | 'login'

interface Props {
  token: string
  invitationEmail: string
  orgName: string
  role: string
  isLoggedIn: boolean
  currentUserEmail: string | null
}

export function JoinClient({ token, invitationEmail, orgName, isLoggedIn, currentUserEmail }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('register')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Accept for already logged-in user ────────────────────────────────────
  async function handleAccept() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao aceitar convite')
      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (isLoggedIn) {
    const emailMatch = currentUserEmail?.toLowerCase() === invitationEmail.toLowerCase()

    return (
      <div className="space-y-4">
        {!emailMatch && (
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-3 text-xs text-amber-400">
            Você está logado como <strong>{currentUserEmail}</strong>, mas o convite é para{' '}
            <strong>{invitationEmail}</strong>. Ao aceitar, seu email na organização será o do convite.
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-800/40 rounded-lg p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Aceitar convite para {orgName}
        </button>

        <a
          href="/dashboard"
          className="block text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Ir para o dashboard sem aceitar
        </a>
      </div>
    )
  }

  // ── Not logged in: show register / login tabs ─────────────────────────────
  return (
    <div>
      <div className="flex border border-zinc-800/60 rounded-lg p-0.5 mb-5 bg-zinc-900/40">
        {(['register', 'login'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === t
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'register' ? 'Criar conta' : 'Já tenho conta'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-950/40 border border-red-800/40 rounded-lg p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {tab === 'register' ? (
        <RegisterForm
          token={token}
          invitationEmail={invitationEmail}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
          onSuccess={() => router.push('/dashboard')}
        />
      ) : (
        <LoginForm
          token={token}
          invitationEmail={invitationEmail}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
          onSuccess={() => router.push('/dashboard')}
        />
      )}
    </div>
  )
}

// ── Register form ──────────────────────────────────────────────────────────

function RegisterForm({
  token, invitationEmail, loading, setLoading, setError, onSuccess,
}: {
  token: string
  invitationEmail: string
  loading: boolean
  setLoading: (v: boolean) => void
  setError: (v: string) => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: invitationEmail, password, invitationToken: token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar conta')
      if (data.emailConfirmation) {
        setError('Confirme seu email antes de continuar. Após confirmar, faça login nesta página.')
        return
      }
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Seu nome completo"
          className="w-full bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Email</label>
        <input
          type="email"
          value={invitationEmail}
          readOnly
          className="w-full dark:bg-zinc-900/30 bg-zinc-200/50 border border-zinc-800/40 rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
        />
        <p className="text-[11px] text-zinc-700 mt-1">Definido pelo convite</p>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="w-full bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-60 mt-1"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Criar conta e aceitar convite
      </button>
    </form>
  )
}

// ── Login form ─────────────────────────────────────────────────────────────

function LoginForm({
  token, invitationEmail, loading, setLoading, setError, onSuccess,
}: {
  token: string
  invitationEmail: string
  loading: boolean
  setLoading: (v: boolean) => void
  setError: (v: string) => void
  onSuccess: () => void
}) {
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Login first
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invitationEmail, password }),
      })
      const loginData = await loginRes.json()
      if (!loginRes.ok) throw new Error(loginData.error ?? 'Erro ao fazer login')

      // Then accept the invitation
      const acceptRes = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' })
      const acceptData = await acceptRes.json()
      if (!acceptRes.ok) throw new Error(acceptData.error ?? 'Erro ao aceitar convite')

      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Email</label>
        <input
          type="email"
          value={invitationEmail}
          readOnly
          className="w-full dark:bg-zinc-900/30 bg-zinc-200/50 border border-zinc-800/40 rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Sua senha"
          className="w-full bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-60 mt-1"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Entrar e aceitar convite
      </button>
    </form>
  )
}
