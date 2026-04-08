# CLAUDE.md — Guia do Projeto Ticket2Go / ProjectFlow

> **Status**: ✅ **REESTRUTURADO** — Design system Linear/Vercel, dark mode, auth backend, PT-BR.
> **Stack**: Next.js 16.2.2 (App Router) + React 19.2.4 + TypeScript + TailwindCSS 3.4.19 + Prisma 7 + Supabase Auth + Base UI v1.3 + Lucide Icons + OpenAI + Resend
> **Design System**: Linear/Vercel — dark zinc palette, 1px borders, ambient gradients, precise typography.
> **Nome interno**: ProjectFlow — ferramenta de inteligência operacional para equipes de tecnologia.

---

## 1. Estrutura do Projeto

```
ticket2go/
├── src/
│   ├── middleware.ts                 # Auth guard por cookie (sb-access-token)
│   ├── app/
│   │   ├── layout.tsx                # Root layout (Geist font)
│   │   ├── globals.css               # Tema premium com variáveis CSS + animações
│   │   ├── page.tsx                  # Landing page profissional (dark theme)
│   │   ├── login/page.tsx            # Login premium (gradiente, glassmorphism)
│   │   └── dashboard/
│   │       ├── layout.tsx            # ✅ Sidebar + main, busca dados do usuário
│   │       ├── loading.tsx           # Suspense loading global
│   │       ├── page.tsx              # Dashboard com stats cards + gráficos
│   │       ├── projects/
│   │       │   ├── page.tsx          # Lista premium PT-BR
│   │       │   ├── create-project-dialog.tsx  # Dialog PT-BR
│   │       │   └── [id]/page.tsx     # Detalhe com tabs premium
│   │       ├── tasks/
│   │       │   ├── page.tsx          # Lista premium PT-BR
│   │       │   ├── create-task-dialog.tsx     # Dialog PT-BR
│   │       │   └── [id]/page.tsx     # ✅ Detalhe de tarefa (nova)
│   │       ├── time/
│   │       │   ├── page.tsx          # Registros premium PT-BR
│   │       │   └── create-time-entry-dialog.tsx  # Dialog PT-BR
│   │       ├── team/
│   │       │   ├── page.tsx          # Equipe premium PT-BR
│   │       │   └── invite-user-dialog.tsx      # ✅ Conectado à API
│   │       └── reports/
│   │           └── page.tsx          # Relatórios com barras de progresso PT-BR
│   │       └── api/
│   │           ├── auth/             # ✅ NOVO: login, logout, me
│   │           ├── projects/
│   │           ├── tasks/
│   │           ├── time-entries/
│   │           ├── organizations/[id]/
│   │           └── invitations/      # ✅ NOVO: GET, POST
│   ├── components/
│   │   ├── layout/sidebar.tsx        # ✅ Premium, Lucide, usuário dinâmico
│   │   ├── auth/auth-guard.tsx       # ✅ NOVO: client-side auth guard
│   │   └── ui/                       # shadcn/ui components
│   ├── services/                     # Lógica de negócio (auth, org, project, task, time)
│   ├── types/                        # Zod schemas + tipos
│   └── lib/
│       ├── utils.ts                  # cn() helper
│       ├── supabase-server.ts        # createClientServer (único)
│       └── prisma.ts                 # PrismaClient singleton (único)
├── .env                              # Supabase + DATABASE_URL
├── prisma/schema.prisma
└── components.json
```

---

## 2. Correções Realizadas ✅

### Auth & Backend
- ✅ **Supabase movido para backend** — API routes `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- ✅ **LoginPage** agora faz `fetch('/api/auth/login')` ao invés de Supabase client
- ✅ **Sidebar logout** agora faz `fetch('/api/auth/logout')` ao invés de Supabase client
- ✅ **AuthGuard client-side** criado em `src/components/auth/auth-guard.tsx`
- ✅ **Middleware** mantém proteção por cookie `sb-access-token`

### Layout & Navegação
- ✅ **Sidebar renderizada** no DashboardLayout
- ✅ **Sidebar premium** — ícones Lucide (Zap, LayoutDashboard, FolderKanban, etc.), usuário dinâmico (nome + email + avatar com iniciais)
- ✅ **DashboardLayout** busca dados do usuário via Prisma e passa para Sidebar
- ✅ **Links corrigidos** — projetos e tarefas apontam para rotas corretas
- ✅ **Página de detalhe de tarefa** criada (`tasks/[id]/page.tsx`)

### Arquivos Duplicados
- ✅ **Removidos** `/lib/supabase.ts` e `/lib/prisma.ts` duplicados da raiz

### APIs
- ✅ **API de convites** — `api/invitations/route.ts` (GET + POST) com permissão por role
- ✅ **InviteUserDialog** conectado à API com feedback de sucesso/erro

### Visual Premium
- ✅ **globals.css** — tema completo com variáveis CSS (brand, surface, sidebar, shadows, radius, animações)
- ✅ **Landing page** — dark theme, gradientes, glassmorphism, social proof, features grid, stats section
- ✅ **LoginPage** — fundo gradiente escuro, card glassmorphism, ícones nos inputs, animação de loading
- ✅ **Dashboard** — stat cards com ícones, barras de progresso, animações de entrada escalonadas
- ✅ **Projetos** — cards com barra de status colorida, stats com ícones Lucide, empty states
- ✅ **Tarefas** — badges refinados para status/prioridade/SLA, layout de lista
- ✅ **Tempo** — stats cards, lista com detalhes formatados, datas em PT-BR
- ✅ **Equipe** — cards com avatar gradiente, barra colorida por role, stats com ícones
- ✅ **Relatórios** — barras de progresso, taxa de conclusão, seções organizadas
- ✅ **Detalhe de projeto** — tabs premium, progress bar, empty states com ícones
- ✅ **Todos os dialogs** — PT-BR, children prop para trigger customizado, feedback de erro

### Internacionalização
- ✅ **100% PT-BR** — todas as páginas, dialogs, labels, mensagens de erro e empty states

---

## 3b. Revisão Visual Premium (2026-04) ✅

| Componente | Mudança | Status |
|---|---|---|
| **Landing page** | Hero com vídeo (`/video/task-hero.mp4`) + múltiplas máscaras de gradiente | ✅ |
| **Landing page** | Seção dedicada "Custo & Prazo" (2 colunas) | ✅ |
| **Landing page** | Seção dedicada "IA Insights" com mock de card + CTA violet | ✅ |
| **Landing page** | CTAs mais proeminentes com sombra/glow | ✅ |
| **Landing page** | Footer com disclaimer LGPD (Lei nº 13.709/2018) | ✅ |
| **Login page** | Layout split (painel esquerdo branding + painel direito form) | ✅ |
| **Login page** | Focus ring violet, botão com ArrowRight, card mais espaçoso | ✅ |
| **Sidebar** | Border-right explícita, avatar com gradiente violet/blue | ✅ |
| **Sidebar** | Active state melhorado com `shadow-[inset...]`, `startsWith` para sub-rotas | ✅ |
| **Select** | `w-fit` → `w-full min-w-[120px]` — tamanho fixo | ✅ |
| **Select** | Trigger com `bg-zinc-900/60 border-zinc-700/60` (sem CSS vars ambíguas) | ✅ |
| **Select** | Content com `bg-zinc-900 border-zinc-800/80` explícito | ✅ |
| **Select** | Items com hover `bg-zinc-800/70` em vez de `bg-accent` | ✅ |

### Convenções adicionais (pós-revisão)
- **Hero com vídeo**: `<video autoPlay muted loop playsInline>` com `opacity: 0.13` + camadas de gradiente
- **Máscaras de vídeo**: `bg-[#09090b]/55` + `gradient-to-b from-[#09090b] via-transparent to-[#09090b]` + lateral
- **Select width**: Sempre usar `w-full` no `SelectTrigger` — nunca `w-fit`
- **Login split**: Painel esquerdo `lg:w-[44%]`, painel direito `flex-1`, responsivo em mobile
- **LGPD**: Incluir disclaimer no footer de qualquer página pública

---

## 3c. Agente de Suporte com IA (2026-04) ✅

### Modelos adicionados ao schema
- `SupportAgent` — nome, personalidade, voiceTone, conductPrompt, projectId, shareToken, showOnPublicKB
- `SupportSession` — sessão por visitante (token no localStorage)
- `SupportMessage` — histórico com role, content, fileUrl, fileType, fileName

### Arquivos criados
| Arquivo | Finalidade |
|---|---|
| `src/lib/email.ts` | Templates Resend: `sendTaskCreatedEmail`, `sendTaskAssignedEmail`, `sendTaskCompletedEmail` |
| `src/app/api/support-agents/route.ts` | GET/POST agentes (dashboard) |
| `src/app/api/support-agents/[id]/route.ts` | GET/PUT/DELETE agente (dashboard) |
| `src/app/api/public/agent/[token]/info/route.ts` | Info pública do agente |
| `src/app/api/public/agent/[token]/session/route.ts` | Criar sessão |
| `src/app/api/public/agent/[token]/chat/route.ts` | Chat + OpenAI function calling |
| `src/app/api/public/agent/[token]/upload/route.ts` | Upload multimodal público |
| `src/app/dashboard/support-agents/page.tsx` | Listagem de agentes |
| `src/app/dashboard/support-agents/[id]/page.tsx` | Config (server) |
| `src/app/dashboard/support-agents/[id]/agent-form.tsx` | Config (client, 3 abas) |
| `src/app/public/agent/[token]/page.tsx` | Chat público (server) |
| `src/app/public/agent/[token]/agent-chat.tsx` | Chat UI (client) |
| `public/agent-widget.js` | Script embed para sites externos |

### OpenAI Tools disponíveis no agente
- `create_task` — cria tarefa no projeto vinculado
- `get_task_status` — status de tarefa por ID
- `get_project_status` — métricas do projeto
- `search_knowledge_base` — artigos ranqueados por GPT-4o-mini

### Suporte multimodal
- **Imagem** → passa URL para GPT-4o vision
- **Áudio** → transcreve com Whisper, inclui texto transcrito
- **PDF** → inclui nota no contexto com o nome do arquivo

### Emails automáticos (Resend)
- **Criação via form público** → `sendTaskCreatedEmail` ao solicitante
- **Criação via agente** → `sendTaskCreatedEmail` ao solicitante
- **Atribuição** → `sendTaskAssignedEmail` ao novo responsável (em `updateTask`)
- **Conclusão** → `sendTaskCompletedEmail` ao solicitante (em `updateTask`)
- Todos fire-and-forget (não bloqueiam a resposta)

### Convenções
- `shareToken` é o identificador público (nunca expor o `id` interno)
- Sessão do visitante fica em `localStorage` com key `agent_session_${shareToken}`
- Widget JS é autossuficiente — lê `data-agent` e `data-origin` do script tag
- Emails usam HTML inline (sem lib adicional) com paleta zinc/dark

---

## 3. Plano de Ação — Resolvido

| Prioridade | Tarefa | Status |
|---|---|---|
| **P0** | Renderizar Sidebar no DashboardLayout | ✅ |
| **P0** | Mover auth Supabase para backend (API routes) | ✅ |
| **P0** | Criar AuthGuard client-side | ✅ |
| **P1** | Remover arquivos duplicados | ✅ |
| **P1** | Corrigir links de projetos e tarefas | ✅ |
| **P1** | Implementar InviteUserDialog com API | ✅ |
| **P2** | Padronizar estilos e idioma (PT-BR) | ✅ |
| **P2** | Dados reais do usuário na Sidebar | ✅ |
| **P2** | Tratar erros ao invés de demo-org silencioso | ✅ (com fallback) |
| **P3** | Criar API routes faltantes (invitations) | ✅ |
| **P3** | Adicionar loading.tsx com Suspense | ✅ |
| **PREMIUM** | Redesign completo do layout | ✅ |
| **PREMIUM** | Redesign da Sidebar | ✅ |
| **PREMIUM** | Redesign da LoginPage | ✅ |
| **PREMIUM** | Redesign do Dashboard | ✅ |
| **PREMIUM** | Redesign de todas as páginas | ✅ |
| **PREMIUM** | Landing page profissional | ✅ |

---

## 4. Convenções do Projeto

- **App Router** (Next.js 14+), Route Handlers para APIs
- **Server Components por padrão** — `'use client'` apenas quando necessário
- **shadcn/ui** para componentes de UI (style: `base-nova`)
- **Zod** para validação de schemas e inputs
- **Prisma** para ORM, PostgreSQL via Supabase
- **Supabase Auth** via cookies (SSR) — **nunca** via client SDK no frontend
- **Lucide React** para todos os ícones
- **TypeScript strict mode**
- **Path alias**: `@/*` → `./src/*`
- **Idioma da UI**: **Português (PT-BR)**

---

## 5. Regras para Modificações

1. **Nunca** chamar Supabase diretamente em client components — sempre via API route
2. Server Components devem usar `createClientServer()` ou services que usam Prisma
3. Client components que precisam de auth devem usar `<AuthGuard>`
4. Seguir padrão de serviços em `src/services/` para lógica de negócio
5. Zod schemas em `src/types/` para validação de inputs de API routes
6. Padrão de nomenclatura: `kebab-case` para arquivos, `PascalCase` para componentes
7. Idioma da UI: **Português (PT-BR)**
8. Usar ícones **Lucide** — nunca emojis ou SVG inline
9. Usar paleta **zinc** para dark mode (`bg-zinc-950/50`, `border-zinc-800/60`, `text-zinc-500`)
10. Botões primários: `bg-white text-black` (estilo Linear/Vercel)
11. Botões secundários: `text-zinc-500 hover:text-zinc-300`
12. Cards: `bg-zinc-950/50 border border-zinc-800/60 rounded-lg`
13. Tipografia: `text-base font-semibold` para títulos, `text-sm text-zinc-500` para subtítulos
14. Números: usar `tabular-nums` para alinhamento
15. Animações: `animate-fade-in` com `cubic-bezier(0.16, 1, 0.3, 1)`, delays de 50-60ms
16. Empty states: ícone zinc-700 + texto zinc-500/zinc-700
17. Background grid: `bg-grid opacity-30` para páginas públicas
18. Espaçamento: `p-6` para páginas, `gap-3` para grids, `mb-6` para headers
