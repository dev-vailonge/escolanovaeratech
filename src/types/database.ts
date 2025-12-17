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
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface DatabaseNotificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'update' | 'warning'
  data_inicio: string
  data_fim: string
  publico_alvo: 'todos' | 'alunos-full' | 'alunos-limited'
  action_url?: string | null // URL para navegação quando a notificação é clicada
  created_at: string
  updated_at: string
  created_by: string | null
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
  created_at: string
  updated_at: string
}

export interface DatabaseHotmartSubscription {
  id: string
  user_id: string
  hotmart_transaction_id: string
  product_id: string
  status: 'active' | 'cancelled' | 'expired'
  access_level: 'full' | 'limited'
  created_at: string
  updated_at: string
  expires_at: string | null
}


