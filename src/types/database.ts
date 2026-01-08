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
  role: 'aluno' | 'admin'
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


