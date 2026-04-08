import { cookies } from 'next/headers'
import { createClientServer } from '@/lib/supabase-server'
import { getInvitationByToken } from '@/services/organization'
import prisma from '@/lib/prisma'
import { JoinClient } from './join-client'
import { Zap } from 'lucide-react'

const roleLabel: Record<string, string> = {
  OWNER: 'Proprietário', ADMIN: 'Administrador', MEMBER: 'Membro', VIEWER: 'Visualizador',
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const invitation = await getInvitationByToken(token)

  const isExpired = !invitation || invitation.expiresAt < new Date()
  const isAlreadyAccepted = !!invitation?.acceptedAt

  if (!invitation || isExpired || isAlreadyAccepted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-base font-semibold text-zinc-100 mb-2">
            {isAlreadyAccepted ? 'Convite já aceito' : 'Convite inválido'}
          </h1>
          <p className="text-sm text-zinc-500">
            {isAlreadyAccepted
              ? 'Este convite já foi utilizado.'
              : isExpired
              ? 'Este convite expirou. Peça um novo convite ao administrador da organização.'
              : 'O convite não foi encontrado.'}
          </p>
          <a
            href="/login"
            className="inline-block mt-6 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Ir para o login
          </a>
        </div>
      </div>
    )
  }

  // Check if current user is already logged in
  let isLoggedIn = false
  let currentUserEmail: string | null = null
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('sb-access-token')
    if (authCookie?.value) {
      const supabase = await createClientServer()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        isLoggedIn = true
        currentUserEmail = user.email ?? null

        // Check if user already belongs to this org
        const dbUser = await prisma.user.findFirst({
          where: { supabaseUserId: user.id },
        })
        if (dbUser?.organizationId === invitation.organizationId) {
          return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
              <div className="w-full max-w-md text-center">
                <h1 className="text-base font-semibold text-zinc-100 mb-2">
                  Você já é membro desta organização
                </h1>
                <a href="/dashboard" className="inline-block mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Ir para o dashboard
                </a>
              </div>
            </div>
          )
        }
      }
    }
  } catch {
    // not logged in
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-sm font-semibold text-zinc-300 tracking-tight">ProjectFlow</span>
        </div>

        {/* Invitation card */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 mb-6">
          <p className="text-xs text-zinc-500 mb-1">Convite para</p>
          <h2 className="text-base font-semibold text-zinc-100 mb-3">
            {invitation.organization.name}
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-600">Email:</span>
            <span className="text-zinc-300">{invitation.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm mt-1.5">
            <span className="text-zinc-600">Papel:</span>
            <span className="text-violet-400 font-medium">
              {roleLabel[invitation.role] ?? invitation.role}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm mt-1.5">
            <span className="text-zinc-600">Expira em:</span>
            <span className="text-zinc-400">
              {new Date(invitation.expiresAt).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <JoinClient
          token={token}
          invitationEmail={invitation.email}
          orgName={invitation.organization.name}
          role={invitation.role}
          isLoggedIn={isLoggedIn}
          currentUserEmail={currentUserEmail}
        />
      </div>
    </div>
  )
}
