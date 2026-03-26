/**
 * Tipos TypeScript para as tabelas do Supabase
 * 
 * Gerados baseados no schema do banco de dados.
 * Atualizar quando o schema mudar.
 */

export interface DatabaseUser {
  id: string
  email: string
  name: string
  role: 'aluno' | 'formacao' | 'admin'
  access_level: 'full' | 'limited'
  level: number
  xp: number
  xp_mensal: number
  coins: number
  streak: number
  avatar_url?: string | null
  bio?: string | null
  created_at: string
  updated_at: string
}

export interface DatabaseQuiz {
  id: string
  titulo: string
  descricao: string
  tecnologia: string
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  questoes: any[] // JSONB - array de perguntas
  xp: number
  disponivel: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface DatabaseDesafio {
  id: string
  titulo: string
  descricao: string
  tecnologia: string
  dificuldade: 'iniciante' | 'intermediario' | 'avancado'
  xp: number
  periodicidade: 'semanal' | 'mensal' | 'especial'
  prazo: string | null
  requisitos: any[] // JSONB - array de requisitos
  passos: any[] // JSONB - guia passo-a-passo (array de { titulo, detalhes })
  curso_id?: string | null // ID do curso/formação vinculado: 'android', 'frontend', 'backend', 'ios', 'analise-dados', 'norte-tech', 'logica-programacao', ou null para desafios gerais
  gerado_por_ia?: boolean // Se foi gerado pela IA
  solicitado_por?: string | null // ID do usuário que solicitou o desafio (se gerado por IA)
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface DatabaseDesafioSubmission {
  id: string
  user_id: string
  desafio_id: string
  github_url: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  admin_notes?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
}

// Tipo com dados do usuário para listagem no admin
export interface DesafioSubmissionWithUser extends DatabaseDesafioSubmission {
  user?: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
    xp?: number
    level?: number
    ranking_position?: number | null
  }
  desafio?: {
    id: string
    titulo: string
    tecnologia: string
    xp: number
    requisitos?: any[]
  }
}

export interface DatabaseNotificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'update' | 'warning'
  data_inicio: string
  data_fim: string
  publico_alvo: 'todos' | 'alunos-full' | 'alunos-limited'
  target_user_id?: string | null // Se preenchido, notificação individual
  related_desafio_id?: string | null // Referência ao desafio (se aplicável)
  action_url?: string | null // URL para navegação quando a notificação é clicada
  is_sugestao_bug?: boolean | null // Indica se é sugestão/bug enviada por aluno
  imagem_url?: string | null // URL da imagem anexada (para sugestões/bugs)
  created_at: string
  updated_at: string
  created_by: string | null
}

// Notificação com dados do usuário que criou (para sugestões/bugs)
export interface NotificacaoWithUser extends DatabaseNotificacao {
  user?: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
    level?: number
  }
}

// Pergunta do formulário
export interface FormularioPergunta {
  id: string
  texto: string
  tipo: 'texto' | 'multipla_escolha' | 'checkbox' | 'escala'
  opcoes?: string[] // Para múltipla escolha e checkbox
  obrigatoria: boolean
  pontos?: number // Pontos ganhos ao responder (opcional)
}

export interface DatabaseFormulario {
  id: string
  nome: string
  tipo: string
  ativo: boolean
  perguntas?: FormularioPergunta[] // JSONB - array de perguntas (opcional para retrocompatibilidade)
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface DatabaseFormularioResposta {
  id: string
  formulario_id: string
  user_id: string
  respostas: any // JSONB
  created_at: string
}

export interface DatabaseUserQuizProgress {
  id: string
  user_id: string
  quiz_id: string
  completo: boolean
  pontuacao: number | null
  tentativas: number
  melhor_pontuacao: number | null
  created_at: string
  updated_at: string
}

export interface DatabaseUserDesafioProgress {
  id: string
  user_id: string
  desafio_id: string
  completo: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseUserXpHistory {
  id: string
  user_id: string
  source: 'aula' | 'quiz' | 'desafio' | 'comunidade'
  source_id: string | null
  amount: number
  description: string | null
  created_at: string
}

export interface DatabasePergunta {
  id: string
  titulo: string
  descricao: string
  autor_id: string
  tags: string[]
  categoria: string | null
  votos: number
  visualizacoes: number
  resolvida: boolean
  melhor_resposta_id: string | null
  imagem_url: string | null
  created_at: string
  updated_at: string
}

export interface DatabaseResposta {
  id: string
  pergunta_id: string
  autor_id: string
  conteudo: string
  votos: number
  melhor_resposta: boolean
  resposta_pai_id: string | null
  mencoes: string[]
  imagem_url?: string | null
  created_at: string
  updated_at: string
}

// -----------------------------
// Norte Tech Test (Mapa de Carreira)
// -----------------------------

/** Formações que a IA pode sugerir (exclui norte-tech e logica-programacao) */
export type NorteTechTestFormacaoSugerida =
  | 'android'
  | 'frontend'
  | 'backend'
  | 'ios'
  | 'analise-dados'
  | 'ainda_explorando'

export interface NorteTechTestResultadoIA {
  formacao_sugerida: NorteTechTestFormacaoSugerida
  confianca: number // 1-10
  resumo: string | null
  proximos_passos: string | null
  analisado_em: string // ISO timestamp
}

/** Respostas do aluno por etapa (estrutura livre para flexibilidade) */
export interface NorteTechTestRespostasData {
  etapa_atual?: number
  // Etapa 1 - Antes de começar
  por_que_entrei?: string
  o_que_assusta?: string
  areas_interesse?: string[] // ids: android, frontend, etc.
  avaliacoes_areas?: { area: string; avaliacao: number }[] // 1-5
  // Etapa 2 - Decisão final / reflexão
  o_que_aprendi?: string
  o_que_surpreendeu?: string
  mais_confiante?: boolean | null
  // Etapa 3 - Comparando áreas
  area_mais_gostei_praticar?: string
  area_mais_energia?: string
  area_dificil_interessante?: string
  area_menos_gostei?: string
  area_uma_so_6_meses?: string
  // Etapa 4 - Minha decisão
  area_escolhida?: string
  porque_escolhi?: string
  // Etapa 5 - Próximo passo
  o_que_aprender?: string
  proximo_passo_concreto?: string
  quando_comeco?: string
  // Etapa 6 - Compromisso
  texto_compromisso?: string
  data_entrar_formacao?: string | null
  data_fazer_projeto?: string | null
  data_post_linkedin?: string | null
}

export interface DatabaseNorteTechTestResposta {
  id: string
  user_id: string
  respostas: NorteTechTestRespostasData
  resultado_ia: NorteTechTestResultadoIA | null
  created_at: string
  updated_at: string
}

// Feedback por área (obrigatório antes da análise)
export type NorteTechTestAreaId =
  | 'android'
  | 'frontend'
  | 'backend'
  | 'ios'
  | 'analise-dados'

export interface NorteTechTestAreaRespostasData {
  curti_praticar?: number // 1-5
  energia?: number // 1-5
  dificuldade?: number // 1-5
  confianca?: number // 1-5
  me_vejo_6_meses?: 'sim' | 'nao' | 'talvez'
  o_que_mais_gostei?: string
  o_que_foi_mais_dificil?: string
  comentario_livre?: string
}

export interface DatabaseNorteTechTestAreaResposta {
  id: string
  user_id: string
  area_id: NorteTechTestAreaId
  respostas: NorteTechTestAreaRespostasData
  created_at: string
  updated_at: string
}

export interface OpenAITokenUsage {
  id: string
  user_id: string
  feature: string
  endpoint: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  metadata?: Record<string, any>
  created_at: string
}

// -----------------------------
// Mentorias
// -----------------------------

export type MentoriaStatus = 'ativa' | 'pausada' | 'finalizada'

export type MentoriaStepStatus = 'nao_iniciado' | 'em_progresso' | 'concluido'

export interface DatabaseMentoria {
  id: string
  mentor_id: string
  mentorado_id: string
  objetivo_principal: string
  status: MentoriaStatus
  created_at: string
  updated_at: string
}

export interface DatabaseMentoriaStep {
  id: string
  mentoria_id: string
  titulo: string
  descricao: string
  ordem: number
  status: MentoriaStepStatus
  habilitado: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseMentoriaTarefaLink {
  label: string
  url: string
}

export interface DatabaseMentoriaTarefa {
  id: string
  step_id: string
  titulo: string
  descricao: string
  links?: DatabaseMentoriaTarefaLink[]
  concluida: boolean
  created_at: string
}

export interface DatabaseMentoriaInteresse {
  id: string
  user_id: string
  mensagem: string | null
  status: 'pendente' | 'em_analise' | 'aprovado' | 'recusado'
  created_at: string
}

// Tipo agregado para uso na UI do aluno
export interface MentoriaWithSteps extends DatabaseMentoria {
  mentor?: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
  }
  mentorado?: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
  }
  steps: (DatabaseMentoriaStep & { tarefas: DatabaseMentoriaTarefa[] })[]
  progressPercent: number
}


