# ProjectFlow

> **Plataforma de Inteligência Operacional** — Gestão completa de projetos, tarefas, SLA, custo e atendimento com IA para equipes de tecnologia.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)](https://openai.com)

---

## Visão Geral

ProjectFlow é uma plataforma full-stack de **gestão operacional e inteligência para equipes de tecnologia**. Controle de custo, prazo, SLA, base de conhecimento e agente de suporte com IA — tudo numa interface escura e premium.

### Funcionalidades Principais

#### Gestão de Projetos
- **Kanban por Projeto** — Pipelines configuráveis (Agile, Waterfall, Simples) com drag-and-drop
- **Tarefas Completas** — Prioridade, tipo, responsável, anexos, comentários e histórico
- **Formulário Público** — Link compartilhável para clientes criarem tarefas sem login
- **Importar/Exportar CSV** — Operações em lote

#### Custo & Tempo
- **Time Tracking** — Atalhos rápidos (30m, 1h, 2h, 4h, 6h, 8h) + custo automático
- **Orçamento vs Realizado** — Barra visual de consumo em tempo real
- **Custo por Tarefa/Usuário** — Baseado na hora configurada por membro

#### IA & Automação
- **Insights de IA** — Análise automática de projetos via GPT-4o
- **Agente de Suporte** — Chatbot com IA que atende clientes, consulta KB, cria tarefas, entende texto/imagem/áudio/PDF
- **Busca Inteligente na KB** — Sugestões de artigos em tempo real conforme o usuário digita no form público

#### Emails Automáticos (Resend)
- **Criação de tarefa** — Email ao solicitante com ID e detalhes
- **Atribuição** — Email ao responsável com context da tarefa
- **Conclusão** — Email ao solicitante confirmando a entrega

#### Colaboração
- **Base de Conhecimento** — Interna + pública com categorias, busca e integração com o agente
- **Comentários** — Discussões no nível de projeto e tarefa
- **Documentos** — Upload via Supabase Storage (Escopo, Contrato, Anexo, etc.)
- **Equipe & Papéis** — Owner, Admin, Membro, Visualizador

#### Relatórios
- Dashboard de métricas em tempo real
- Consumo de horas por período
- Alocação de usuários
- Tarefas vencidas
- Saúde do projeto

---

## Arquitetura

```
ticket2go/src/
├── app/
│   ├── api/
│   │   ├── auth/                        # Login, logout, me
│   │   ├── projects/[id]/               # CRUD + insights IA + kanban
│   │   ├── tasks/[id]/                  # CRUD + comentários + histórico
│   │   ├── support-agents/[id]/         # CRUD agentes de suporte
│   │   ├── public/
│   │   │   ├── projects/[id]/tasks/     # Criação pública de tasks
│   │   │   ├── projects/[id]/knowledge-search/ # Busca KB com IA
│   │   │   ├── knowledge/               # KB pública
│   │   │   └── agent/[token]/           # Chat público do agente
│   │   │       ├── info/                # Info do agente
│   │   │       ├── session/             # Criar sessão
│   │   │       ├── chat/                # Mensagem + tools OpenAI
│   │   │       └── upload/              # Upload multimodal
│   │   └── storage/upload/              # Upload autenticado
│   ├── dashboard/
│   │   ├── projects/[id]/               # Kanban, membros, documentos
│   │   ├── tasks/[id]/                  # Detalhe de tarefa
│   │   ├── support-agents/[id]/         # Config do agente (tabs)
│   │   ├── knowledge/                   # KB interna
│   │   └── reports/                     # 5 tipos de relatório
│   └── public/
│       ├── projects/[id]/new-task/      # Form público com sugestões KB
│       ├── knowledge/[orgSlug]/         # KB pública + widget agente
│       └── agent/[token]/               # Chat standalone do agente
├── components/
│   ├── layout/sidebar.tsx               # Sidebar premium com about popup
│   └── project/public-task-form.tsx     # Form com IA KB suggestions
├── services/
│   └── task.ts                          # updateTask dispara emails
├── lib/
│   ├── email.ts                         # Templates Resend (criação/atribuição/conclusão)
│   └── prisma.ts                        # Client singleton
└── public/
    └── agent-widget.js                  # Script embed para sites externos
```

### Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Linguagem** | TypeScript 5 |
| **Banco de Dados** | PostgreSQL (Supabase) |
| **ORM** | Prisma 7 |
| **Auth** | Supabase Auth (SSR via cookies) |
| **Storage** | Supabase Storage |
| **UI** | React 19, Tailwind CSS 3, Base UI |
| **IA** | OpenAI GPT-4o + Whisper + GPT-4o-mini |
| **Email** | Resend |
| **Validação** | Zod 4 |
| **Charts** | Recharts 3 |

---

## Banco de Dados — Modelos

| Modelo | Finalidade |
|---|---|
| `Organization` | Isolamento de tenants |
| `User` | Membros com papéis e custo/hora |
| `Project` | Projetos com orçamento, timeline, status |
| `Task` | Tarefas com SLA, prioridade, solicitante |
| `TaskType` | Tipos customizados com SLA |
| `TaskHistory` | Auditoria completa de mudanças |
| `TaskComment` | Discussões por tarefa |
| `TaskAttachment` | Arquivos por tarefa |
| `Pipeline` / `PipelineStage` | Fluxos configuráveis por projeto |
| `TimeEntry` | Horas registradas com snapshot de custo |
| `ProjectMember` | Membros de projetos |
| `ProjectDocument` | Documentos do projeto |
| `KnowledgeBase` | Artigos da base de conhecimento |
| `KnowledgeCategory` | Categorias (com flag pública) |
| `Sla` | SLA tracking por tarefa |
| `Invitation` | Tokens de convite de equipe |
| `SupportAgent` | Config do agente IA (nome, personalidade, tom, prompt, projeto) |
| `SupportSession` | Sessão de chat por visitante |
| `SupportMessage` | Histórico de mensagens |

---

## Configuração

### Pré-requisitos
- Node.js 20+
- PostgreSQL (ou projeto Supabase)
- Conta Supabase (Auth + Storage)
- API Key OpenAI
- Conta Resend (emails)

### Instalação

```bash
git clone <repo> && cd ticket2go
npm install
cp .env.example .env  # configure as variáveis
npx prisma db push
npx prisma generate
npm run dev
```

### Variáveis de Ambiente

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
OPENAI_API_KEY="sk-..."
RESEND_API_KEY="re_..."
RESEND_FROM="no-reply@seudominio.com"
NEXT_PUBLIC_APP_URL="https://seuapp.com"
NEXT_PUBLIC_APP_VERSION="v0.1.0"
```

---

## Agente de Suporte — Como usar

1. Acesse **Dashboard → Agente de Suporte → Novo Agente**
2. Configure nome, personalidade, tom de voz e prompt de condução
3. Vincule a um projeto para criação automática de tarefas
4. Ative "Mostrar na Base de Conhecimento" para adicionar o botão flutuante na KB pública
5. Copie o **link de compartilhamento** ou o **script embed** para seu site

### Widget Embed

```html
<script
  src="https://seuapp.com/agent-widget.js"
  data-agent="TOKEN_DO_AGENTE"
  data-origin="https://seuapp.com"
  data-label="Suporte"
  data-color="#7c3aed"
  data-position="right">
</script>
```

### Capacidades do Agente

- Responde texto, imagens, áudios (transcreve via Whisper) e PDFs
- Pesquisa na base de conhecimento com ranking por IA
- Cria tarefas no projeto configurado
- Consulta status de tarefas por ID
- Consulta métricas do projeto
- Injeta dados da organização automaticamente

---

## Emails Automáticos

Integrado com Resend. Disparos automáticos em:

| Evento | Destinatário |
|---|---|
| Tarefa criada (form público ou agente) | Solicitante (se informou email) |
| Tarefa atribuída | Responsável designado |
| Tarefa concluída | Solicitante |

---

## Papéis e Permissões

| Funcionalidade | Owner | Admin | Membro | Visualizador |
|---|:---:|:---:|:---:|:---:|
| Configurar Organização | ✅ | ✅ | ❌ | ❌ |
| Agentes de Suporte | ✅ | ✅ | ❌ | ❌ |
| Criar/Editar Projetos | ✅ | ✅ | ❌ | ❌ |
| Criar/Editar Tarefas | ✅ | ✅ | ✅ | ❌ |
| Registrar Horas | ✅ | ✅ | ✅ | ❌ |
| Ver Relatórios | ✅ | ✅ | ✅ | ❌ |
| Base de Conhecimento | ✅ | ✅ | ✅ | ❌ |

---

<p align="center">Feito para equipes que entregam · Closed Beta</p>
