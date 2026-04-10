import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ProjectFlow — Inteligência Operacional para Equipes de Tecnologia',
  description:
    'Controle custo, prazo e produtividade em tempo real. Kanban, SLA, time tracking, insights de IA e agente de suporte integrados numa só plataforma para equipes de TI.',
  openGraph: {
    title: 'ProjectFlow — Inteligência Operacional para Equipes de Tecnologia',
    description:
      'Controle custo, prazo e produtividade em tempo real. Kanban, SLA, time tracking, IA e agente de suporte.',
    url: '/',
  },
  alternates: {
    canonical: '/',
  },
}
import {
  Zap,
  ArrowRight,
  Check,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  BarChart3,
  Users,
  FileText,
  Brain,
  Download,
  MessageSquare,
  Calendar,
  Globe,
  Sparkles,
  DollarSign,
  Timer,
  Target,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Bot,
  Mail,
  TicketCheck,
  BookOpen,
} from 'lucide-react'
import Reveal from '@/components/ui/reveal'

// ─── Feature card ────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  desc,
  badge,
  accent = 'zinc',
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  badge?: string
  accent?: 'zinc' | 'violet' | 'blue' | 'emerald' | 'amber'
}) {
  const iconStyles = {
    zinc: 'text-zinc-400 bg-zinc-900 border-zinc-800 group-hover:border-zinc-700',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20 group-hover:border-violet-500/40',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40',
  }
  return (
    <div className="group border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700/60 hover:bg-zinc-900/30 transition-all duration-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-zinc-800/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-start justify-between mb-3 relative">
        <div className={`w-9 h-9 border rounded-lg flex items-center justify-center transition-all duration-200 ${iconStyles[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-zinc-200 mb-1.5 relative">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed relative">{desc}</p>
    </div>
  )
}

// ─── Gradient divider ─────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
  )
}

// ─── Section eyebrow ──────────────────────────────────────────────────────────

function Eyebrow({ icon: Icon, label, color = 'zinc' }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color?: 'zinc' | 'violet' | 'blue' | 'emerald' | 'amber'
}) {
  const styles = {
    zinc:    'border-zinc-800 bg-zinc-900/40 text-zinc-400',
    violet:  'border-violet-500/25 bg-violet-500/10 text-violet-300',
    blue:    'border-blue-500/20 bg-blue-500/8 text-blue-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    amber:   'border-amber-500/20 bg-amber-500/10 text-amber-400',
  }
  const iconColor = {
    zinc: 'text-zinc-400', violet: 'text-violet-400', blue: 'text-blue-400',
    emerald: 'text-emerald-400', amber: 'text-amber-400',
  }
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs mb-5 ${styles[color]}`}>
      <Icon className={`w-3 h-3 ${iconColor[color]}`} />
      {label}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
      {/* Ambient gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-[#09090b] to-blue-950/15 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[700px] h-[500px] bg-blue-950/20 rounded-full blur-[160px] pointer-events-none" />

      {/* ─── HEADER ─── */}
      <header className="relative z-50 border-b border-zinc-800/40 backdrop-blur-sm bg-[#09090b]/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-sm font-semibold tracking-tight">ProjectFlow</span>
          </div>
          <nav className="flex items-center gap-5">
            <a href="#recursos" className="hidden sm:block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Recursos</a>
            <a href="#ia" className="hidden md:block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">IA</a>
            <a href="#agente" className="hidden md:block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Agente</a>
            <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Entrar</Link>
            <Link
              href="/login"
              className="text-xs font-medium bg-white text-black px-3.5 py-1.5 rounded-md hover:bg-zinc-200 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
            >
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#09090b]">
        {/* Video background */}
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.13 }}>
          <source src="/video/task-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#09090b]/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-transparent to-[#09090b]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/60 via-transparent to-[#09090b]/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-violet-600/6 rounded-full blur-[140px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-12">
          <Reveal delay={0}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-sm text-xs text-zinc-400 mb-8 shadow-lg">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span>Inteligência operacional para equipes de tecnologia</span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-semibold tracking-tight leading-[1.06] mb-6">
              <span className="text-zinc-100">Custo, prazo e</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                produtividade reais
              </span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Descubra onde sua equipe perde tempo e dinheiro. Controle orçamentos,
              monitore SLAs e use{' '}
              <span className="text-zinc-200 font-medium">IA para antecipar riscos</span>{' '}
              antes que virem problemas.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="flex items-center justify-center gap-3 flex-wrap mb-16">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-6 py-3 rounded-lg hover:bg-zinc-100 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_4px_24px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_6px_32px_rgba(255,255,255,0.1)]"
              >
                Começar gratuitamente
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#recursos"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800 hover:border-zinc-700 px-6 py-3 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/60 backdrop-blur-sm"
              >
                Ver recursos
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto pt-8 border-t border-zinc-800/40">
              {[
                { value: '100%', label: 'Controle de custos' },
                { value: '30+', label: 'API endpoints' },
                { value: 'IA', label: 'Insights automáticos' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-zinc-100 tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── DASHBOARD PREVIEW ─── */}
      <section className="relative z-10 px-6 pb-24 bg-[#09090b]">
        <Reveal>
          <div className="max-w-5xl mx-auto">
            <div className="dark:bg-zinc-950 bg-white/60 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/40 dark:bg-zinc-900/30 bg-zinc-200/50">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                <span className="text-[11px] text-zinc-600 ml-2">app.projectflow.dev/dashboard</span>
              </div>
              <div className="p-6 md:p-10 bg-gradient-to-br from-zinc-950 to-zinc-900/80">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Projetos Ativos', value: '12', icon: FolderKanban, color: 'text-violet-400', bg: 'bg-violet-500/8' },
                    { label: 'Horas este mês', value: '847h', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/8' },
                    { label: 'Custo acumulado', value: 'R$ 52k', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
                    { label: 'Taxa de conclusão', value: '78%', icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/8' },
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} border border-zinc-800/60 rounded-xl p-4`}>
                      <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
                      <p className="text-lg font-bold text-zinc-100 tabular-nums">{stat.value}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 mb-3 font-medium">Kanban — Projeto: Redesign do App</p>
                  <div className="flex gap-3">
                    {[
                      { stage: 'Backlog', color: 'bg-zinc-600', count: 3 },
                      { stage: 'Em Progresso', color: 'bg-blue-500', count: 2 },
                      { stage: 'Em Revisão', color: 'bg-amber-500', count: 2 },
                      { stage: 'Concluído', color: 'bg-emerald-500', count: 4 },
                    ].map(({ stage, color, count }) => (
                      <div key={stage} className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className={`w-2 h-2 rounded-full ${color}`} />
                          <span className="text-[10px] text-zinc-500 font-medium">{stage}</span>
                        </div>
                        <div className="space-y-1.5">
                          {Array.from({ length: count }).map((_, j) => (
                            <div key={j} className="bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-2.5">
                              <div className="h-2 bg-zinc-700/70 rounded w-3/4 mb-1.5" />
                              <div className="h-1.5 bg-zinc-700/30 rounded w-1/2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Divider />

      {/* ─── CUSTO & PRAZO ─── (alternate bg) */}
      <section className="relative z-10 py-32 px-6 bg-[#0c0b10]">
        {/* Subtle glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/15 via-transparent to-blue-950/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <Reveal className="text-center mb-16">
            <Eyebrow icon={Target} label="Controle financeiro e de prazo" color="emerald" />
            <h2 className="text-4xl font-semibold tracking-tight mb-4">
              Nunca mais perca o controle de{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                custo e prazo
              </span>
            </h2>
            <p className="text-base text-zinc-500 max-w-lg mx-auto">
              Visibilidade completa do orçamento consumido, SLAs e datas de entrega — tudo em tempo real.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            <Reveal delay={0}>
              <div className="border border-zinc-800/60 rounded-2xl p-8 dark:bg-zinc-950 bg-white/40 hover:border-zinc-700/60 transition-colors group h-full">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:border-emerald-500/40 transition-colors">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100 mb-3">Controle financeiro em tempo real</h3>
                <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                  Orçamento vs. realizado por projeto com barra visual de consumo e alertas automáticos.
                </p>
                <ul className="space-y-3">
                  {[
                    'Custo por tarefa calculado automaticamente pelo valor/hora',
                    'Barra visual de orçamento consumido com indicadores',
                    'Alerta quando budget atingir limiares críticos',
                    'Relatório financeiro por projeto, usuário e período',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-zinc-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="border border-zinc-800/60 rounded-2xl p-8 dark:bg-zinc-950 bg-white/40 hover:border-zinc-700/60 transition-colors group h-full">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:border-blue-500/40 transition-colors">
                  <Timer className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100 mb-3">Prazos e SLAs monitorados</h3>
                <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                  Due dates automáticos baseados no tipo de tarefa, com painel de violações e histórico.
                </p>
                <ul className="space-y-3">
                  {[
                    'SLA automático configurável por tipo de tarefa',
                    'Painel dedicado de tarefas atrasadas',
                    'Histórico completo de mudanças por tarefa',
                    'Alertas visuais de violação antes do vencimento',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-zinc-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="mt-6 border border-zinc-800/60 rounded-xl p-5 dark:bg-zinc-950 bg-white/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <p className="text-sm text-zinc-300 font-medium">Reduza custos operacionais em até 30% com visibilidade real-time</p>
              </div>
              <Link href="/login" className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap flex items-center gap-1">
                Ver demonstração <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Divider />

      {/* ─── IA INSIGHTS ─── */}
      <section id="ia" className="relative z-10 py-32 px-6 bg-[#09090b]">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/12 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <div>
              <Reveal>
                <Eyebrow icon={Brain} label="Inteligência Artificial" color="violet" />
                <h2 className="text-4xl font-semibold tracking-tight mb-5">
                  IA que entende seus{' '}
                  <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                    projetos
                  </span>
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed mb-8">
                  Análise automática via OpenAI integrada na visão de projeto. Detecta riscos,
                  identifica gargalos e gera relatórios narrativos sem esforço manual.
                </p>
              </Reveal>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: AlertTriangle, text: 'Identifica tarefas críticas antes que virem problemas', color: 'text-amber-400', delay: 60 },
                  { icon: Users, text: 'Sugere redistribuição de carga entre membros da equipe', color: 'text-blue-400', delay: 120 },
                  { icon: Activity, text: 'Detecta padrões de atraso e alerta proativamente', color: 'text-violet-400', delay: 180 },
                  { icon: FileText, text: 'Gera relatórios narrativos de saúde do projeto', color: 'text-emerald-400', delay: 240 },
                ].map(({ icon: Icon, text, color, delay }, i) => (
                  <Reveal key={i} delay={delay}>
                    <li className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                      </div>
                      <span className="text-sm text-zinc-400 leading-snug">{text}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
              <Reveal delay={300}>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-[0_0_24px_rgba(139,92,246,0.25)] hover:shadow-[0_0_32px_rgba(139,92,246,0.4)]"
                >
                  Ativar IA no meu projeto
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Reveal>
            </div>

            {/* Right */}
            <Reveal delay={100} y={32}>
              <div className="dark:bg-zinc-950 bg-white/60 border border-violet-500/15 rounded-2xl p-6 shadow-[0_0_80px_rgba(139,92,246,0.08)]">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-zinc-800/60">
                  <div className="w-7 h-7 bg-violet-500/15 border border-violet-500/25 rounded-lg flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">Análise de IA</p>
                    <p className="text-[10px] text-zinc-600">Gerado agora por OpenAI</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Saúde do Projeto', value: 'Crítico', color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: 'Risco de Prazo', value: 'Alto', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Utilização da Equipe', value: '94%', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  ].map(({ label, value, color, bg }, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800/30 last:border-0">
                      <span className="text-xs text-zinc-500">{label}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${color} ${bg}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-zinc-900/60 rounded-xl p-4">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    <span className="text-violet-400 font-semibold">Recomendação: </span>
                    3 tarefas da sprint atual estão sem responsável e próximas do vencimento.
                    Sugiro redistribuir para Ana (20h livres) e Pedro (8h livres) para manter o SLA.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── AGENTE DE SUPORTE ─── (alternate bg) */}
      <section id="agente" className="relative z-10 py-32 px-6 bg-[#0c0b10]">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-transparent to-blue-950/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <div>
              <Reveal>
                <Eyebrow icon={Bot} label="Agente de Suporte com IA" color="violet" />
                <h2 className="text-4xl font-semibold tracking-tight mb-5">
                  Atendimento inteligente,<br />
                  <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                    disponível 24/7
                  </span>
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                  Configure um agente com IA que atende seus clientes, responde dúvidas com a base de conhecimento
                  e cria tarefas automaticamente — tudo sem intervenção humana.
                </p>
              </Reveal>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: BookOpen, text: 'Sugere artigos da KB antes de abrir chamados', color: 'text-violet-400', delay: 60 },
                  { icon: TicketCheck, text: 'Cria, consulta e acompanha tarefas por conversa natural', color: 'text-blue-400', delay: 120 },
                  { icon: Mail, text: 'Dispara emails automáticos na criação, atribuição e conclusão', color: 'text-emerald-400', delay: 180 },
                  { icon: Brain, text: 'Entende texto, imagem, áudio e PDF na mesma conversa', color: 'text-amber-400', delay: 240 },
                ].map((item, i) => (
                  <Reveal key={i} delay={item.delay}>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className={`w-3 h-3 ${item.color}`} />
                      </div>
                      <span className="text-sm text-zinc-400">{item.text}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
              <Reveal delay={300}>
                <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
                  <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800">Link de compartilhamento</span>
                  <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800">Widget embed para seu site</span>
                  <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800">Histórico de sessões</span>
                </div>
              </Reveal>
            </div>

            {/* Right: chat mockup */}
            <Reveal delay={80} y={32}>
              <div className="relative">
                <div className="dark:bg-zinc-950 bg-white/70 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/40 bg-zinc-900/40">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600/40 to-blue-600/40 border border-violet-500/20 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-violet-300" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Ana — Suporte TI</p>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-zinc-500">Online agora</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-900/40 border border-violet-700/30 flex-shrink-0 flex items-center justify-center">
                        <Bot className="w-3 h-3 text-violet-300" />
                      </div>
                      <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-2xl rounded-tl-md px-3 py-2 text-xs text-zinc-300 max-w-[75%] leading-relaxed">
                        Olá! Como posso te ajudar hoje?
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-violet-600/20 border border-violet-500/25 rounded-2xl rounded-tr-md px-3 py-2 text-xs text-zinc-200 max-w-[75%] leading-relaxed">
                        O sistema não deixa eu fazer login
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-900/40 border border-violet-700/30 flex-shrink-0 flex items-center justify-center">
                        <Bot className="w-3 h-3 text-violet-300" />
                      </div>
                      <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-2xl rounded-tl-md px-3 py-2 text-xs text-zinc-300 max-w-[80%] leading-relaxed">
                        Encontrei um artigo sobre isso!
                        <div className="mt-2 bg-violet-950/30 border border-violet-500/15 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                          <BookOpen className="w-3 h-3 text-violet-400 flex-shrink-0" />
                          <span className="text-[10px] text-violet-300">Como redefinir sua senha</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 block mt-1">Resolver pela KB é bem mais rápido!</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 mx-auto w-fit">
                      <TicketCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Chamado #4F2A9C criado</span>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2">
                      <span className="text-xs text-zinc-600 flex-1">Digite sua mensagem...</span>
                      <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-300">Email enviado</p>
                    <p className="text-[9px] text-zinc-600">Confirmação ao solicitante</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── RECURSOS ─── */}
      <section id="recursos" className="relative z-10 py-32 px-6 bg-[#09090b]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <h2 className="text-4xl font-semibold tracking-tight mb-3">Tudo que você precisa</h2>
            <p className="text-base text-zinc-500">Gestão operacional completa para equipes de tecnologia</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: LayoutDashboard, title: 'Dashboard', accent: 'zinc', desc: 'Métricas em tempo real de horas, custos e produtividade da equipe' },
              { icon: FolderKanban, title: 'Kanban por Projeto', accent: 'violet', desc: 'Templates Agile, Waterfall ou Simples com drag-and-drop nativo' },
              { icon: CheckSquare, title: 'Tarefas Completas', accent: 'blue', badge: 'Novo', desc: 'Prioridade, tipo, responsável, anexos, comentários e histórico completo' },
              { icon: Calendar, title: 'Due Date + SLA', accent: 'amber', desc: 'Vencimento automático por tipo de tarefa com alertas de violação' },
              { icon: Clock, title: 'Time Tracking', accent: 'zinc', desc: 'Registro rápido com atalhos (30m, 1h, 2h, 4h, 6h, 8h) e custo automático' },
              { icon: DollarSign, title: 'Custo por Projeto', accent: 'emerald', desc: 'Orçamento vs realizado com barra visual e alertas de consumo' },
              { icon: MessageSquare, title: 'Comentários', accent: 'zinc', desc: 'Discussões contextuais no nível do projeto e de cada tarefa' },
              { icon: FileText, title: 'Documentos', accent: 'zinc', desc: 'Upload para Supabase Storage com tipos (Escopo, Contrato, Anexo)' },
              { icon: Users, title: 'Equipe & Perfis', accent: 'blue', desc: '4 níveis de acesso: Owner, Admin, Membro e Visualizador' },
              { icon: Brain, title: 'Insights de IA', accent: 'violet', badge: 'IA', desc: 'Análise automática de projetos via OpenAI com recomendações acionáveis' },
              { icon: Bot, title: 'Agente de Suporte', accent: 'violet', badge: 'Novo', desc: 'Chatbot com IA, base de conhecimento integrada e criação automática de tarefas' },
              { icon: Mail, title: 'Emails Automáticos', accent: 'emerald', badge: 'Novo', desc: 'Notificações via Resend na criação, atribuição e conclusão de tarefas' },
              { icon: Globe, title: 'Formulário Público', accent: 'zinc', desc: 'Link compartilhável para clientes criarem tarefas sem autenticação' },
              { icon: Download, title: 'Importar/Exportar CSV', accent: 'zinc', desc: 'Operações em lote para gerenciamento e migração de tarefas' },
            ].map((card, i) => (
              <Reveal key={i} delay={Math.min(i * 40, 300)}>
                <FeatureCard
                  icon={card.icon}
                  title={card.title}
                  accent={card.accent as any}
                  badge={card.badge}
                  desc={card.desc}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── RELATÓRIOS ─── (alternate bg) */}
      <section id="relatorios" className="relative z-10 py-32 px-6 bg-[#0c0b10]">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/8 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <Reveal className="text-center mb-14">
            <Eyebrow icon={BarChart3} label="Analytics" color="blue" />
            <h2 className="text-4xl font-semibold tracking-tight mb-3">Relatórios Inteligentes</h2>
            <p className="text-base text-zinc-500">5 tipos de relatório para decisões baseadas em dados</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BarChart3, title: 'Posição Resumida', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20',
                desc: 'Visão geral de projetos, tarefas, horas e custos consolidados' },
              { icon: Timer, title: 'Consumo de Horas', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
                desc: 'Filtro por período, projeto e usuário com breakdown detalhado' },
              { icon: Users, title: 'Alocação de Usuários', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
                desc: 'Horas por membro da equipe com tarefas em andamento' },
              { icon: Calendar, title: 'Tarefas Atrasadas', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20',
                desc: 'Todas as tasks com vencimento ultrapassado e status aberto' },
              { icon: FolderKanban, title: 'Situação de Projetos', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
                desc: 'Saúde: progresso %, budget vs actual, tasks atrasadas por projeto' },
            ].map((report, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className={`group border ${report.border} rounded-xl p-6 hover:bg-zinc-900/20 transition-all h-full`}>
                  <div className={`w-11 h-11 ${report.bg} border ${report.border} rounded-xl flex items-center justify-center mb-5`}>
                    <report.icon className={`w-5 h-5 ${report.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-2">{report.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{report.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── BENEFÍCIOS ─── */}
      <section className="relative z-10 py-32 px-6 bg-[#09090b]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight mb-8">Por que ProjectFlow?</h2>
            </Reveal>
            <ul className="space-y-3">
              {[
                'Custo por tarefa calculado em tempo real',
                'SLA tracking com alertas de violação automáticos',
                'Histórico completo de mudanças por tarefa',
                'Orçamento vs realizado com barra visual',
                'Insights de IA integrados em cada projeto',
                'Gestão de capacidade da equipe',
                'Multi-organizações com isolamento total',
                'APIs REST robustas para integrações externas',
                'Formulário público para clientes criarem tarefas',
                'Base de conhecimento interna e pública',
                'Agente de suporte com IA disponível 24/7',
                'Emails automáticos de criação, atribuição e conclusão',
              ].map((item, i) => (
                <Reveal key={i} delay={i * 30}>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-zinc-400">{item}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <Reveal delay={60}>
              <div className="dark:bg-zinc-950/50 bg-white border border-zinc-800/60 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Para quem é?</h3>
                </div>
                <ul className="space-y-2.5">
                  {[
                    'Agências e consultorias de TI',
                    'Equipes de produto e engenharia',
                    'Gestores de operações e projetos',
                    'Empresas que controlam custos por hora',
                    'Freelancers com múltiplos clientes',
                    'Startups com sprints e SLAs',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                      <span className="text-sm text-zinc-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="dark:bg-zinc-950/50 bg-white border border-zinc-800/60 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Stack Tecnológico</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Next.js 16', 'TypeScript', 'Prisma 7', 'PostgreSQL', 'Supabase', 'React 19', 'Tailwind', 'OpenAI', 'Resend', 'Zod'].map(tech => (
                    <span key={tech} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 border border-zinc-700/30">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Divider />

      {/* ─── CTA FINAL ─── */}
      <section className="relative z-10 py-40 px-6 bg-[#0c0b10] overflow-hidden">
        {/* Large violet glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-lg mx-auto text-center relative z-10">
          <Reveal>
            <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
              <Zap className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-4xl font-semibold tracking-tight mb-4">Pronto para transformar?</h2>
            <p className="text-base text-zinc-500 mb-10 leading-relaxed">
              Comece gratuitamente. Sem cartão de crédito.<br />
              Tenha visibilidade total dos seus projetos em minutos.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-8 py-3.5 rounded-lg hover:bg-zinc-100 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_4px_32px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_6px_40px_rgba(255,255,255,0.14)]"
            >
              Criar conta grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-zinc-700 mt-4">Sem compromisso · Cancele quando quiser</p>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 bg-[#09090b]">
        <Divider />
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-zinc-800 rounded-sm flex items-center justify-center">
                <Zap className="w-3 h-3 text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-zinc-400">ProjectFlow</span>
              <span className="text-[10px] text-zinc-700">v0.1.0</span>
            </div>
            <p className="text-xs text-zinc-600 max-w-[200px] leading-relaxed">
              Inteligência operacional para equipes de tecnologia.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Produto</p>
              <a href="#recursos" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Recursos</a>
              <a href="#relatorios" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Relatórios</a>
              <a href="#ia" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">IA Insights</a>
              <a href="#agente" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Agente de Suporte</a>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Plataforma</p>
              <Link href="/login" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Entrar</Link>
              <Link href="/login" className="block text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Criar conta</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800/30">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-zinc-700">© 2026 ProjectFlow. Todos os direitos reservados.</p>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-zinc-700" />
              <p className="text-[10px] text-zinc-700 text-center md:text-right leading-relaxed max-w-2xl">
                Em conformidade com a <span className="text-zinc-500 font-medium">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</span>.
                Seus dados pessoais são tratados com segurança e utilizados exclusivamente para a prestação dos serviços contratados.
                Ao utilizar esta plataforma, você concorda com nossa política de privacidade.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
