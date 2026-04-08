import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Faça login ou crie sua conta no ProjectFlow. Acesso gratuito durante o closed-beta.',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}