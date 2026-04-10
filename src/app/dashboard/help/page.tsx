'use client'

import { useState } from 'react'
import {
  BookOpen, LayoutDashboard, FolderKanban, CheckSquare, Clock,
  Users, BarChart3, Bot, BookMarked, Settings, ChevronRight,
  ChevronDown, Zap, GanttChartSquare, Share2, FileText,
  MessageSquare, AlertTriangle, Filter, Calendar, User,
  ArrowRight, Info, Star, Lightbulb, Shield,
} from 'lucide-react'

interface Section {
  id: string
  icon: any
  title: string
  subtitle: string
  color: string
  bg: string
  content: {
    intro: string
    steps?: { title: string; desc: string }[]
    tips?: string[]
    scenarios?: { title: string; steps: string[] }[]
    roles?: { role: string; access: string }[]
    warnings?: string[]
  }
}

const sections: Section[] = [
  {
    id: 'start',
    icon: Zap,
    title: 'Por onde começar',
    subtitle: 'Configuração inicial e primeiros passos',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    content: {
      intro: 'O ProjectFlow é uma ferramenta de inteligência operacional para equipes de tecnologia. Siga este fluxo para configurar e começar a usar o sistema do zero.',
      steps: [
        { title: '1. Configure a organização', desc: 'Acesse Configurações → Organização para definir nome, logo, timezone e outros dados da sua empresa.' },
        { title: '2. Convide sua equipe', desc: 'Em Equipe → Convidar Usuário, informe o e-mail e o papel (Admin, Membro ou Viewer). Cada papel tem permissões distintas.' },
        { title: '3. Crie o primeiro projeto', desc: 'Em Projetos → Novo Projeto, escolha o tipo: Escopo Fechado (prazo e orçamento definidos) ou Contínuo (operação recorrente).' },
        { title: '4. Configure o pipeline', desc: 'Ao abrir o projeto, escolha um template de Kanban: Ágil, Waterfall ou Simples. As etapas definem o fluxo das tarefas.' },
        { title: '5. Adicione tarefas', desc: 'Clique em + dentro de qualquer coluna do Kanban. Defina título, descrição, prioridade, responsável e tipo de tarefa.' },
        { title: '6. Registre horas', desc: 'Em Tempo, registre entradas de horas por projeto e tarefa. O sistema calcula custo automaticamente pelo valor/hora do usuário.' },
      ],
      scenarios: [
        {
          title: 'Cenário: Projeto de desenvolvimento de software',
          steps: [
            'Crie o projeto como "Escopo Fechado" com startDate, endDate e orçamento.',
            'Escolha o template "Ágil" (Backlog → A Fazer → Em Progresso → Em Revisão → Concluído).',
            'Importe tarefas via CSV ou crie manualmente no Kanban.',
            'Ative "Formulário Público" para receber demandas externas.',
            'Monitore o Gantt para ver o cronograma e identificar atrasos.',
            'Compartilhe a página pública com o cliente via botão "Compartilhar".',
          ],
        },
        {
          title: 'Cenário: Suporte ao cliente',
          steps: [
            'Crie um projeto como "Contínuo" para registrar chamados.',
            'Configure tipos de tarefa com SLA (ex: "Bug Crítico" = 4h, "Dúvida" = 24h).',
            'Ative o Agente de Suporte com IA e vincule ao projeto.',
            'Compartilhe o widget do agente no seu site ou plataforma.',
            'Monitore tarefas atrasadas no relatório "Tarefas Atrasadas".',
          ],
        },
      ],
      tips: [
        'Comece com um projeto de teste para explorar o sistema sem pressão.',
        'Configure o custo/hora de cada usuário em Equipe para que os relatórios de custo funcionem corretamente.',
        'Use os tipos de tarefa para categorizar e medir SLA por categoria.',
      ],
    },
  },
  {
    id: 'projects',
    icon: FolderKanban,
    title: 'Projetos',
    subtitle: 'Criação, configuração e gestão de projetos',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    content: {
      intro: 'Projetos são o centro do sistema. Cada projeto tem seu próprio pipeline Kanban, documentos, membros, comentários e métricas.',
      steps: [
        { title: 'Tipo: Escopo Fechado', desc: 'Projetos com prazo e orçamento definidos. Exibe barra de progresso, Gantt e página pública compartilhável. Ideal para projetos com cliente.' },
        { title: 'Tipo: Contínuo', desc: 'Operações recorrentes sem data de fim (suporte, manutenção). Foco em fluxo de trabalho e horas consumidas.' },
        { title: 'Pipeline Kanban', desc: 'Cada projeto tem seu próprio pipeline com etapas customizáveis. Arraste tarefas entre colunas para mover no fluxo.' },
        { title: 'Etapa de conclusão', desc: 'Configure uma etapa como "Conclusão" para que tarefas nela sejam automaticamente marcadas como DONE e disparem e-mail de conclusão.' },
        { title: 'Importar/Exportar CSV', desc: 'Aba "Importar/Exportar" permite importar tarefas em massa via CSV. O template é fornecido para download.' },
        { title: 'Membros do projeto', desc: 'Adicione apenas os membros relevantes ao projeto para controle de visibilidade e responsabilidade.' },
        { title: 'Formulário público', desc: 'Ative em Configurações do projeto para receber demandas externas sem que o cliente precise de login.' },
        { title: 'Página compartilhável', desc: 'Projetos de Escopo Fechado com formulário público ativo exibem o botão "Compartilhar" — gera uma URL pública com Gantt, tarefas, documentos e comentários.' },
      ],
      tips: [
        'Use o campo "Cor" do projeto para identificação visual rápida na listagem.',
        'O orçamento vs realizado é calculado automaticamente com base nas horas × custo/hora do usuário.',
        'Arquivar um projeto o remove da listagem principal mas mantém todos os dados.',
      ],
    },
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    title: 'Tarefas',
    subtitle: 'Gestão de tarefas, prioridades e SLA',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    content: {
      intro: 'Tarefas são a unidade de trabalho do sistema. Cada tarefa pertence a um projeto e percorre etapas do pipeline.',
      steps: [
        { title: 'Card premium', desc: 'O card da tarefa exibe: prioridade (barra colorida lateral), descrição resumida em itálico, responsável com avatar, data de criação, dias na etapa atual e horas registradas hoje.' },
        { title: 'Prioridades', desc: 'Baixa (cinza) → Média (azul) → Alta (laranja) → Urgente (vermelho). A cor da barra lateral do card reflete a prioridade.' },
        { title: 'Status', desc: 'A Fazer → Em Progresso → Em Revisão → Concluído → Cancelado. O status é atualizado automaticamente ao mover o card no Kanban.' },
        { title: 'Tipos de tarefa + SLA', desc: 'Cada tipo pode ter um SLA em minutos. O sistema monitora se a tarefa foi concluída dentro do prazo do SLA.' },
        { title: 'Tempo no pipe', desc: 'O card mostra há quantos dias a tarefa está na etapa atual. Acima de 3 dias = azul, acima de 7 = âmbar — sinal de atenção.' },
        { title: 'Horas hoje', desc: 'Se houver registros de horas hoje para a tarefa, o card exibe em verde. Útil para ver quem está trabalhando no quê agora.' },
        { title: 'Anexos', desc: 'Adicione arquivos ao criar ou editar uma tarefa. Disponíveis para download no detalhe da tarefa.' },
        { title: 'Histórico', desc: 'Toda alteração (etapa, responsável, prioridade) é registrada automaticamente no histórico da tarefa.' },
        { title: 'Confirmar conclusão', desc: 'Ao avançar para a etapa de conclusão, um dialog solicita a data de conclusão (padrão: hoje). Essa data é registrada para o relatório de assertividade de SLA — comparando prazo do SLA com a data real de conclusão.' },
        { title: 'Prazo SLA no modal', desc: 'Ao criar uma tarefa no Kanban, selecionar um Tipo de Tarefa exibe automaticamente o prazo estimado de entrega calculado pelo SLA (ex: "Prazo SLA: 15/04/2026 — 8h").' },
      ],
      scenarios: [
        {
          title: 'Cenário: Priorização de backlog',
          steps: [
            'Filtre tarefas em Minhas Tarefas por prioridade "Urgente" ou "Alta".',
            'No Kanban, identifique cards com barra vermelha (Urgente) ou laranja (Alta).',
            'Cards com âmbar no "tempo no pipe" estão parados há mais de 7 dias — investigar.',
            'Cards sem responsável têm o ícone de avatar pontilhado — atribua alguém.',
          ],
        },
      ],
      tips: [
        'Use a descrição da tarefa — ela aparece em itálico no card, ajudando o time a entender o contexto sem abrir o detalhe.',
        'Configure tipos de tarefa com SLA para medir performance por categoria.',
        'O campo "Solicitante" (nome + e-mail) é preenchido automaticamente quando a tarefa vem do formulário público.',
      ],
    },
  },
  {
    id: 'time',
    icon: Clock,
    title: 'Registro de Horas',
    subtitle: 'Lançamento, custo e acompanhamento de tempo',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    content: {
      intro: 'O módulo de tempo registra horas trabalhadas por projeto e tarefa. O custo é calculado automaticamente (horas × valor/hora do usuário).',
      steps: [
        { title: 'Registrar entrada', desc: 'Em Tempo → Nova Entrada: selecione projeto, tarefa, data, duração (em minutos) e descrição opcional.' },
        { title: 'Custo automático', desc: 'O sistema captura o custo/hora do usuário no momento do lançamento (campo hourlyCost em Equipe) e armazena em costSnapshot.' },
        { title: 'Minhas Horas', desc: 'O menu "Minhas Horas" mostra apenas as entradas do usuário logado, com totais por período.' },
        { title: 'Relatório de consumo', desc: 'Em Relatórios → Consumo de Horas: filtre por projeto, usuário e período. Agrupa por usuário com totais.' },
      ],
      warnings: [
        'Configure o custo/hora de cada usuário em Equipe antes de lançar horas. Sem isso, o custo ficará zerado.',
        'Uma vez salvo, o custo (costSnapshot) não é recalculado automaticamente se o valor/hora mudar — isso é intencional para auditoria.',
      ],
      tips: [
        'Lance horas no mesmo dia para manter o relatório de "horas hoje" preciso nos cards do Kanban.',
        'Use o filtro de período no relatório de consumo para exportar dados de um sprint ou mês específico.',
      ],
    },
  },
  {
    id: 'team',
    icon: Users,
    title: 'Equipe',
    subtitle: 'Usuários, papéis e convites',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    content: {
      intro: 'Gerencie quem tem acesso ao sistema e quais permissões cada pessoa possui.',
      roles: [
        { role: 'Owner', access: 'Acesso total. Pode excluir a organização, gerenciar todos os usuários e configurações.' },
        { role: 'Admin', access: 'Pode criar/editar projetos, convidar usuários, editar configurações da organização.' },
        { role: 'Member', access: 'Pode ver e editar projetos e tarefas. Vê apenas o dashboard próprio (Minhas Tarefas, Minhas Horas).' },
        { role: 'Viewer', access: 'Somente leitura. Vê projetos e equipe, mas não pode criar ou editar nada.' },
      ],
      steps: [
        { title: 'Convidar usuário', desc: 'Em Equipe → Convidar: informe o e-mail e o papel. O usuário recebe um link de convite por e-mail para criar a conta.' },
        { title: 'Custo/hora', desc: 'Em Equipe → edite o usuário para definir o valor/hora. Esse valor é usado nos cálculos de custo de projeto.' },
        { title: 'Desativar usuário', desc: 'Usuários inativos não aparecem nas seleções de responsável mas mantêm histórico de tarefas e horas.' },
      ],
      warnings: [
        'Apenas Owner e Admin podem alterar papéis. Membros não podem se autopromover.',
      ],
    },
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Relatórios',
    subtitle: 'Análise por período, projeto e usuário',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    content: {
      intro: 'O módulo de relatórios oferece 5 visões analíticas, todas com filtros de período para auditoria precisa.',
      steps: [
        { title: 'Posição Resumida', desc: 'Visão geral da operação: total de projetos, tarefas, horas e custo. Filtro de período por data de criação/lançamento.' },
        { title: 'Consumo de Horas', desc: 'Horas registradas por projeto, usuário e período. Agrupa por usuário com subtotais e custo.' },
        { title: 'Alocação de Usuários', desc: 'Total de horas por usuário no mês selecionado + tarefas em andamento por pessoa.' },
        { title: 'Tarefas Atrasadas', desc: 'Lista tarefas com prazo vencido e não concluídas. Filtros: projeto, prazo a partir de, prazo até.' },
        { title: 'Situação de Projetos', desc: 'Saúde de cada projeto: progresso %, horas, custo, orçamento vs realizado, tarefas atrasadas. Filtros: status, tipo, período de criação.' },
      ],
      scenarios: [
        {
          title: 'Cenário: Auditoria mensal',
          steps: [
            'Abra "Consumo de Horas", selecione o projeto e defina o período (1º ao último dia do mês).',
            'Exporte ou anote as horas por usuário para confrontar com folha de pagamento.',
            'Abra "Situação de Projetos" e filtre por status "Ativo" para ver orçamento vs realizado.',
            'Abra "Tarefas Atrasadas" sem filtro de prazo para ver todas as pendências em aberto.',
          ],
        },
      ],
      tips: [
        'Todos os relatórios têm filtro de período — use-o para isolar dados de um sprint, mês ou trimestre.',
        'O relatório "Posição Resumida" mostra dados globais da organização, não por projeto.',
      ],
    },
  },
  {
    id: 'gantt',
    icon: GanttChartSquare,
    title: 'Gantt e Página Pública',
    subtitle: 'Cronograma visual e compartilhamento com clientes',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    content: {
      intro: 'Projetos de Escopo Fechado têm uma visão de Gantt e uma página pública para transparência com clientes.',
      steps: [
        { title: 'Acessar o Gantt', desc: 'No projeto de Escopo Fechado, clique na aba "Gantt". O cronograma exibe todas as tarefas como barras horizontais na linha do tempo.' },
        { title: 'Leitura do Gantt', desc: 'Cada barra representa uma tarefa: começo = createdAt, fim = dueDate. A linha azul vertical indica hoje. Barras âmbar/vermelhas indicam atraso.' },
        { title: 'Cores e prioridade', desc: 'A borda da barra reflete a prioridade. A cor de fundo reflete o status (verde = concluído, azul = em progresso, etc.).' },
        { title: 'Tooltip do Gantt', desc: 'Passe o mouse sobre uma barra para ver: título, responsável, prazo, data de conclusão e status.' },
        { title: 'Página pública', desc: 'Com "Formulário Público" ativo no projeto, o botão "Compartilhar" aparece no header. A URL gerada é acessível sem login.' },
        { title: 'Conteúdo da página pública', desc: 'A página pública exibe: Visão Geral (stats, pipeline), Gantt, Tarefas (com filtro), Documentos (para download) e Comentários da equipe.' },
      ],
      warnings: [
        'A página pública é acessível a qualquer pessoa com o link — não compartilhe se houver informações confidenciais.',
        'Tarefas sem dueDate aparecem como barras de 1 dia no Gantt. Defina prazos para uma visualização mais precisa.',
      ],
      tips: [
        'Use o Gantt durante reuniões de progresso com o cliente — abra a página pública e mostre ao vivo.',
        'Comentários da equipe ficam visíveis na página pública. Use para comunicar marcos importantes ao cliente.',
      ],
    },
  },
  {
    id: 'agent',
    icon: Bot,
    title: 'Agente de Suporte com IA',
    subtitle: 'Chatbot inteligente para atendimento público',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    content: {
      intro: 'O agente de suporte usa IA (OpenAI GPT-4o) para responder perguntas, criar tarefas e consultar o status do projeto via chat.',
      steps: [
        { title: 'Criar agente', desc: 'Em "Agente de Suporte" → Novo Agente: defina nome, personalidade, tom de voz e o prompt de conduta. Vincule a um projeto.' },
        { title: 'Configurar comportamento', desc: 'O campo "Prompt de Conduta" define como o agente se comporta. Ex: "Você é o suporte da empresa X, responda apenas sobre nossos produtos."' },
        { title: 'Capacidades automáticas', desc: 'O agente pode: criar tarefas no projeto vinculado, consultar status de tarefas por ID, ver métricas do projeto e buscar artigos na base de conhecimento.' },
        { title: 'Suporte multimodal', desc: 'O usuário pode enviar imagens (GPT-4 vision), áudios (transcritos por Whisper) e PDFs (título + nota contextual).' },
        { title: 'Embeds externos', desc: 'O script widget (`/agent-widget.js`) pode ser embutido em qualquer site com `data-agent` e `data-origin`.' },
        { title: 'Sessão do visitante', desc: 'Cada visitante tem uma sessão persistida no localStorage. O histórico é mantido entre recargas da página.' },
      ],
      scenarios: [
        {
          title: 'Cenário: Atendimento ao cliente SaaS',
          steps: [
            'Crie um projeto "Suporte Clientes" do tipo Contínuo.',
            'Configure tipos de tarefa com SLA (Bug = 4h, Feature = 48h, Dúvida = 24h).',
            'Crie um agente vinculado ao projeto e configure o prompt de conduta.',
            'Adicione artigos na Base de Conhecimento para o agente consultar.',
            'Instale o widget no seu site. Clientes abrem o chat e o agente cria tarefas automaticamente.',
            'Monitore as tarefas criadas pelo agente no Kanban do projeto.',
          ],
        },
      ],
      warnings: [
        'Mantenha o OPENAI_API_KEY configurado no .env para que o agente funcione.',
        'O agente usa GPT-4o que gera custos por token — monitore o uso na OpenAI Dashboard.',
      ],
    },
  },
  {
    id: 'knowledge',
    icon: BookMarked,
    title: 'Base de Conhecimento',
    subtitle: 'Documentação interna, pública e gerada por IA',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    content: {
      intro: 'A base de conhecimento armazena artigos internos e pode ser tornada pública para consulta externa e pelo agente de IA. Tarefas concluídas podem ser convertidas em artigos automaticamente com IA.',
      steps: [
        { title: 'Categorias', desc: 'Organize artigos em categorias. Cada categoria pode ser marcada como pública ou interna.' },
        { title: 'Artigos', desc: 'Escreva artigos com título e conteúdo em markdown. Artigos podem ficar em Rascunho ou ser Publicados.' },
        { title: 'KB Pública', desc: 'Em Configurações da organização, ative a KB pública. Ela ficará acessível externamente e será usada pelo agente.' },
        { title: 'Integração com IA', desc: 'O agente de suporte usa a KB como fonte de conhecimento. Artigos publicados são indexados para o agente buscar.' },
        { title: 'Gerar Artigo com IA', desc: 'Em uma tarefa com status Concluído, clique em "Gerar Artigo KB" (botão roxo). A IA usa título, descrição, comentários e anexos para criar um artigo estruturado em markdown. Você revisa, edita, escolhe a categoria e publica.' },
      ],
      tips: [
        'Escreva artigos sobre perguntas frequentes antes de ativar o agente — isso melhora muito a qualidade das respostas.',
        'Use categorias separadas para público (FAQ, Tutoriais) e interno (Processos, Runbooks).',
        'A geração de artigos por IA é mais útil em tarefas bem documentadas — descrição detalhada e comentários ricos geram artigos melhores.',
      ],
    },
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Configurações',
    subtitle: 'Organização, integrações e personalizações',
    color: 'text-zinc-400',
    bg: 'bg-zinc-700/30',
    content: {
      intro: 'As configurações centralizam dados da organização, tipos de tarefa padrão e aparência.',
      steps: [
        { title: 'Dados da organização', desc: 'Nome, slug (URL), logo (quadrado ou horizontal), timezone, site.' },
        { title: 'Logo horizontal', desc: 'Para logos largas (tipo banner), ative "Horizontal" para que seja exibida corretamente na sidebar.' },
        { title: 'Tipo de tarefa padrão', desc: 'Define qual tipo de tarefa é pré-selecionado ao criar novas tarefas no Kanban.' },
        { title: 'KB pública', desc: 'Ativa a base de conhecimento pública acessível externamente.' },
        { title: 'Tipos de tarefa', desc: 'Gerencie os tipos com nome e SLA em minutos. São usados para categorizar tarefas e medir performance.' },
      ],
      warnings: [
        'O slug da organização é usado nas URLs públicas (KB, agente). Altere com cuidado — links antigos deixam de funcionar.',
      ],
    },
  },
]

function SectionCard({ section, isOpen, onToggle }: { section: Section; isOpen: boolean; onToggle: () => void }) {
  const Icon = section.icon

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isOpen ? 'border-zinc-700/60' : 'border-zinc-800/60'}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-zinc-900/40 transition-colors"
      >
        <div className={`w-10 h-10 ${section.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${section.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-200">{section.title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{section.subtitle}</p>
        </div>
        {isOpen
          ? <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        }
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-5 border-t border-zinc-800/40">
          {/* Intro */}
          <p className="text-sm text-zinc-400 leading-relaxed mt-4 mb-4">{section.content.intro}</p>

          {/* Steps */}
          {section.content.steps && (
            <div className="space-y-2 mb-4">
              {section.content.steps.map((step, i) => (
                <div key={i} className="flex gap-3 p-3 bg-zinc-900/40 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-5 h-5 ${section.bg} rounded-md flex items-center justify-center`}>
                      <span className={`text-[9px] font-bold ${section.color}`}>{String(i + 1).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-300 mb-0.5">{step.title}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Roles */}
          {section.content.roles && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-400">Papéis e Permissões</span>
              </div>
              <div className="space-y-1.5">
                {section.content.roles.map((r, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-zinc-900/40 rounded-lg">
                    <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded flex-shrink-0">{r.role}</span>
                    <p className="text-xs text-zinc-500">{r.access}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scenarios */}
          {section.content.scenarios && (
            <div className="space-y-3 mb-4">
              {section.content.scenarios.map((sc, i) => (
                <div key={i} className="border border-zinc-800/60 rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-xs font-semibold text-zinc-300">{sc.title}</p>
                  </div>
                  <ol className="space-y-1.5">
                    {sc.steps.map((step, j) => (
                      <li key={j} className="flex gap-2 text-xs text-zinc-400">
                        <span className="text-zinc-600 flex-shrink-0 tabular-nums">{j + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {section.content.warnings && (
            <div className="space-y-2 mb-4">
              {section.content.warnings.map((w, i) => (
                <div key={i} className="flex gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/80 leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          {section.content.tips && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-500">Dicas</span>
              </div>
              {section.content.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 p-2.5 bg-zinc-900/40 rounded-lg">
                  <ArrowRight className="w-3 h-3 text-zinc-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-500 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<string>('start')

  const toggleSection = (id: string) => {
    setOpenSection(prev => prev === id ? '' : id)
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Manual do Sistema</h1>
            <p className="text-sm text-zinc-500">Documentação completa de todos os módulos do ProjectFlow</p>
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-in">
        {sections.map(s => {
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => setOpenSection(s.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                openSection === s.id
                  ? 'border-zinc-600 bg-zinc-800/60 text-zinc-200'
                  : 'border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/60'
              }`}
            >
              <Icon className="w-3 h-3" />
              {s.title}
            </button>
          )
        })}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, i) => (
          <div key={section.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <SectionCard
              section={section}
              isOpen={openSection === section.id}
              onToggle={() => toggleSection(section.id)}
            />
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-8 p-4 bg-zinc-900/40 border border-zinc-800/40 rounded-xl flex items-start gap-3">
        <Info className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-0.5">Sobre o ProjectFlow</p>
          <p className="text-xs text-zinc-600 leading-relaxed">
            ProjectFlow é uma ferramenta de inteligência operacional para equipes de tecnologia. Stack: Next.js + React + TypeScript + Prisma + Supabase Auth + OpenAI + Resend.
            Para suporte técnico, consulte a documentação do código ou entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  )
}
